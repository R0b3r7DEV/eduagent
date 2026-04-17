"use client";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Task } from "@/types/index";

export function useTasks() {
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => apiFetch<Task[]>("/tasks"),
    retry: false,
  });
  return { tasks, isLoading, error, refetch };
}
