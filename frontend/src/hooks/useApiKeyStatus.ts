"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ApiKeyStatus } from "@/types/index";

type State = { loading: boolean; hasKey: boolean | null; error: boolean };

export function useApiKeyStatus() {
  const [state, setState] = useState<State>({ loading: true, hasKey: null, error: false });

  async function fetchStatus() {
    setState((s) => ({ ...s, loading: true, error: false }));
    try {
      const data = await apiFetch<ApiKeyStatus>("/user/api-key/status");
      setState({ loading: false, hasKey: data.has_key, error: false });
    } catch {
      setState({ loading: false, hasKey: null, error: true });
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  return { ...state, refetch: fetchStatus };
}
