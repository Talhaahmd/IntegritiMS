export type ClientStatus = "active" | "inactive" | "on hold" | "churned";
export type ClientPriority = "critical" | "high" | "medium" | "low";

export interface Client {
  id: string;
  name: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: ClientStatus;
  priority: ClientPriority;
  notes: string | null;
  waiting_for_update: boolean;
  next_deadline: string | null;
  created_at: string;
  updated_at: string;
  // aggregated
  active_projects?: number;
  total_projects?: number;
  total_tasks?: number;
  overdue_tasks?: number;
  last_activity?: string;
}

export type ProjectStatus =
  | "not started"
  | "active"
  | "in progress"
  | "on hold"
  | "completed"
  | "delayed"
  | "cancelled";
export type ProjectPriority = "critical" | "high" | "medium" | "low";
export type ProjectHealth = "healthy" | "at risk" | "critical";

export interface Project {
  id: string;
  client_id: string;
  client?: Client;
  name: string;
  description: string | null;
  category: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  progress_percent: number;
  health_status: ProjectHealth;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // aggregated
  total_tasks?: number;
  completed_tasks?: number;
  delayed_tasks?: number;
  team_members?: TeamMember[];
}

export type ExperienceLevel = "junior" | "mid" | "senior" | "lead" | "expert";
export type AvailabilityStatus =
  | "available"
  | "partially available"
  | "fully booked"
  | "on leave";

export interface TeamMember {
  id: string;
  full_name: string;
  title: string;
  department: string | null;
  primary_skill: string;
  expertise: string[];
  experience_level: ExperienceLevel;
  availability_status: AvailabilityStatus;
  email: string;
  phone: string | null;
  joining_date: string | null;
  hourly_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // aggregated
  active_tasks?: number;
  completed_tasks?: number;
  on_time_rate?: number;
  delayed_rate?: number;
  total_assigned_hours?: number;
  actual_worked_hours?: number;
  current_workload?: number;
}

export type TaskCategory =
  | "development"
  | "r&d"
  | "qa"
  | "design"
  | "maintenance"
  | "client update"
  | "internal review";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus =
  | "not started"
  | "scheduled"
  | "in progress"
  | "paused"
  | "completed"
  | "delayed"
  | "blocked";

export interface Task {
  id: string;
  client_id: string | null;
  project_id: string | null;
  client?: Client;
  project?: Project;
  name: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_hours: number;
  actual_hours: number;
  variance_hours: number;
  expected_start: string | null;
  expected_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  overdue: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // aggregated
  assignees?: TeamMember[];
  assignments?: TaskAssignment[];
}

export interface TaskAssignment {
  id: string;
  task_id: string;
  team_member_id: string;
  team_member?: TeamMember;
  task?: Task;
  assigned_by: string | null;
  assigned_start: string | null;
  assigned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  estimated_hours: number;
  actual_hours: number;
  variance_hours: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  team_member_id: string;
  task_assignment_id: string;
  task_assignment?: TaskAssignment;
  team_member?: TeamMember;
  start_datetime: string;
  end_datetime: string;
  color_code: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: "client" | "project" | "task" | "team_member";
  entity_id: string;
  action: string;
  description: string;
  created_at: string;
}

export interface Note {
  id: string;
  entity_type: "client" | "project" | "task";
  entity_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type ExpertiseOption =
  | "Shopify"
  | "WordPress"
  | "Webflow"
  | "Custom Development"
  | "Frontend Development"
  | "Backend Development"
  | "Full Stack Development"
  | "API Integrations"
  | "Performance Optimization"
  | "SEO Optimization"
  | "UI/UX Implementation"
  | "Maintenance & Support"
  | "Bug Fixing"
  | "Feature Enhancements"
  | "MVP Development"
  | "Dedicated Resource"
  | "Dedicated Team"
  | "Project-Based";

export const EXPERTISE_OPTIONS: ExpertiseOption[] = [
  "Shopify",
  "WordPress",
  "Webflow",
  "Custom Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "API Integrations",
  "Performance Optimization",
  "SEO Optimization",
  "UI/UX Implementation",
  "Maintenance & Support",
  "Bug Fixing",
  "Feature Enhancements",
  "MVP Development",
  "Dedicated Resource",
  "Dedicated Team",
  "Project-Based",
];

export const TASK_CATEGORIES: TaskCategory[] = [
  "development",
  "r&d",
  "qa",
  "design",
  "maintenance",
  "client update",
  "internal review",
];

export const TASK_STATUSES: TaskStatus[] = [
  "not started",
  "scheduled",
  "in progress",
  "paused",
  "completed",
  "delayed",
  "blocked",
];

export const PROJECT_STATUSES: ProjectStatus[] = [
  "not started",
  "active",
  "in progress",
  "on hold",
  "completed",
  "delayed",
  "cancelled",
];

export interface DashboardStats {
  totalActiveClients: number;
  totalActiveProjects: number;
  totalPendingTasks: number;
  totalCompletedTasks: number;
  overdueTasks: number;
  clientsWithDeadlinesCrossed: number;
  clientsWaitingForUpdate: number;
  activeProjects: number;
  tasksToday: number;
}

export interface PerformanceData {
  name: string;
  expected: number;
  actual: number;
  onTimeRate: number;
}

export interface WeeklyTrend {
  day: string;
  completed: number;
  assigned: number;
}
