"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ApiKeyStatus } from "@/types/index";

export function useApiKeyStatus() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["api-key-status"],
    queryFn: () => apiFetch<ApiKeyStatus>("/user/api-key/status"),
    retry: false,
  });

  const hasAnyKey =
    (data?.anthropic?.has_key ?? false) || (data?.gemini?.has_key ?? false);

  return {
    loading: isLoading,
    // Legacy: true if any provider has a key
    hasKey: hasAnyKey,
    // Per-provider
    hasAnthropicKey: data?.anthropic?.has_key ?? false,
    hasGeminiKey: data?.gemini?.has_key ?? false,
    activeProvider: data?.active_provider ?? null,
    data,
    refetch,
  };
}
