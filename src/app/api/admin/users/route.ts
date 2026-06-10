import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, full_name, permissions } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await admin.from("user_permissions").insert({
      user_id: data.user.id,
      email,
      full_name: full_name || "",
      role: "user",
      can_view_clients: permissions?.can_view_clients ?? true,
      can_add_team_members: permissions?.can_add_team_members ?? false,
      can_assign_tasks: permissions?.can_assign_tasks ?? false,
      can_view_reports: permissions?.can_view_reports ?? false,
    });

    return NextResponse.json({ success: true, userId: data.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("user_permissions").select("*").order("created_at");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ users: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user_id, permissions } = await req.json();
    const admin = createAdminClient();
    const { error } = await admin.from("user_permissions").update(permissions).eq("user_id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { user_id } = await req.json();
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user_id);
    await admin.from("user_permissions").delete().eq("user_id", user_id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
