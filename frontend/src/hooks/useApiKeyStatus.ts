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
  return { loading: isLoading, hasKey: data?.has_key ?? null, source: data?.source ?? null, refetch };
}
