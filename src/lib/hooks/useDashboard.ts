"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useDashboardStats() {
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      // const now = new Date().toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [
        { count: activeClients },
        { count: activeProjects },
        { count: pendingTasks },
        { count: completedTasks },
        { count: overdueTasks },
        { count: waitingClients },
        { count: tasksToday },
      ] = await Promise.all([
        sb.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
        sb.from("projects").select("*", { count: "exact", head: true }).in("status", ["active", "in progress"]),
        sb.from("tasks").select("*", { count: "exact", head: true }).not("status", "in", '("completed","cancelled")'),
        sb.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
        sb.from("tasks").select("*", { count: "exact", head: true }).eq("overdue", true),
        sb.from("clients").select("*", { count: "exact", head: true }).eq("waiting_for_update", true),
        sb.from("tasks").select("*", { count: "exact", head: true })
          .gte("expected_start", todayStart.toISOString())
          .lte("expected_start", todayEnd.toISOString()),
      ]);

      setData({
        activeClients: activeClients ?? 0,
        activeProjects: activeProjects ?? 0,
        pendingTasks: pendingTasks ?? 0,
        completedTasks: completedTasks ?? 0,
        overdueTasks: overdueTasks ?? 0,
        waitingClients: waitingClients ?? 0,
        tasksToday: tasksToday ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  return { data, loading };
}

export function useRecentActivity() {
  const [data, setData] = useState<{ entity_type: string; action: string; description: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    createClient()
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data: rows }) => {
        setData(rows ?? []);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

export function useUpcomingDeadlines() {
  const [data, setData] = useState<{ id: string; name: string; due_date: string; status: string; client?: { name: string } }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const future = new Date();
    future.setDate(future.getDate() + 14);
    createClient()
      .from("projects")
      .select("id, name, due_date, status, clients(name)")
      .lte("due_date", future.toISOString().split("T")[0])
      .not("status", "in", '("completed","cancelled")')
      .order("due_date", { ascending: true })
      .limit(6)
      .then(({ data: rows }) => {
        const mapped = (rows ?? []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.name as string,
          due_date: r.due_date as string,
          status: r.status as string,
          client: Array.isArray(r.clients) ? r.clients[0] : r.clients as { name: string } | undefined,
        }));
        setData(mapped);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}

export function useTeamPerformance() {
  const [data, setData] = useState<{ name: string; expected: number; actual: number; rate: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const { data: members } = await sb
        .from("team_members")
        .select("id, full_name")
        .limit(7);

      if (!members) { setLoading(false); return; }

      const results = await Promise.all(
        members.map(async (m) => {
          const { data: assignments } = await sb
            .from("task_assignments")
            .select("estimated_hours, actual_hours, status")
            .eq("team_member_id", m.id);

          const rows = assignments ?? [];
          const expected = rows.reduce((s, r) => s + (r.estimated_hours ?? 0), 0);
          const actual = rows.reduce((s, r) => s + (r.actual_hours ?? 0), 0);
          const completed = rows.filter((r) => r.status === "completed").length;
          const onTime = rows.filter((r) => r.status === "completed" && r.actual_hours <= r.estimated_hours * 1.1).length;
          const rate = completed > 0 ? Math.round((onTime / completed) * 100) : 0;

          return { name: m.full_name, expected, actual, rate };
        })
      );

      setData(results);
      setLoading(false);
    }
    load();
  }, []);

  return { data, loading };
}

export function useProjectStatusBreakdown() {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const statuses = ["not started", "active", "in progress", "on hold", "completed", "delayed", "cancelled"];
      const colors: Record<string, string> = {
        "not started": "#94A3B8",
        "active": "#6366F1",
        "in progress": "#6366F1",
        "on hold": "#F59E0B",
        "completed": "#10B981",
        "delayed": "#EF4444",
        "cancelled": "#CBD5E1",
      };

      const counts = await Promise.all(
        statuses.map(async (s) => {
          const { count } = await sb.from("projects").select("*", { count: "exact", head: true }).eq("status", s);
          return { name: s.charAt(0).toUpperCase() + s.slice(1), value: count ?? 0, color: colors[s] };
        })
      );

      setData(counts.filter((c) => c.value > 0));
      setLoading(false);
    }
    load();
  }, []);

  return { data, loading };
}

export function useWeeklyTrend() {
  const [data, setData] = useState<{ day: string; completed: number; assigned: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = createClient();
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const week = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const results = await Promise.all(
        week.map(async (d, i) => {
          const start = new Date(d);
          start.setHours(0, 0, 0, 0);
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);

          const [{ count: completed }, { count: assigned }] = await Promise.all([
            sb.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed").gte("updated_at", start.toISOString()).lte("updated_at", end.toISOString()),
            sb.from("tasks").select("*", { count: "exact", head: true }).gte("created_at", start.toISOString()).lte("created_at", end.toISOString()),
          ]);

          return { day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], completed: completed ?? 0, assigned: assigned ?? 0 };
        })
      );

      setData(results);
      setLoading(false);
    }
    load();
  }, []);

  return { data, loading };
}
