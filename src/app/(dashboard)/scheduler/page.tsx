"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { useSchedules, createSchedule, deleteSchedule } from "@/lib/hooks/useSchedules";
import { useTasks, createTaskRecord } from "@/lib/hooks/useTasks";
import { useClients } from "@/lib/hooks/useClients";
import { useProjects } from "@/lib/hooks/useProjects";
import { createClient as createSBClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek, isSameDay, parseISO, addMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_CATEGORIES, TaskCategory } from "@/types";

const HOUR_WIDTH = 76;
const WORK_HOURS: number[] = [17, 18, 19, 20, 21, 22, 23, 0, 1];
const ROW_HEIGHT = 60;
const SIDEBAR_WIDTH = 180;

const COLOR_OPTIONS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#0EA5E9", "#14B8A6", "#F97316", "#64748B",
];

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 5, letterSpacing: "0.01em",
};

function displayHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

function hourOffset(h: number): number {
  return h >= 17 ? h - 17 : h + 7;
}

interface SlotPos { left: number; width: number }

function getSlotPos(startDt: string, endDt: string): SlotPos | null {
  const start = parseISO(startDt);
  const end = parseISO(endDt);
  const startOff = hourOffset(start.getHours()) + start.getMinutes() / 60;
  const durationH = (end.getTime() - start.getTime()) / 3_600_000;
  if (startOff < 0 || startOff >= WORK_HOURS.length) return null;
  return { left: startOff * HOUR_WIDTH, width: Math.max(durationH * HOUR_WIDTH, 40) };
}

/* Task assignments shown as background blocks */
interface TaskAssignmentBlock {
  id: string;
  team_member_id: string;
  assigned_start: string;
  assigned_end: string;
  tasks?: { id: string; name: string; category: string; status: string };
}

function useTaskAssignments(rangeStart: string, rangeEnd: string) {
  const [data, setData] = useState<TaskAssignmentBlock[]>([]);

  const load = useCallback(async () => {
    const sb = createSBClient();
    const { data: rows } = await sb
      .from("task_assignments")
      .select("id, team_member_id, assigned_start, assigned_end, tasks(id, name, category, status)")
      .not("assigned_start", "is", null)
      .not("assigned_end", "is", null)
      .gte("assigned_end", rangeStart)
      .lte("assigned_start", rangeEnd);
    setData((rows ?? []) as unknown as TaskAssignmentBlock[]);
  }, [rangeStart, rangeEnd]);

  useEffect(() => { load(); }, [load]);
  return { data, reload: load };
}

interface QuickAssignForm {
  client_id: string; project_id: string; task_id: string; task_name: string;
  category: TaskCategory; priority: string; estimated_hours: number; description: string; color: string;
}

