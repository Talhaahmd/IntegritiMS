"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ScheduleBlock {
  id: string;
  team_member_id: string;
  task_assignment_id: string;
  start_datetime: string;
  end_datetime: string;
  color_code: string;
  team_member?: { id: string; full_name: string; title: string };
  task_assignment?: {
    id: string;
    status: string;
    tasks?: { id: string; name: string; category: string; priority: string; project_id: string; projects?: { name: string }; clients?: { name: string } };
  };
}

export function useSchedules(dateRange?: { start: string; end: string }) {
  const [data, setData] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = createClient()
      .from("schedules")
      .select(`
        *,
        team_members(id, full_name, title),
        task_assignments(
          id, status,
          tasks(id, name, category, priority, project_id,
            projects(name),
            clients(name)
          )
        )
      `)
      .order("start_datetime", { ascending: true });

    if (dateRange?.start) query = query.gte("start_datetime", dateRange.start);
    if (dateRange?.end) query = query.lte("end_datetime", dateRange.end);

    const { data: schedules } = await query;
    setData((schedules as ScheduleBlock[]) ?? []);
    setLoading(false);
  }, [dateRange?.start, dateRange?.end]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export async function createSchedule(values: {
  team_member_id: string;
  task_assignment_id: string;
  start_datetime: string;
  end_datetime: string;
  color_code?: string;
}) {
  const sb = createClient();
  const { data, error } = await sb.from("schedules").insert(values).select().single();
  return { data, error };
}

export async function updateSchedule(id: string, values: Partial<{ start_datetime: string; end_datetime: string; color_code: string }>) {
  const sb = createClient();
  const { data, error } = await sb.from("schedules").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteSchedule(id: string) {
  const sb = createClient();
  const { error } = await sb.from("schedules").delete().eq("id", id);
  return { error };
}
