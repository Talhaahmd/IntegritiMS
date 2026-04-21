"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeamMember } from "@/types";

export function useTeamMembers() {
  const [data, setData] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: members } = await sb
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false });

    if (!members) { setLoading(false); return; }

    const enriched = await Promise.all(
      members.map(async (m) => {
        const [{ count: active }, { count: completed }, { count: delayed }] = await Promise.all([
          sb.from("task_assignments").select("*", { count: "exact", head: true })
            .eq("team_member_id", m.id)
            .not("status", "in", '("completed","cancelled")'),
          sb.from("task_assignments").select("*", { count: "exact", head: true })
            .eq("team_member_id", m.id)
            .eq("status", "completed"),
          sb.from("task_assignments").select("*", { count: "exact", head: true })
            .eq("team_member_id", m.id)
            .eq("status", "delayed"),
        ]);
        const { data: hours } = await sb
          .from("task_assignments")
          .select("estimated_hours, actual_hours, status")
          .eq("team_member_id", m.id);

        const est = (hours ?? []).reduce((s, r) => s + (r.estimated_hours ?? 0), 0);
        const act = (hours ?? []).reduce((s, r) => s + (r.actual_hours ?? 0), 0);

        // on_time: completed assignments where actual_hours <= estimated_hours * 1.1
        const completedHours = (hours ?? []).filter((r) => r.status === "completed");
        const onTimeCount = completedHours.filter(
          (r) => (r.actual_hours ?? 0) <= (r.estimated_hours ?? 0) * 1.1
        ).length;
        const on_time_rate = completedHours.length > 0
          ? Math.round((onTimeCount / completedHours.length) * 100)
          : 0;

        return {
          ...m,
          active_tasks: active ?? 0,
          completed_tasks: completed ?? 0,
          delayed_tasks: delayed ?? 0,
          total_assigned_hours: est,
          actual_worked_hours: act,
          on_time_rate,
        };
      })
    );

    setData(enriched as TeamMember[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useTeamMember(id: string) {
  const [data, setData] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("team_members")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data: m }) => {
        setData(m as TeamMember);
        setLoading(false);
      });
  }, [id]);

  return { data, loading };
}

export function useMemberTasks(memberId: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId) return;
    createClient()
      .from("task_assignments")
      .select("*, tasks(id, name, status, priority, category, expected_end, project_id, projects(name))")
      .eq("team_member_id", memberId)
      .order("created_at", { ascending: false })
      .then(({ data: assignments }) => {
        setData((assignments as Record<string, unknown>[]) ?? []);
        setLoading(false);
      });
  }, [memberId]);

  return { data, loading };
}

export async function createTeamMemberRecord(values: Partial<TeamMember>) {
  const sb = createClient();
  const { data, error } = await sb.from("team_members").insert(values).select().single();
  return { data, error };
}

export async function updateTeamMemberRecord(id: string, values: Partial<TeamMember>) {
  const sb = createClient();
  const { data, error } = await sb.from("team_members").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteTeamMemberRecord(id: string) {
  const sb = createClient();
  const { error } = await sb.from("team_members").delete().eq("id", id);
  return { error };
}
