"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Milestone } from "@/types";

export function useMilestones({ projectId, clientId }: { projectId?: string; clientId?: string }) {
  const [data, setData] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let q = createClient()
      .from("milestones")
      .select("*, tasks(id, name, status, category, priority, estimated_hours, actual_hours, expected_end, task_assignments(team_members(id, full_name, title)))")
      .order("created_at", { ascending: true });
    if (projectId) q = q.eq("project_id", projectId);
    if (clientId)  q = q.eq("client_id", clientId);
    const { data: rows } = await q;
    setData((rows as Milestone[]) ?? []);
    setLoading(false);
  }, [projectId, clientId]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, reload: load };
}

export async function createMilestoneRecord(values: Partial<Milestone>) {
  const { data, error } = await createClient().from("milestones").insert(values).select().single();
  return { data, error };
}

export async function updateMilestoneRecord(id: string, values: Partial<Milestone>) {
  const { data, error } = await createClient().from("milestones").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteMilestoneRecord(id: string) {
  const { error } = await createClient().from("milestones").delete().eq("id", id);
  return { error };
}
