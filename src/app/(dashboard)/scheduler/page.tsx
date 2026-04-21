"use client";
import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_CATEGORIES, TaskCategory } from "@/types";

// 5pm (17) to 2am (26 = 2am next day) → 9 hour slots
const HOUR_WIDTH = 72; // px per hour
const WORK_HOURS: number[] = [17, 18, 19, 20, 21, 22, 23, 0, 1]; // 5pm → 2am
const ROW_HEIGHT = 56; // px per developer row

const COLOR_OPTIONS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#0EA5E9", "#14B8A6", "#F97316", "#64748B",
];

function displayHour(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

// How many slots from 5pm = 0 offset
function hourOffset(h: number): number {
  return h >= 17 ? h - 17 : h + 7; // 0→7, 1→8
}

interface SlotPos { left: number; width: number }

function getSlotPos(startDt: string, endDt: string): SlotPos | null {
  const start = parseISO(startDt);
  const end = parseISO(endDt);
  const startOff = hourOffset(start.getHours()) + start.getMinutes() / 60;
  const durationH = (end.getTime() - start.getTime()) / 3_600_000;
  if (startOff < 0 || startOff >= WORK_HOURS.length) return null;
  return { left: startOff * HOUR_WIDTH, width: Math.max(durationH * HOUR_WIDTH, 32) };
}

interface QuickAssignForm {
  client_id: string;
  project_id: string;
  task_id: string;
  task_name: string;
  category: TaskCategory;
  priority: string;
  estimated_hours: number;
  description: string;
  color: string;
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
    ? Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)) // Mon–Fri
    : [addDays(today, dayOffset)];

  const rangeStart = weekDays[0];
  const rangeEnd = addDays(weekDays[weekDays.length - 1], 2);

  const { data: members, loading: membersLoading } = useTeamMembers();
  const { data: schedules, loading: schedulesLoading, reload } = useSchedules({
    start: rangeStart.toISOString(),
    end: rangeEnd.toISOString(),
  });
  const { data: tasks } = useTasks();
  const { data: clients } = useClients();
  const { data: projects } = useProjects();

  const filteredMembers = memberFilter === "all" ? members : members.filter((m) => m.id === memberFilter);

  const [form, setForm] = useState<QuickAssignForm>({
    client_id: "", project_id: "", task_id: "", task_name: "",
    category: "development", priority: "medium",
    estimated_hours: 2, description: "", color: COLOR_OPTIONS[0],
  });

  // Compute start/end datetimes from selected slot
  function getStartEndDt(): { startDt: string; endDt: string; startDisplay: string } | null {
    if (!selectedDate) return null;
    const { hour, nextDay } = resolveHour(selectedHour);
    const d = new Date(selectedDate);
    if (nextDay) d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    const end = addMinutes(d, form.estimated_hours * 60);
    return {
      startDt: d.toISOString(),
      endDt: end.toISOString(),
      startDisplay: format(d, "EEE MMM d, h:mm a"),
    };
  }

  function resolveHour(h: number): { hour: number; nextDay: boolean } {
    return h >= 17 ? { hour: h, nextDay: false } : { hour: h, nextDay: true };
  }

  function handleSlotClick(memberId: string, hour: number, day: Date) {
    setSelectedMemberId(memberId);
    setSelectedDate(day);
    setSelectedHour(hour);
    setOverlapError("");
    setForm((p) => ({ ...p, estimated_hours: 2, task_id: "", task_name: "", client_id: "", project_id: "" }));
    setShowModal(true);
  }

  function checkOverlap(memberId: string, startDt: string, endDt: string): boolean {
    const start = new Date(startDt);
    const end = new Date(endDt);
    return schedules.some((s) => {
      if (s.team_member_id !== memberId) return false;
      const sStart = parseISO(s.start_datetime);
      const sEnd = parseISO(s.end_datetime);
      return start < sEnd && end > sStart;
    });
  }

  const filteredProjects = form.client_id
    ? projects.filter((p) => p.client_id === form.client_id)
    : projects;

  const filteredTasks = form.project_id
    ? tasks.filter((t) => t.project_id === form.project_id)
    : form.client_id
    ? tasks.filter((t) => t.client_id === form.client_id)
    : tasks;

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMemberId || !selectedDate) return;

    const times = getStartEndDt();
    if (!times) return;
    const { startDt, endDt } = times;

    if (checkOverlap(selectedMemberId, startDt, endDt)) {
      setOverlapError("This developer already has a task scheduled during this time. Choose a different slot.");
      return;
    }

    setSaving(true);
    setOverlapError("");

    let taskId = form.task_id;
    if (!taskId && form.task_name) {
      const { data: newTask } = await createTaskRecord({
        name: form.task_name,
        category: form.category,
        priority: form.priority as "critical" | "high" | "medium" | "low",
        status: "scheduled",
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        description: form.description || null,
        estimated_hours: form.estimated_hours,
        actual_hours: 0,
        expected_start: startDt,
        expected_end: endDt,
      });
      taskId = (newTask as { id: string } | null)?.id ?? "";
    }

    if (!taskId) { setSaving(false); return; }

    const sb = createSBClient();
    const { data: existing } = await sb
      .from("task_assignments")
      .select("id")
      .eq("task_id", taskId)
      .eq("team_member_id", selectedMemberId)
      .single();

    let assignmentId = (existing as { id: string } | null)?.id;
    if (!assignmentId) {
      const { data: newAsgn } = await sb.from("task_assignments").insert({
        task_id: taskId,
        team_member_id: selectedMemberId,
        assigned_start: startDt,
        assigned_end: endDt,
        estimated_hours: form.estimated_hours,
        actual_hours: 0,
        status: "scheduled",
      }).select().single();
      assignmentId = (newAsgn as { id: string } | null)?.id ?? "";
    }

    if (!assignmentId) { setSaving(false); return; }

    await createSchedule({
      team_member_id: selectedMemberId,
      task_assignment_id: assignmentId,
      start_datetime: startDt,
      end_datetime: endDt,
      color_code: form.color,
    });

    setSaving(false);
    setShowModal(false);
    reload();
  }

  async function handleDelete(id: string) {
    await deleteSchedule(id);
    reload();
  }

  if (membersLoading || schedulesLoading) return (
    <>
      <TopBar title="Task Scheduler" />
      <PageLoader />
    </>
  );

  const times = showModal ? getStartEndDt() : null;

  return (
    <>
      <TopBar title="Task Scheduler" subtitle="Visual schedule board · 5pm – 2am" />

      <div className="p-6 animate-fade-in">
        {/* Controls */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => view === "week" ? setWeekOffset((o) => o - 1) : setDayOffset((o) => o - 1)}
            >
              <ChevronLeft size={14} />
            </button>
            <div className="text-[14px] font-semibold text-gray-800 min-w-[200px] text-center">
              {view === "week"
                ? `${format(weekDays[0], "MMM d")} – ${format(weekDays[4], "MMM d, yyyy")}`
                : format(weekDays[0], "EEEE, MMM d, yyyy")}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => view === "week" ? setWeekOffset((o) => o + 1) : setDayOffset((o) => o + 1)}
            >
              <ChevronRight size={14} />
            </button>
            <button
              className="btn btn-ghost btn-sm text-indigo-600"
              onClick={() => { setWeekOffset(0); setDayOffset(0); }}
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View toggle */}
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-gray-100">
              {(["week", "day"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 rounded-md text-[12.5px] font-medium transition-all capitalize",
                    view === v ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>

            <select
              className="input-base h-9 w-44 text-[12.5px]"
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
            >
              <option value="all">All Developers</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>

            <button className="btn btn-primary btn-sm" onClick={() => {
              setSelectedMemberId(null);
              setSelectedDate(weekDays[0]);
              setSelectedHour(17);
              setOverlapError("");
              setShowModal(true);
            }}>
              <Plus size={13} /> Schedule Task
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="card-lg overflow-hidden">
          {/* Sticky header */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: 160 + weekDays.length * WORK_HOURS.length * HOUR_WIDTH }}>

              {/* Day + hour headers */}
              <div className="flex bg-gray-50 border-b border-gray-100">
                {/* Developer column header */}
                <div
                  className="shrink-0 border-r border-gray-100 flex items-end px-4 pb-2 bg-gray-50"
                  style={{ width: 160 }}
                >
                  <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">Developer</span>
                </div>

                {/* Day columns */}
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border-r border-gray-100 last:border-r-0"
                    style={{ width: WORK_HOURS.length * HOUR_WIDTH }}
                  >
                    {/* Day label */}
                    <div
                      className={cn(
                        "px-3 pt-2.5 pb-1 border-b border-gray-100 text-center",
                        isSameDay(day, today) ? "bg-indigo-50" : ""
                      )}
                    >
                      <span className={cn("text-[12px] font-semibold", isSameDay(day, today) ? "text-indigo-600" : "text-gray-700")}>
                        {format(day, "EEE")}
                      </span>
                      <span className={cn("text-[11px] ml-1.5", isSameDay(day, today) ? "text-indigo-500" : "text-gray-400")}>
                        {format(day, "d MMM")}
                      </span>
                    </div>
                    {/* Hour sub-labels */}
                    <div className="flex">
                      {WORK_HOURS.map((h) => (
                        <div
                          key={h}
                          className="text-center py-1 border-r border-gray-50 last:border-r-0"
                          style={{ width: HOUR_WIDTH, minWidth: HOUR_WIDTH }}
                        >
                          <span className="text-[10px] text-gray-400 font-medium">{displayHour(h)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Developer rows */}
              {filteredMembers.length === 0 ? (
                <div className="p-10 text-center text-[13px] text-gray-400">No developers found.</div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} className="flex border-b border-gray-100 last:border-b-0 group/row hover:bg-gray-50/50 transition-colors">
                    {/* Developer info */}
                    <div
                      className="shrink-0 border-r border-gray-100 flex items-center px-3 gap-2.5 bg-white group-hover/row:bg-gray-50/50 transition-colors"
                      style={{ width: 160, height: ROW_HEIGHT }}
                    >
                      <Avatar name={member.full_name} size="sm" />
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-medium text-gray-800 truncate leading-tight">{member.full_name.split(" ")[0]}</div>
                        <div className="text-[10.5px] text-gray-400 truncate leading-tight">{member.title.split(" ").slice(0, 2).join(" ")}</div>
                      </div>
                    </div>

                    {/* Day × time cells */}
                    {weekDays.map((day) => {
                      const dayBlocks = schedules.filter((s) => {
                        const d = parseISO(s.start_datetime);
                        return s.team_member_id === member.id && isSameDay(d, day);
                      });

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn("relative border-r border-gray-100 last:border-r-0", isSameDay(day, today) ? "bg-indigo-50/30" : "")}
                          style={{ width: WORK_HOURS.length * HOUR_WIDTH, height: ROW_HEIGHT }}
                        >
                          {/* Clickable hour slots */}
                          <div className="flex h-full">
                            {WORK_HOURS.map((hour) => (
                              <div
                                key={hour}
                                className="h-full border-r border-gray-50 last:border-r-0 cursor-pointer hover:bg-indigo-50/60 transition-colors flex items-center justify-center group/slot"
                                style={{ width: HOUR_WIDTH, minWidth: HOUR_WIDTH }}
                                onClick={() => handleSlotClick(member.id, hour, day)}
                              >
                                <Plus size={11} className="opacity-0 group-hover/slot:opacity-40 text-indigo-400 transition-opacity" />
                              </div>
                            ))}
                          </div>

                          {/* Schedule blocks (absolute) */}
                          {dayBlocks.map((block) => {
                            const pos = getSlotPos(block.start_datetime, block.end_datetime);
                            if (!pos) return null;
                            const color = block.color_code ?? "#6366F1";
                            const task = (block as { task_assignment?: { tasks?: { name: string; category: string } } }).task_assignment?.tasks;
                            return (
                              <div
                                key={block.id}
                                className="absolute top-1 bottom-1 rounded-md px-2 flex items-center gap-1.5 group/block cursor-pointer z-10 overflow-hidden"
                                style={{
                                  left: pos.left + 1,
                                  width: pos.width - 2,
                                  background: `${color}20`,
                                  borderLeft: `3px solid ${color}`,
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-semibold truncate" style={{ color }}>
                                    {task?.name ?? "Task"}
                                  </div>
                                  {pos.width > 100 && (
                                    <div className="text-[9.5px] text-gray-400 truncate capitalize">
                                      {task?.category}
                                    </div>
                                  )}
                                </div>
                                <button
                                  className="opacity-0 group-hover/block:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 shrink-0"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(block.id); }}
                                >
                                  <Trash2 size={9} className="text-red-400" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Task"
        subtitle={times?.startDisplay
          ? `Starting ${times.startDisplay} · ${form.estimated_hours}h estimated`
          : "Pick a slot from the grid or set manually"}
        size="lg"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          {/* Developer selector (if not pre-selected from grid click) */}
          {!selectedMemberId && (
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Developer *</label>
              <select className="input-base" required value={selectedMemberId ?? ""} onChange={(e) => setSelectedMemberId(e.target.value)}>
                <option value="">Select developer…</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          )}

          {/* Selected developer pill */}
          {selectedMemberId && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
              <Avatar name={members.find((m) => m.id === selectedMemberId)?.full_name ?? ""} size="sm" />
              <div>
                <div className="text-[13px] font-semibold text-indigo-800">{members.find((m) => m.id === selectedMemberId)?.full_name}</div>
                <div className="text-[11px] text-indigo-500">{members.find((m) => m.id === selectedMemberId)?.title}</div>
              </div>
              <button type="button" className="ml-auto text-[11px] text-indigo-400 hover:text-indigo-600" onClick={() => setSelectedMemberId(null)}>
                Change
              </button>
            </div>
          )}

          {/* Date + Hour selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Date *</label>
              <input
                type="date"
                className="input-base"
                required
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value + "T00:00:00") : null)}
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Start Hour *</label>
              <select
                className="input-base"
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
              >
                {WORK_HOURS.map((h) => (
                  <option key={h} value={h}>{displayHour(h)} ({h === 0 ? "midnight" : h < 12 ? `${h}:00` : `${h}:00`})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated hours — drives end time */}
          <div>
            <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Estimated Hours *</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="input-base w-28"
                min={0.5}
                max={9}
                step={0.5}
                required
                value={form.estimated_hours}
                onChange={(e) => setForm((p) => ({ ...p, estimated_hours: Number(e.target.value) }))}
              />
              {times && (
                <div className="text-[12.5px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                  Ends at <span className="font-semibold text-gray-700">{format(new Date(times.endDt), "h:mm a")}</span>
                  {/* check if next day */}
                  {new Date(times.endDt).getDate() !== selectedDate?.getDate() && (
                    <span className="ml-1 text-amber-600 text-[11px]">(next day)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {overlapError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-[12.5px] text-red-700">
              <AlertCircle size={14} className="shrink-0 text-red-500" />
              {overlapError}
            </div>
          )}

          {/* Client + Project */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Client</label>
              <select className="input-base" value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value, project_id: "", task_id: "" }))}>
                <option value="">Any client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Project</label>
              <select className="input-base" value={form.project_id} onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value, task_id: "" }))}>
                <option value="">Any project…</option>
                {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Existing task or new */}
          <div>
            <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Existing Task</label>
            <select className="input-base" value={form.task_id} onChange={(e) => setForm((p) => ({ ...p, task_id: e.target.value, task_name: "" }))}>
              <option value="">— Create new task below —</option>
              {filteredTasks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {!form.task_id && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">New Task Name *</label>
                <input
                  className="input-base"
                  placeholder="Enter task name…"
                  value={form.task_name}
                  onChange={(e) => setForm((p) => ({ ...p, task_name: e.target.value }))}
                  required={!form.task_id}
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Category</label>
                <select className="input-base" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TaskCategory }))}>
                  {TASK_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Priority</label>
                <select className="input-base" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                  {["critical","high","medium","low"].map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-[12.5px] font-medium mb-1.5 text-gray-500">Block Color</label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ background: c, outline: form.color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || (!form.task_id && !form.task_name) || !selectedDate || !selectedMemberId}
            >
              {saving ? "Scheduling…" : "Schedule Task"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
