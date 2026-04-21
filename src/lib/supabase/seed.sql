-- ============================================================
-- IntegritiMS — Seed Data
-- ============================================================

-- Team Members
INSERT INTO team_members (id, full_name, title, department, primary_skill, expertise, experience_level, availability_status, email, phone, joining_date, hourly_rate) VALUES
('11111111-0000-0000-0000-000000000001', 'Alex Carter', 'Lead Developer', 'Engineering', 'Full Stack Development', ARRAY['Full Stack Development','API Integrations','Custom Development'], 'lead', 'partially available', 'alex@integritims.com', '+1-555-0101', '2022-01-15', 95.00),
('11111111-0000-0000-0000-000000000002', 'Sarah Mitchell', 'Frontend Developer', 'Engineering', 'Frontend Development', ARRAY['Frontend Development','UI/UX Implementation','Webflow'], 'senior', 'available', 'sarah@integritims.com', '+1-555-0102', '2022-03-10', 80.00),
('11111111-0000-0000-0000-000000000003', 'Rahul Sharma', 'Backend Developer', 'Engineering', 'Backend Development', ARRAY['Backend Development','API Integrations','Performance Optimization'], 'senior', 'fully booked', 'rahul@integritims.com', '+1-555-0103', '2021-11-20', 85.00),
('11111111-0000-0000-0000-000000000004', 'Emma Johnson', 'WordPress Developer', 'Engineering', 'WordPress', ARRAY['WordPress','SEO Optimization','Maintenance & Support'], 'mid', 'available', 'emma@integritims.com', '+1-555-0104', '2023-02-05', 65.00),
('11111111-0000-0000-0000-000000000005', 'James Liu', 'Shopify Developer', 'Engineering', 'Shopify', ARRAY['Shopify','Feature Enhancements','Bug Fixing'], 'mid', 'partially available', 'james@integritims.com', '+1-555-0105', '2022-08-14', 70.00),
('11111111-0000-0000-0000-000000000006', 'Priya Nair', 'QA Engineer', 'Quality', 'QA', ARRAY['Bug Fixing','Maintenance & Support','Feature Enhancements'], 'mid', 'available', 'priya@integritims.com', '+1-555-0106', '2023-04-01', 60.00),
('11111111-0000-0000-0000-000000000007', 'Tom Wilson', 'Junior Developer', 'Engineering', 'Frontend Development', ARRAY['Frontend Development','WordPress','Bug Fixing'], 'junior', 'available', 'tom@integritims.com', '+1-555-0107', '2024-01-10', 45.00);

-- Clients
INSERT INTO clients (id, name, company_name, contact_person, email, phone, status, priority, notes, waiting_for_update, next_deadline) VALUES
('22222222-0000-0000-0000-000000000001', 'Nexova Corp', 'Nexova Corporation Ltd.', 'Michael Reynolds', 'michael@nexova.com', '+1-555-1001', 'active', 'critical', 'High-value enterprise client. Requires weekly check-ins.', false, NOW() + INTERVAL '5 days'),
('22222222-0000-0000-0000-000000000002', 'BrightPath Media', 'BrightPath Media Inc.', 'Jessica Tan', 'jessica@brightpath.com', '+1-555-1002', 'active', 'high', 'Long-standing agency client. Multiple ongoing projects.', true, NOW() + INTERVAL '3 days'),
('22222222-0000-0000-0000-000000000003', 'TerraGrow', 'TerraGrow Solutions', 'David Kim', 'david@terragrow.io', '+1-555-1003', 'active', 'medium', NULL, false, NOW() + INTERVAL '14 days'),
('22222222-0000-0000-0000-000000000004', 'Luminos Studio', 'Luminos Studio LLC', 'Sophie Clarke', 'sophie@luminos.studio', '+1-555-1004', 'active', 'high', 'Design-forward client. Strict on UI quality.', true, NOW() + INTERVAL '7 days'),
('22222222-0000-0000-0000-000000000005', 'PulseHR', 'PulseHR Technologies', 'Ryan Foster', 'ryan@pulsehr.co', '+1-555-1005', 'active', 'medium', NULL, false, NOW() + INTERVAL '21 days'),
('22222222-0000-0000-0000-000000000006', 'Verdant Foods', 'Verdant Foods Group', 'Natalie Cruz', 'natalie@verdant.foods', '+1-555-1006', 'on hold', 'low', 'Paused due to internal restructuring.', false, NULL),
('22222222-0000-0000-0000-000000000007', 'CodeVault', 'CodeVault Systems', 'Ahmed Hassan', 'ahmed@codevault.io', '+1-555-1007', 'active', 'high', NULL, true, NOW() + INTERVAL '2 days');

