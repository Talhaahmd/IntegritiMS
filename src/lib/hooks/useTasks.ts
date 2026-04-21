"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Task } from "@/types";

export function useTasks(filters?: { projectId?: string; clientId?: string; status?: string; assigneeId?: string }) {
  const [data, setData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = createClient()
      .from("tasks")
      .select("*, clients(id, name), projects(id, name), task_assignments(id, team_member_id, estimated_hours, actual_hours, status, assigned_start, assigned_end, actual_start, actual_end, team_members(id, full_name, title))")
      .order("created_at", { ascending: false });

    if (filters?.projectId) query = query.eq("project_id", filters.projectId);
    if (filters?.clientId) query = query.eq("client_id", filters.clientId);
    if (filters?.status) query = query.eq("status", filters.status);

    const { data: rawTasks } = await query;
    // Normalise: Supabase returns the join as "task_assignments"; our type uses "assignments"
    const mapped = (rawTasks ?? []).map((t: Record<string, unknown>) => ({
      ...t,
      assignments: (t.task_assignments as unknown[] ?? []),
    }));
    setData(mapped as Task[]);
    setLoading(false);
  }, [filters?.projectId, filters?.clientId, filters?.status]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useTask(id: string) {
  const [data, setData] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("tasks")
      .select("*, clients(id, name), projects(id, name), task_assignments(*, team_members(id, full_name, title, primary_skill))")
      .eq("id", id)
      .single()
      .then(({ data: t }) => {
        setData(t as Task);
        setLoading(false);
      });
  }, [id]);

  return { data, loading };
}

export async function createTaskRecord(values: Partial<Task>) {
  const sb = createClient();
  const { data, error } = await sb.from("tasks").insert(values).select().single();
  return { data, error };
}

export async function updateTaskRecord(id: string, values: Partial<Task>) {
  const sb = createClient();
  const { data, error } = await sb.from("tasks").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteTaskRecord(id: string) {
  const sb = createClient();
  const { error } = await sb.from("tasks").delete().eq("id", id);
  return { error };
}

export async function assignTask(taskId: string, memberId: string, values: Record<string, unknown>) {
  const sb = createClient();
  const { data, error } = await sb.from("task_assignments").upsert({
    task_id: taskId,
    team_member_id: memberId,
    ...values,
  }).select().single();
  return { data, error };
}
