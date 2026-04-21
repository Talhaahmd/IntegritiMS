import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy") {
  if (!date) return "—";
  return format(new Date(date), pattern);
}

export function formatDateTime(date: string | Date) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy · h:mm a");
}

export function timeAgo(date: string | Date) {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: string | Date) {
  if (!date) return false;
  return isBefore(new Date(date), startOfDay(new Date()));
}

export function isUpcoming(date: string | Date, days = 7) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const future = new Date(now);
  future.setDate(future.getDate() + days);
  return isAfter(d, now) && isBefore(d, future);
}

export function calcProgress(completed: number, total: number) {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calcVariance(actual: number, estimated: number) {
  return actual - estimated;
}

export function formatHours(hours: number) {
  if (!hours && hours !== 0) return "—";
  return `${hours}h`;
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    active: "emerald",
    completed: "sky",
    delayed: "red",
    "on hold": "amber",
    "not started": "slate",
    "in progress": "indigo",
    cancelled: "slate",
    blocked: "red",
    paused: "amber",
    scheduled: "violet",
    "waiting for update": "amber",
  };
  return map[status?.toLowerCase()] ?? "slate";
}

export function priorityColor(priority: string) {
  const map: Record<string, string> = {
    critical: "red",
    high: "orange",
    medium: "amber",
    low: "slate",
  };
  return map[priority?.toLowerCase()] ?? "slate";
}

export function healthColor(health: string) {
  const map: Record<string, string> = {
    healthy: "emerald",
    "at risk": "amber",
    critical: "red",
    good: "emerald",
  };
  return map[health?.toLowerCase()] ?? "slate";
}

export function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function randomAvatarColor(name: string) {
  const colors = [
    "bg-indigo-500",
    "bg-violet-500",
    "bg-sky-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
    "bg-teal-500",
    "bg-pink-500",
  ];
  const index =
    name?.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;
  return colors[index ?? 0];
}

export function truncate(text: string, max = 60) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}
