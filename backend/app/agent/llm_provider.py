"""LLM Provider abstraction — Anthropic Claude and Google Gemini.

Usage:
    provider = get_provider("anthropic", api_key)
    async for token in provider.stream(messages, system_prompt):
        ...
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, AsyncGenerator

import structlog

logger = structlog.get_logger()

if TYPE_CHECKING:
    pass


class LLMProvider(ABC):
    """Abstract base for LLM providers."""

    @abstractmethod
    async def stream(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        """Yield text tokens as they arrive from the model."""
        ...  # pragma: no cover

    @abstractmethod
    async def complete(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 512,
    ) -> str:
        """Return a single non-streamed completion."""
        ...  # pragma: no cover

    @staticmethod
    @abstractmethod
    def validate_api_key(api_key: str) -> bool:
        """Return True if *api_key* matches this provider's key format."""
        ...  # pragma: no cover


# ── Anthropic ──────────────────────────────────────────────────────────────────

class AnthropicProvider(LLMProvider):
    MAIN_MODEL = "claude-sonnet-4-6"
    FAST_MODEL = "claude-haiku-4-5-20251001"

    def __init__(self, api_key: str) -> None:
        import anthropic
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def stream(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        import anthropic

        try:
            async with self._client.messages.stream(
                model=self.MAIN_MODEL,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=messages,
            ) as s:
                async for token in s.text_stream:
                    yield token
        except anthropic.AuthenticationError:
            raise
        except Exception as exc:
            logger.error("anthropic.stream.error", error=str(exc))
            raise

    async def complete(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 512,
    ) -> str:
        resp = await self._client.messages.create(
            model=self.FAST_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
        )
        return resp.content[0].text.strip()

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        return api_key.startswith("sk-ant-")


# ── Google Gemini ──────────────────────────────────────────────────────────────

class GeminiProvider(LLMProvider):
    MAIN_MODEL = "gemini-2.0-flash"

    def __init__(self, api_key: str) -> None:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self._genai = genai

    def _model(self, system_prompt: str):
        return self._genai.GenerativeModel(
            model_name=self.MAIN_MODEL,
            system_instruction=system_prompt,
        )

    @staticmethod
    def _to_gemini(messages: list[dict]) -> list[dict]:
        """Convert Anthropic-format messages → Gemini format.

        Gemini requires: alternating user/model turns, starts with 'user'.
        Consecutive same-role messages are merged.
        """
        converted = [
            {
                "role": "model" if m["role"] == "assistant" else "user",
                "parts": [{"text": m["content"]}],
            }
            for m in messages
        ]
        # Merge consecutive same-role turns
        merged: list[dict] = []
        for turn in converted:
            if merged and merged[-1]["role"] == turn["role"]:
                merged[-1]["parts"].extend(turn["parts"])
            else:
                merged.append(turn)
        # Gemini must start with a user turn
        if merged and merged[0]["role"] == "model":
            merged.insert(0, {"role": "user", "parts": [{"text": " "}]})
        return merged

    async def stream(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 4096,
    ) -> AsyncGenerator[str, None]:
        import google.generativeai as genai

        try:
            model = self._model(system_prompt)
            cfg = genai.types.GenerationConfig(max_output_tokens=max_tokens)
            response = await model.generate_content_async(
                self._to_gemini(messages),
                stream=True,
                generation_config=cfg,
            )
            async for chunk in response:
                text = getattr(chunk, "text", None)
                if text:
                    yield text
        except Exception as exc:
            logger.error("gemini.stream.error", error=str(exc))
            raise

    async def complete(
        self,
        messages: list[dict],
        system_prompt: str,
        max_tokens: int = 512,
    ) -> str:
        import google.generativeai as genai

        model = self._model(system_prompt)
        cfg = genai.types.GenerationConfig(max_output_tokens=max_tokens)
        response = await model.generate_content_async(
            self._to_gemini(messages),
            generation_config=cfg,
        )
        return response.text.strip()

    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        return api_key.startswith("AIza")


# ── Factory ────────────────────────────────────────────────────────────────────

_PROVIDERS: dict[str, type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "gemini": GeminiProvider,
}


def get_provider(provider: str, api_key: str) -> LLMProvider:
    """Instantiate *provider* with *api_key*. Defaults to Anthropic for unknown names."""
    cls = _PROVIDERS.get(provider, AnthropicProvider)
    return cls(api_key)
