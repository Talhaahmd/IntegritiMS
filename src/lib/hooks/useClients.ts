"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Client } from "@/types";

export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: clients } = await sb
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (!clients) { setLoading(false); return; }

    // Aggregate project and task counts
    const enriched = await Promise.all(
      clients.map(async (c) => {
        const [
          { count: activeProjects },
          { count: totalTasks },
          { count: overdueTasks },
        ] = await Promise.all([
          sb.from("projects").select("*", { count: "exact", head: true }).eq("client_id", c.id).in("status", ["active", "in progress"]),
          sb.from("tasks").select("*", { count: "exact", head: true }).eq("client_id", c.id),
          sb.from("tasks").select("*", { count: "exact", head: true }).eq("client_id", c.id).eq("overdue", true),
        ]);
        return {
          ...c,
          active_projects: activeProjects ?? 0,
          total_tasks: totalTasks ?? 0,
          overdue_tasks: overdueTasks ?? 0,
        };
      })
    );

    setData(enriched as Client[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useClient(id: string) {
  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const sb = createClient();
    sb.from("clients").select("*").eq("id", id).single().then(({ data: client }) => {
      setData(client as Client);
      setLoading(false);
    });
  }, [id]);

  return { data, loading };
}

export function useClientProjects(clientId: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    createClient()
      .from("projects")
      .select("*, tasks(count)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data: projects }) => {
        setData((projects as Record<string, unknown>[]) ?? []);
        setLoading(false);
      });
  }, [clientId]);

  return { data, loading };
}

export function useClientActivity(clientId: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    createClient()
      .from("activity_logs")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data: logs }) => {
        setData((logs as Record<string, unknown>[]) ?? []);
        setLoading(false);
      });
  }, [clientId]);

  return { data, loading };
}

export function useClientNotes(clientId: string) {
  const [data, setData] = useState<{ id: string; content: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!clientId) return;
    createClient()
      .from("notes")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data: notes }) => {
        setData((notes ?? []) as { id: string; content: string; created_at: string }[]);
        setLoading(false);
      });
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export async function createClientRecord(values: Partial<Client>) {
  const sb = createClient();
  const { data, error } = await sb.from("clients").insert(values).select().single();
  return { data, error };
}

export async function updateClientRecord(id: string, values: Partial<Client>) {
  const sb = createClient();
  const { data, error } = await sb.from("clients").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteClientRecord(id: string) {
  const sb = createClient();
  const { error } = await sb.from("clients").delete().eq("id", id);
  return { error };
}