-- Projects
INSERT INTO projects (id, client_id, name, description, category, status, priority, start_date, due_date, estimated_hours, actual_hours, progress_percent, health_status, notes) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Nexova Platform Rebuild', 'Complete platform overhaul with new tech stack and improved architecture.', 'Custom Development', 'in progress', 'critical', '2025-11-01', '2026-05-15', 480, 310, 65, 'at risk', 'Backend ahead of schedule, frontend delayed.'),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Nexova Mobile API', 'REST API development for upcoming Nexova mobile application.', 'API Integrations', 'active', 'high', '2026-02-01', '2026-06-30', 120, 45, 38, 'healthy', NULL),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'BrightPath Website Redesign', 'Full website redesign using Webflow with custom animations.', 'Webflow', 'in progress', 'high', '2026-01-15', '2026-04-30', 200, 185, 92, 'healthy', 'Nearly complete — final review pending.'),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'BrightPath SEO Campaign', 'Technical SEO overhaul and content optimization for 3 months.', 'SEO Optimization', 'active', 'medium', '2026-02-10', '2026-05-10', 80, 35, 44, 'healthy', NULL),
('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000003', 'TerraGrow E-Commerce Store', 'Shopify store build with custom product configurator.', 'Shopify', 'in progress', 'high', '2025-12-01', '2026-04-20', 160, 140, 88, 'at risk', 'Past deadline — awaiting client content.'),
('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000004', 'Luminos Brand Portal', 'Custom WordPress brand portal with asset management.', 'WordPress', 'active', 'high', '2026-03-01', '2026-06-01', 140, 30, 21, 'healthy', NULL),
('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000005', 'PulseHR Dashboard MVP', 'React-based HR analytics dashboard — MVP scope.', 'MVP Development', 'not started', 'medium', '2026-05-01', '2026-08-01', 220, 0, 0, 'healthy', NULL),
('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000007', 'CodeVault Security Audit', 'Comprehensive security review and vulnerability remediation.', 'Custom Development', 'in progress', 'critical', '2026-04-01', '2026-04-25', 60, 40, 67, 'at risk', 'Deadline approaching fast.'),
('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000007', 'CodeVault API Integrations', 'Third-party API integrations for payment and logistics.', 'API Integrations', 'active', 'high', '2026-03-15', '2026-05-30', 90, 20, 22, 'healthy', NULL);

