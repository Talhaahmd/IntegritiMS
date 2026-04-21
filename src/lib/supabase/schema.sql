-- ============================================================
-- IntegritiMS — Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on hold','churned')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  notes TEXT,
  waiting_for_update BOOLEAN NOT NULL DEFAULT false,
  next_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('not started','active','in progress','on hold','completed','delayed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  start_date DATE,
  due_date DATE,
  estimated_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  actual_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  progress_percent SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  health_status TEXT NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy','at risk','critical')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  primary_skill TEXT NOT NULL,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'mid' CHECK (experience_level IN ('junior','mid','senior','lead','expert')),
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available','partially available','fully booked','on leave')),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  joining_date DATE,
  hourly_rate NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'development' CHECK (category IN ('development','r&d','qa','design','maintenance','client update','internal review')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('not started','scheduled','in progress','completed','delayed','blocked')),
  estimated_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  actual_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  variance_hours NUMERIC(8,2) GENERATED ALWAYS AS (actual_hours - estimated_hours) STORED,
  expected_start TIMESTAMPTZ,
  expected_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  overdue BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TASK ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_by TEXT,
  assigned_start TIMESTAMPTZ,
  assigned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  estimated_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  actual_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  variance_hours NUMERIC(8,2) GENERATED ALWAYS AS (actual_hours - estimated_hours) STORED,
  status TEXT NOT NULL DEFAULT 'not started' CHECK (status IN ('not started','scheduled','in progress','completed','delayed','blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, team_member_id)
);

-- ============================================================
-- SCHEDULES
-- ============================================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  task_assignment_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  color_code TEXT NOT NULL DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client','project','task','team_member')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client','project','task')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS METADATA
-- ============================================================
CREATE TABLE IF NOT EXISTS reports_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL,
  parameters JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER task_assignments_updated_at BEFORE UPDATE ON task_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CALCULATE task overdue
-- ============================================================
CREATE OR REPLACE FUNCTION update_task_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != 'completed' AND NEW.expected_end IS NOT NULL AND NEW.expected_end < NOW() THEN
    NEW.overdue = true;
  ELSE
    NEW.overdue = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_overdue BEFORE INSERT OR UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_task_overdue();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_member_id ON task_assignments(team_member_id);
CREATE INDEX idx_schedules_member_id ON schedules(team_member_id);
CREATE INDEX idx_schedules_start ON schedules(start_datetime);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- ============================================================
-- RLS POLICIES (Admin only — no public access)
-- ============================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_metadata ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (admin) full access
CREATE POLICY "Admin full access" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON task_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON notes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON reports_metadata FOR ALL TO authenticated USING (true) WITH CHECK (true);
