import Badge from "./Badge";
import { statusColor, priorityColor, healthColor } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status) as Parameters<typeof Badge>[0]["variant"];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge variant={color} dot>{label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const color = priorityColor(priority) as Parameters<typeof Badge>[0]["variant"];
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return <Badge variant={color}>{label}</Badge>;
}

export function HealthBadge({ health }: { health: string }) {
  const color = healthColor(health) as Parameters<typeof Badge>[0]["variant"];
  const label = health.charAt(0).toUpperCase() + health.slice(1);
  return <Badge variant={color} dot>{label}</Badge>;
}