-- Tasks
INSERT INTO tasks (id, client_id, project_id, name, description, category, priority, status, estimated_hours, actual_hours, expected_start, expected_end, actual_start, overdue) VALUES
-- Nexova Platform Rebuild tasks
('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Backend API Architecture', 'Design and implement core API architecture.', 'development', 'critical', 'completed', 40, 38, NOW()-INTERVAL '60 days', NOW()-INTERVAL '45 days', NOW()-INTERVAL '60 days', false),
('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Database Schema Design', 'Design and migrate database schemas.', 'development', 'critical', 'completed', 20, 22, NOW()-INTERVAL '55 days', NOW()-INTERVAL '40 days', NOW()-INTERVAL '55 days', false),
('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Frontend Component Library', 'Build reusable UI components.', 'development', 'high', 'in progress', 60, 30, NOW()-INTERVAL '20 days', NOW()+INTERVAL '10 days', NOW()-INTERVAL '20 days', false),
('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Authentication System', 'Implement OAuth2 + JWT auth flow.', 'development', 'critical', 'completed', 24, 26, NOW()-INTERVAL '50 days', NOW()-INTERVAL '35 days', NOW()-INTERVAL '50 days', false),
('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Performance Optimization', 'Optimize API response times and caching.', 'development', 'high', 'scheduled', 16, 0, NOW()+INTERVAL '5 days', NOW()+INTERVAL '15 days', NULL, false),
-- BrightPath tasks
('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'Webflow Template Setup', 'Set up base Webflow template and CMS.', 'development', 'high', 'completed', 24, 22, NOW()-INTERVAL '40 days', NOW()-INTERVAL '25 days', NOW()-INTERVAL '40 days', false),
('44444444-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'Homepage Animation', 'GSAP scroll animations for homepage.', 'design', 'medium', 'completed', 16, 18, NOW()-INTERVAL '25 days', NOW()-INTERVAL '10 days', NOW()-INTERVAL '25 days', false),
('44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'Final QA & Browser Testing', 'Cross-browser testing and QA sign-off.', 'qa', 'high', 'in progress', 12, 5, NOW()-INTERVAL '3 days', NOW()+INTERVAL '3 days', NOW()-INTERVAL '3 days', false),
-- TerraGrow
('44444444-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000005', 'Shopify Theme Customization', 'Custom Shopify theme development.', 'development', 'high', 'completed', 40, 45, NOW()-INTERVAL '80 days', NOW()-INTERVAL '50 days', NOW()-INTERVAL '80 days', false),
('44444444-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000005', 'Product Configurator', 'Interactive product configurator widget.', 'development', 'critical', 'delayed', 32, 20, NOW()-INTERVAL '30 days', NOW()-INTERVAL '5 days', NOW()-INTERVAL '30 days', true),
-- CodeVault
('44444444-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000008', 'Security Vulnerability Scan', 'Run automated OWASP scan and manual review.', 'qa', 'critical', 'completed', 16, 14, NOW()-INTERVAL '15 days', NOW()-INTERVAL '8 days', NOW()-INTERVAL '15 days', false),
('44444444-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000007', '33333333-0000-0000-0000-000000000008', 'Vulnerability Remediation', 'Patch identified security issues.', 'development', 'critical', 'in progress', 24, 14, NOW()-INTERVAL '7 days', NOW()+INTERVAL '4 days', NOW()-INTERVAL '7 days', false),
-- Luminos
('44444444-0000-0000-0000-000000000013', '22222222-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000006', 'WordPress Theme Development', 'Build custom WordPress theme.', 'development', 'high', 'in progress', 40, 18, NOW()-INTERVAL '10 days', NOW()+INTERVAL '20 days', NOW()-INTERVAL '10 days', false),
('44444444-0000-0000-0000-000000000014', '22222222-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000006', 'Asset Management System', 'Custom post types for brand assets.', 'development', 'medium', 'scheduled', 20, 0, NOW()+INTERVAL '5 days', NOW()+INTERVAL '25 days', NULL, false),
-- Today tasks
('44444444-0000-0000-0000-000000000015', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'Client Review Call Prep', 'Prepare demo for client review call today.', 'client update', 'high', 'in progress', 2, 1, NOW(), NOW()+INTERVAL '4 hours', NOW(), false),
('44444444-0000-0000-0000-000000000016', '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 'Staging Deployment', 'Deploy latest build to staging for client review.', 'development', 'medium', 'scheduled', 1, 0, NOW(), NOW()+INTERVAL '2 hours', NULL, false);

-- Task Assignments
INSERT INTO task_assignments (id, task_id, team_member_id, assigned_start, assigned_end, estimated_hours, actual_hours, status) VALUES
('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', NOW()-INTERVAL '60 days', NOW()-INTERVAL '45 days', 40, 38, 'completed'),
('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003', NOW()-INTERVAL '55 days', NOW()-INTERVAL '40 days', 20, 22, 'completed'),
('55555555-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', NOW()-INTERVAL '20 days', NOW()+INTERVAL '10 days', 60, 30, 'in progress'),
('55555555-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001', NOW()-INTERVAL '50 days', NOW()-INTERVAL '35 days', 24, 26, 'completed'),
('55555555-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002', NOW()-INTERVAL '40 days', NOW()-INTERVAL '25 days', 24, 22, 'completed'),
('55555555-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002', NOW()-INTERVAL '25 days', NOW()-INTERVAL '10 days', 16, 18, 'completed'),
('55555555-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000006', NOW()-INTERVAL '3 days', NOW()+INTERVAL '3 days', 12, 5, 'in progress'),
('55555555-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000005', NOW()-INTERVAL '80 days', NOW()-INTERVAL '50 days', 40, 45, 'completed'),
('55555555-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000005', NOW()-INTERVAL '30 days', NOW()-INTERVAL '5 days', 32, 20, 'delayed'),
('55555555-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000006', NOW()-INTERVAL '15 days', NOW()-INTERVAL '8 days', 16, 14, 'completed'),
('55555555-0000-0000-0000-000000000011', '44444444-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000001', NOW()-INTERVAL '7 days', NOW()+INTERVAL '4 days', 24, 14, 'in progress'),
('55555555-0000-0000-0000-000000000012', '44444444-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000004', NOW()-INTERVAL '10 days', NOW()+INTERVAL '20 days', 40, 18, 'in progress'),
('55555555-0000-0000-0000-000000000013', '44444444-0000-0000-0000-000000000015', '11111111-0000-0000-0000-000000000001', NOW(), NOW()+INTERVAL '4 hours', 2, 1, 'in progress'),
('55555555-0000-0000-0000-000000000014', '44444444-0000-0000-0000-000000000016', '11111111-0000-0000-0000-000000000002', NOW(), NOW()+INTERVAL '2 hours', 1, 0, 'scheduled');

-- Schedules
INSERT INTO schedules (id, team_member_id, task_assignment_id, start_datetime, end_datetime, color_code) VALUES
('66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000013', NOW(), NOW()+INTERVAL '4 hours', '#6366F1'),
('66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000014', NOW()+INTERVAL '1 hour', NOW()+INTERVAL '3 hours', '#10B981'),
('66666666-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000003', NOW()+INTERVAL '4 hours', NOW()+INTERVAL '8 hours', '#6366F1'),
('66666666-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000007', NOW()+INTERVAL '2 hours', NOW()+INTERVAL '6 hours', '#F59E0B');

-- Activity Logs
INSERT INTO activity_logs (entity_type, entity_id, action, description) VALUES
('project', '33333333-0000-0000-0000-000000000001', 'status_changed', 'Project status changed to In Progress'),
('project', '33333333-0000-0000-0000-000000000003', 'milestone_reached', 'BrightPath Website Redesign reached 92% completion'),
('task', '44444444-0000-0000-0000-000000000001', 'completed', 'Backend API Architecture task marked as completed'),
('client', '22222222-0000-0000-0000-000000000002', 'waiting_update', 'Client flagged as waiting for update'),
('project', '33333333-0000-0000-0000-000000000005', 'deadline_crossed', 'TerraGrow E-Commerce Store deadline has passed'),
('task', '44444444-0000-0000-0000-000000000010', 'overdue', 'Product Configurator task is now overdue'),
('client', '22222222-0000-0000-0000-000000000007', 'waiting_update', 'CodeVault flagged as waiting for update'),
('project', '33333333-0000-0000-0000-000000000008', 'urgent', 'CodeVault Security Audit deadline approaching in 4 days');

-- Notes
INSERT INTO notes (entity_type, entity_id, content) VALUES
('client', '22222222-0000-0000-0000-000000000001', 'Key stakeholder is Michael Reynolds. Always loop in their CTO (Brian Walsh) for technical decisions.'),
('client', '22222222-0000-0000-0000-000000000002', 'Client prefers async updates via email. Avoid Slack for formal comms.'),
('project', '33333333-0000-0000-0000-000000000001', 'Client has approved the new architecture. Next review scheduled for end of month.'),
('project', '33333333-0000-0000-0000-000000000005', 'Awaiting client-supplied product images and copy before final launch.'),
('task', '44444444-0000-0000-0000-000000000010', 'Product configurator scope was expanded mid-sprint — contributed to delay.');