export default function SchedulerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"week" | "day">("week");
  const [dayOffset, setDayOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(17);
  const [memberFilter, setMemberFilter] = useState("all");
  const [overlapError, setOverlapError] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekDays = view === "week"
    ? Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))
    : [addDays(today, dayOffset)];

  const rangeStart = weekDays[0];
  const rangeEnd = addDays(weekDays[weekDays.length - 1], 2);

  const { data: members, loading: membersLoading } = useTeamMembers();
  const { data: schedules, loading: schedulesLoading, reload } = useSchedules({
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });
  const { data: taskAssignments, reload: reloadAssignments } = useTaskAssignments(
    rangeStart.toISOString(),
    rangeEnd.toISOString()
  );
  const { data: tasks } = useTasks();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();

  const filteredMembers = memberFilter === "all" ? members : members.filter(m => m.id === memberFilter);

  const [form, setForm] = useState<QuickAssignForm>({
    client_id: "", project_id: "", task_id: "", task_name: "",
    category: "development", priority: "medium", estimated_hours: 2, description: "", color: COLOR_OPTIONS[0],
  });

  function getStartEndDt(): { startDt: string; endDt: string; startDisplay: string } | null {
    if (!selectedDate) return null;
    const h = selectedHour;
    const nextDay = h < 17;
    const d = new Date(selectedDate);
    if (nextDay) d.setDate(d.getDate() + 1);
    d.setHours(h, 0, 0, 0);
    const end = addMinutes(d, form.estimated_hours * 60);
    return { startDt: d.toISOString(), endDt: end.toISOString(), startDisplay: format(d, "EEE MMM d, h:mm a") };
  }

  function handleSlotClick(memberId: string, hour: number, day: Date) {
    setSelectedMemberId(memberId);
    setSelectedDate(day);
    setSelectedHour(hour);
    setOverlapError("");
    setForm(p => ({ ...p, estimated_hours: 2, task_id: "", task_name: "", client_id: "", project_id: "" }));
    setShowModal(true);
  }

  function checkOverlap(memberId: string, startDt: string, endDt: string): boolean {
    const start = new Date(startDt);
    const end = new Date(endDt);
    return schedules.some(s => {
      if (s.team_member_id !== memberId) return false;
      const sStart = parseISO(s.start_datetime);
      const sEnd = parseISO(s.end_datetime);
      return start < sEnd && end > sStart;
    });
  }

  const filteredProjects = form.client_id ? projects.filter(p => p.client_id === form.client_id) : projects;
  const filteredTasks = form.project_id
    ? tasks.filter(t => t.project_id === form.project_id)
    : form.client_id ? tasks.filter(t => t.client_id === form.client_id) : tasks;

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId || !selectedDate) return;
    const times = getStartEndDt();
    if (!times) return;
    const { startDt, endDt } = times;

    if (checkOverlap(selectedMemberId, startDt, endDt)) {
      setOverlapError("This slot overlaps with an existing schedule.");
      return;
    }

    setSaving(true);
    let taskId = form.task_id;
    if (!taskId && form.task_name) {
      const { data: newTask } = await createTaskRecord({
        name: form.task_name, category: form.category, priority: form.priority as any,
        status: "scheduled", client_id: form.client_id || null, project_id: form.project_id || null,
        description: form.description || null, estimated_hours: form.estimated_hours,
        actual_hours: 0, expected_start: startDt, expected_end: endDt,
      });
      taskId = (newTask as any)?.id ?? "";
    }

    if (!taskId) { setSaving(false); return; }

    const sb = createSBClient();
    const { data: existing } = await sb.from("task_assignments").select("id").eq("task_id", taskId).eq("team_member_id", selectedMemberId).single();
    let assignmentId = (existing as any)?.id;
    if (!assignmentId) {
      const { data: newAsgn } = await sb.from("task_assignments").insert({
        task_id: taskId, team_member_id: selectedMemberId, assigned_start: startDt, assigned_end: endDt,
        estimated_hours: form.estimated_hours, actual_hours: 0, status: "scheduled",
      }).select().single();
      assignmentId = (newAsgn as any)?.id ?? "";
    } else {
      // Update the assigned times
      await sb.from("task_assignments").update({ assigned_start: startDt, assigned_end: endDt }).eq("id", assignmentId);
    }

    if (!assignmentId) { setSaving(false); return; }

    await createSchedule({ team_member_id: selectedMemberId, task_assignment_id: assignmentId, start_datetime: startDt, end_datetime: endDt, color_code: form.color });
    setSaving(false);
    setShowModal(false);
    reload();
    reloadAssignments();
  }

  async function handleDelete(id: string) {
    await deleteSchedule(id);
    reload();
  }

  if (membersLoading || schedulesLoading) return (
    <><TopBar title="Task Scheduler" /><PageLoader /></>
  );

  const activeTimes = showModal ? getStartEndDt() : null;

  // Build a combined set of blocks per member per day
  // schedules = explicitly scheduled blocks (from schedules table)
  // taskAssignments = tasks with assigned_start/assigned_end (show as lighter background blocks)

  return (
    <>
      <TopBar title="Task Scheduler" subtitle="Visual schedule board · 5pm – 2am" />

      <div style={{ padding: "24px 28px 40px" }} className="animate-fade-in">

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
              <button onClick={() => view === "week" ? setWeekOffset(o => o - 1) : setDayOffset(o => o - 1)} style={{ padding: "6px 8px", border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}><ChevronLeft size={16} /></button>
              <div style={{ padding: "0 10px", fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", minWidth: 160, textAlign: "center" }}>
                {view === "week" ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[4], "MMM d, yyyy")}` : format(weekDays[0], "EEEE, MMM d, yyyy")}
              </div>
              <button onClick={() => view === "week" ? setWeekOffset(o => o + 1) : setDayOffset(o => o + 1)} style={{ padding: "6px 8px", border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}><ChevronRight size={16} /></button>
            </div>
            <button onClick={() => { setWeekOffset(0); setDayOffset(0); }} style={{ height: 36, padding: "0 16px", borderRadius: 10, border: "1px solid var(--border)", background: "#fff", fontSize: 13, fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}>Today</button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1, padding: 3, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
              {(["week", "day"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: view === v ? "#fff" : "transparent", boxShadow: view === v ? "0 2px 6px rgba(0,0,0,0.06)" : "none", color: view === v ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer", transition: "all 0.15s", fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>{v}</button>
              ))}
            </div>
            <select className="input-base" style={{ height: 36, width: 180, fontSize: 13 }} value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
              <option value="all">All Developers</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <button className="btn btn-primary" style={{ height: 36, fontSize: 13, gap: 6 }} onClick={() => { setSelectedMemberId(null); setSelectedDate(weekDays[0]); setSelectedHour(17); setShowModal(true); }}>
              <Plus size={14} /> Schedule Task
            </button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11, color: "var(--text-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#6366F115", borderLeft: "3px solid #6366F1" }} />
            Scheduled block
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#10B98115", borderLeft: "3px solid #10B981", borderStyle: "dashed none none dashed" }} />
            Task assignment (from Tasks page)
          </div>
        </div>

        {/* Grid Board */}
        <div className="card-lg" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: SIDEBAR_WIDTH + weekDays.length * WORK_HOURS.length * HOUR_WIDTH }}>

              {/* Header */}
              <div style={{ display: "flex", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: SIDEBAR_WIDTH, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", alignItems: "flex-end", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", position: "sticky", left: 0, zIndex: 20, background: "var(--surface-2)" }}>
                  Developer
                </div>
                {weekDays.map(day => (
                  <div key={day.toISOString()} style={{ width: WORK_HOURS.length * HOUR_WIDTH, borderRight: "1px solid var(--border)" }}>
                    <div style={{ padding: "10px 0", textAlign: "center", borderBottom: "1px solid var(--border-subtle)", background: isSameDay(day, today) ? "var(--accent-light)" : "transparent" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: isSameDay(day, today) ? "var(--accent)" : "var(--text-primary)" }}>{format(day, "EEEE")}</span>
                      <span style={{ fontSize: 12, marginLeft: 6, color: isSameDay(day, today) ? "var(--accent)" : "var(--text-tertiary)", fontWeight: 500 }}>{format(day, "d MMM")}</span>
                    </div>
                    <div style={{ display: "flex" }}>
                      {WORK_HOURS.map(h => (
                        <div key={h} style={{ width: HOUR_WIDTH, flexShrink: 0, textAlign: "center", padding: "6px 0", fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", borderRight: "1px solid var(--border-subtle)", opacity: 0.8 }}>
                          {displayHour(h)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Body */}
              {filteredMembers.map(member => (
                <div key={member.id} style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "#fff" }}>
                  {/* Sidebar */}
                  <div style={{ width: SIDEBAR_WIDTH, height: ROW_HEIGHT, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", position: "sticky", left: 0, zIndex: 10, background: "#fff" }}>
                    <Avatar name={member.full_name} size="sm" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.full_name.split(" ")[0]}</div>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.title}</div>
                    </div>
                  </div>

                  {/* Day slots */}
                  {weekDays.map(day => {
                    const daySchedules = schedules.filter(s => s.team_member_id === member.id && isSameDay(parseISO(s.start_datetime), day));
                    const dayAssignments = taskAssignments.filter(a =>
                      a.team_member_id === member.id &&
                      (isSameDay(parseISO(a.assigned_start), day) || isSameDay(parseISO(a.assigned_end), day))
                    );

                    return (
                      <div key={day.toISOString()} style={{ width: WORK_HOURS.length * HOUR_WIDTH, height: ROW_HEIGHT, display: "flex", position: "relative", borderRight: "1px solid var(--border)", background: isSameDay(day, today) ? "rgba(79, 70, 229, 0.02)" : "transparent" }}>
                        {WORK_HOURS.map(h => (
                          <div key={h} onClick={() => handleSlotClick(member.id, h, day)} style={{ width: HOUR_WIDTH, flexShrink: 0, borderRight: "1px solid var(--border-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover:bg-indigo-50/40 transition-colors group">
                            <Plus size={12} style={{ color: "var(--accent)", opacity: 0 }} className="group-hover:opacity-40" />
                          </div>
                        ))}

                        {/* Task assignment blocks (dashed border, lighter) */}
                        {dayAssignments.map(block => {
                          const pos = getSlotPos(block.assigned_start, block.assigned_end);
                          if (!pos) return null;
                          const task = block.tasks;
                          return (
                            <div key={`ta-${block.id}`} style={{
                              position: "absolute", top: 4, bottom: 4,
                              left: pos.left + 2, width: pos.width - 4,
                              background: "#10B98108",
                              border: "1.5px dashed #10B98155",
                              borderRadius: 6, padding: "3px 8px",
                              display: "flex", alignItems: "center",
                              zIndex: 5, pointerEvents: "none",
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: "#059669", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {task?.name ?? "Task"}
                              </div>
                            </div>
                          );
                        })}

                        {/* Scheduled blocks (solid) */}
                        {daySchedules.map(block => {
                          const pos = getSlotPos(block.start_datetime, block.end_datetime);
                          if (!pos) return null;
                          const color = block.color_code ?? "#6366F1";
                          const task = (block as any).task_assignment?.tasks;
                          return (
                            <div key={block.id} style={{
                              position: "absolute", top: 6, bottom: 6,
                              left: pos.left + 4, width: pos.width - 8,
                              background: `${color}15`, borderLeft: `3px solid ${color}`,
                              borderRadius: 8, padding: "4px 10px",
                              display: "flex", alignItems: "center", gap: 8,
                              zIndex: 10, cursor: "pointer",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                            }} className="hover:shadow-md group/block">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task?.name ?? "Task"}</div>
                                {pos.width > 120 && <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", marginTop: 1 }}>{task?.category}</div>}
                              </div>
                              <button onClick={e => { e.stopPropagation(); handleDelete(block.id); }} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0 }} className="group-hover/block:opacity-100 hover:bg-red-50 transition-all"><Trash2 size={12} /></button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule Task" subtitle={activeTimes?.startDisplay ? `Assigning for ${activeTimes.startDisplay}` : "Pick a time slot and assign a task."} size="lg">
        <form onSubmit={handleAssign} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Dev Selection */}
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--surface-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={members.find(m => m.id === selectedMemberId)?.full_name ?? "Pick Developer"} size="sm" />
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, marginBottom: 2 }}>Assign To</label>
              {selectedMemberId ? (
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{members.find(m => m.id === selectedMemberId)?.full_name}</div>
              ) : (
                <select className="input-base" style={{ border: "none", background: "transparent", padding: 0, height: "auto", fontSize: 14, fontWeight: 700 }} required value={selectedMemberId ?? ""} onChange={e => setSelectedMemberId(e.target.value)}>
                  <option value="">Select developer...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              )}
            </div>
            {selectedMemberId && <button type="button" onClick={() => setSelectedMemberId(null)} style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", border: "none", background: "transparent", cursor: "pointer" }}>Change</button>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <div style={{ position: "relative" }}>
                <Calendar size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
                <input type="date" className="input-base" style={{ paddingLeft: 32 }} required value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""} onChange={e => setSelectedDate(e.target.value ? new Date(e.target.value + "T00:00:00") : null)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Start Time</label>
              <div style={{ position: "relative" }}>
                <Clock size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
                <select className="input-base" style={{ paddingLeft: 32 }} value={selectedHour} onChange={e => setSelectedHour(Number(e.target.value))}>
                  {WORK_HOURS.map(h => <option key={h} value={h}>{displayHour(h)}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Duration (Hours)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="number" className="input-base" style={{ width: 100 }} min={0.5} max={9} step={0.5} required value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: Number(e.target.value) }))} />
              {activeTimes && (
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text-secondary)", background: "var(--surface-2)", padding: "8px 14px", borderRadius: 10 }}>
                  Ends at <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{format(new Date(activeTimes.endDt), "h:mm a")}</span>
                  {new Date(activeTimes.endDt).getDate() !== selectedDate?.getDate() && <span style={{ marginLeft: 6, color: "#D97706", fontSize: 11 }}>(Next Day)</span>}
                </div>
              )}
            </div>
          </div>

          {overlapError && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", color: "#DC2626", fontSize: 12.5, fontWeight: 600 }}><AlertCircle size={14} /> {overlapError}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Client</label>
              <select className="input-base" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value, project_id: "", task_id: "" }))}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Project</label>
              <select className="input-base" value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value, task_id: "" }))}>
                <option value="">Select project...</option>
                {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Task</label>
            <select className="input-base" value={form.task_id} onChange={e => setForm(p => ({ ...p, task_id: e.target.value, task_name: "" }))}>
              <option value="">Create new task...</option>
              {filteredTasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {!form.task_id && (
            <div style={{ padding: 18, borderRadius: 14, border: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-tertiary)", marginBottom: 12 }}>New Task Details</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={labelStyle}>Task Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input className="input-base" required value={form.task_name} onChange={e => setForm(p => ({ ...p, task_name: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Category</label>
                  <select className="input-base" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))}>
                    {TASK_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Priority</label>
                  <select className="input-base" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    {["critical", "high", "medium", "low"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Color Label</label>
            <div style={{ display: "flex", gap: 8 }}>
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? "2px solid #fff" : "none", boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ height: 38, fontSize: 13.5 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || (!form.task_id && !form.task_name) || !selectedDate || !selectedMemberId} style={{ height: 38, fontSize: 13.5, minWidth: 140 }}>{saving ? "Scheduling..." : "Schedule Task"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
