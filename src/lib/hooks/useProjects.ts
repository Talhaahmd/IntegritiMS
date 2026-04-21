"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Project } from "@/types";

export function useProjects(clientId?: string) {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = createClient()
      .from("projects")
      .select("*, clients(id, name, company_name)")
      .order("created_at", { ascending: false });

    if (clientId) query = query.eq("client_id", clientId);

    const { data: projects } = await query;
    setData((projects as Project[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, reload: load };
}

export function useProject(id: string) {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    createClient()
      .from("projects")
      .select("*, clients(id, name, company_name, email, phone, contact_person)")
      .eq("id", id)
      .single()
      .then(({ data: p }) => {
        setData(p as Project);
        setLoading(false);
      });
  }, [id]);

  return { data, loading };
}

export function useProjectTasks(projectId: string) {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    createClient()
      .from("tasks")
      .select("*, task_assignments(team_members(id, full_name, title))")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .then(({ data: tasks }) => {
        setData((tasks as Record<string, unknown>[]) ?? []);
        setLoading(false);
      });
  }, [projectId]);

  return { data, loading };
}

export async function createProjectRecord(values: Partial<Project>) {
  const sb = createClient();
  const { data, error } = await sb.from("projects").insert(values).select().single();
  return { data, error };
}

export async function updateProjectRecord(id: string, values: Partial<Project>) {
  const sb = createClient();
  const { data, error } = await sb.from("projects").update(values).eq("id", id).select().single();
  return { data, error };
}

export async function deleteProjectRecord(id: string) {
  const sb = createClient();
  const { error } = await sb.from("projects").delete().eq("id", id);
  return { error };
}
