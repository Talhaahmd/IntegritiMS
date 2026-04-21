import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an AI Project Manager for a software agency.
You analyze team performance, tasks, and project data.
Your job is to generate clear, actionable insights.

Always respond with a valid JSON object using EXACTLY this structure:
{
  "critical_actions": [
    { "severity": "high|medium|low", "text": "..." }
  ],
  "team_performance": {
    "headline": "...",
    "on_time_rate": 75,
    "top_performers": ["name — reason"],
    "needs_attention": ["name — reason"],
    "efficiency_trend": "improving|stable|declining",
    "trend_note": "..."
  },
  "developer_insights": [
    {
      "name": "...",
      "tasks_completed": 0,
      "tasks_delayed": 0,
      "tasks_in_progress": 0,
      "on_time_rate": 0,
      "est_hours": 0,
      "actual_hours": 0,
      "performance_label": "Excellent|Good|Average|Needs Improvement",
      "strengths": ["..."],
      "improvements": ["..."],
      "workload_status": "Overloaded|Balanced|Underutilized"
    }
  ],
  "project_health": {
    "healthy": [{ "name": "...", "note": "..." }],
    "at_risk": [{ "name": "...", "note": "..." }],
    "critical": [{ "name": "...", "note": "..." }]
  },
  "recommendations": [
    { "priority": "immediate|soon|consider", "action": "...", "rationale": "..." }
  ],
  "executive_summary": "2-3 sentence overview of current agency health"
}

Be concise, factual, and specific. Reference real names and numbers from the data. No fluff.`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured." }, { status: 500 });
    }

    const { data } = await req.json();

    const userMessage = `Analyze this agency data and generate a full operations report:

${JSON.stringify(data, null, 2)}

Today's date: ${new Date().toISOString().split("T")[0]}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 4096,
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message ?? "OpenAI error" }, { status: 500 });
    }

    const result = await response.json();
    const content = JSON.parse(result.choices[0].message.content);
    const tokens = result.usage?.total_tokens ?? 0;

    return NextResponse.json({ report: content, tokens });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
