/* ============================================================
   IntentLayer — analyze.js
   AI Analysis Engine: system prompt + API integration
   Supports: OpenAI (gpt-4o), Anthropic (claude-3-5-sonnet)
   ============================================================ */

'use strict';

// ── SYSTEM PROMPT ────────────────────────────────────────────
export const SYSTEM_PROMPT = `SYSTEM ROLE:
You are a senior product manager at a successful venture-backed startup.
Your job is not to summarize interviews.
Your job is to decide what the company should build next based strictly on customer evidence.

You must think in terms of product impact, user behavior, retention, and business outcomes.
Avoid generic advice. Produce a clear, decisive recommendation.

IMPORTANT RULES:
* Use only evidence from the transcript
* Do not hallucinate features unrelated to user problems
* Prefer solving root causes, not surface complaints
* Recommend ONE primary feature only
* Be confident and specific
* Quote real user statements from the transcript

OUTPUT FORMAT (STRICT JSON — return ONLY the JSON object, no markdown, no explanation):

{
  "pain_points": [
    {
      "title": "",
      "severity": "HIGH | MEDIUM | LOW",
      "description": "",
      "evidence_quote": "",
      "frequency_estimate": ""
    }
  ],
  "themes": [
    {
      "name": "",
      "frequency_estimate": "",
      "explanation": ""
    }
  ],
  "recommended_feature": {
    "name": "",
    "confidence_score": 0,
    "problem_it_solves": "",
    "why_this_is_the_root_problem": "",
    "expected_user_impact": "",
    "business_impact": "",
    "affected_users": "",
    "effort_estimate": ""
  },
  "supporting_quotes": [
    { "quote": "", "speaker": "", "timestamp": "", "theme": "" }
  ],
  "product_spec": {
    "overview": "",
    "user_story": "",
    "acceptance_criteria": [""],
    "success_metrics": [""]
  },
  "engineering_plan": {
    "frontend_tasks": [{ "id": "", "title": "", "description": "", "estimate": "" }],
    "backend_tasks":  [{ "id": "", "title": "", "description": "", "estimate": "" }],
    "database_changes": [{ "id": "", "title": "", "description": "", "estimate": "" }]
  },
  "coding_agent_prompt": ""
}

ANALYSIS INSTRUCTIONS:
1. Identify repeated frustrations or drop-off behaviors.
2. Determine what prevents users from returning or getting value.
3. Infer the underlying unmet need.
4. Choose the single highest-impact feature to address it.
5. Justify the decision using interview evidence.
6. Produce a concrete implementation plan engineers could follow.

Remember: You are making a product decision, not a summary.`;

// ── DEMO FALLBACK DATA ────────────────────────────────────────
// Used when no API key is provided or in demo mode
export const DEMO_REPORT = {
    pain_points: [
        {
            title: "No re-engagement mechanism after first session",
            severity: "HIGH",
            description: "Users sign up, complete one session, then passively churn. There is no system pulling them back.",
            evidence_quote: "I used it once and totally forgot it existed. There was nothing pulling me back.",
            frequency_estimate: "92%"
        },
        {
            title: "Users don't understand what to do after onboarding",
            severity: "HIGH",
            description: "The first-session completion rate is low because the next step is unclear after finishing onboarding.",
            evidence_quote: "I didn't know what to do after the setup. I just kind of closed the tab.",
            frequency_estimate: "74%"
        },
        {
            title: "No visible progress tracking or achievement feedback",
            severity: "MEDIUM",
            description: "Users have no way to see how their use of the product is helping them over time.",
            evidence_quote: "I'd use it more if I could see what I'm getting out of it week over week.",
            frequency_estimate: "58%"
        },
        {
            title: "Trust concerns — unclear data handling and privacy",
            severity: "MEDIUM",
            description: "Privacy questions surface during the first session, creating hesitation before users invest effort.",
            evidence_quote: "I wasn't sure what you were doing with my data. That made me a little cautious.",
            frequency_estimate: "44%"
        },
        {
            title: "Mobile experience feels degraded versus desktop",
            severity: "LOW",
            description: "Several interactions that work well on desktop feel clunky or broken on mobile.",
            evidence_quote: "On my phone it was kind of a pain. I ended up just using my laptop.",
            frequency_estimate: "28%"
        }
    ],
    themes: [
        { name: "Retention", frequency_estimate: "88%", explanation: "Users churn passively — no active pull to return. The product lacks hooks that reconnect users to their goals." },
        { name: "Onboarding", frequency_estimate: "72%", explanation: "First-session completion rate is low. Users don't know what to do after signing up." },
        { name: "Motivation", frequency_estimate: "55%", explanation: "No feedback loop for personal progress. Users feel like effort disappears into a void." },
        { name: "Trust", frequency_estimate: "42%", explanation: "Privacy and data handling questions surface in the first session, creating hesitation." },
        { name: "Confusion", frequency_estimate: "30%", explanation: "Language and labeling in the product creates friction for non-technical users." }
    ],
    recommended_feature: {
        name: "Smart Accountability Reminders",
        confidence_score: 94,
        problem_it_solves: "Post-first-session churn due to absence of re-engagement loop",
        why_this_is_the_root_problem: "62% of users forget to return after the first session. No re-engagement mechanism exists. Across all three interviews, users described an identical pattern: initial enthusiasm followed by passive non-return. A targeted reminder system tied to session state is the minimum effective fix.",
        expected_user_impact: "+25–30% D7 retention · +18% session frequency · -15% voluntary churn",
        business_impact: "Directly addresses primary churn driver. Estimated payback within first 30 days for cohorts that opt in.",
        affected_users: "Est. 62% of all registered users (based on interview cohort)",
        effort_estimate: "Medium · 5–8 engineering days · No new infrastructure required"
    },
    supporting_quotes: [
        { quote: "I used it once and totally forgot it existed. There was nothing pulling me back. I meant to return but life got in the way.", speaker: "Sarah K.", timestamp: "14:32", theme: "Retention" },
        { quote: "I wanted a reminder but didn't see a way to set one. I just drifted away. Not because I didn't find value — I just stopped thinking about it.", speaker: "Marcus T.", timestamp: "22:08", theme: "Retention" },
        { quote: "If something texted me like 'hey you haven't come back in three days,' I probably would. That would actually work on me.", speaker: "Priya M.", timestamp: "09:51", theme: "Retention" },
        { quote: "I don't need a lot — just something to keep me accountable. Even a weekly email would make a difference.", speaker: "Marcus T.", timestamp: "38:17", theme: "Motivation" },
        { quote: "My calendar is packed. Unless something is actively asking for my attention, it doesn't get any. That's just my reality.", speaker: "Sarah K.", timestamp: "31:44", theme: "Retention" }
    ],
    product_spec: {
        overview: "Smart Accountability Reminders is a re-engagement feature that allows users to configure personalized notification schedules linked to their session state. The system sends reminders via email and/or push notification at user-defined cadences, with a deep link back to the user's last active context.",
        user_story: "As a registered user who has completed at least one session, I want to receive a timely nudge to return — at a frequency I control — so that I maintain momentum toward my goals without relying on my own memory.",
        acceptance_criteria: [
            "User can enable / disable reminders from their settings page",
            "User selects reminder cadence: daily, every other day, weekly",
            "User receives reminder on selected channel: email, browser push, or both",
            "Reminder body includes a direct link to last active session",
            "Reminders are sent in user's local timezone",
            "User can pause reminders for a custom duration (1 day, 1 week)",
            "Onboarding flow includes reminder preference step after first session"
        ],
        success_metrics: [
            "D7 Retention: baseline 22% → target 47% (90 days)",
            "Reminder opt-in rate: > 40% (30 days post-launch)",
            "Session frequency / user: 1.2/wk → 1.9/wk (60 days)",
            "Voluntary churn (30d): 28% → < 15% (90 days)"
        ]
    },
    engineering_plan: {
        frontend_tasks: [
            { id: "FE-01", title: "Settings page: reminder preferences", description: "Toggle, cadence selector, channel selector (email/push), pause button, preview of next reminder time", estimate: "~5h" },
            { id: "FE-02", title: "Onboarding: reminder setup step", description: "Modal shown after first session completion. Pre-selects weekly cadence. Skippable.", estimate: "~4h" },
            { id: "FE-03", title: "Browser push notification permission flow", description: "Request permission at opt-in, handle denial gracefully, register service worker", estimate: "~3h" }
        ],
        backend_tasks: [
            { id: "BE-01", title: "Create reminder_preferences table", description: "Fields: user_id, cadence (enum), channel (enum), enabled (bool), last_sent_at, paused_until, timezone", estimate: "~3h" },
            { id: "BE-02", title: "Reminder dispatch cron job", description: "Query due reminders, respect timezone and cadence, queue email/push jobs, update last_sent_at", estimate: "~5h" },
            { id: "BE-03", title: "Email template + deep link generation", description: "Session-aware deep link, unsubscribe token, Resend/SendGrid integration", estimate: "~4h" },
            { id: "BE-04", title: "Preferences API endpoints", description: "GET /reminders/preferences · PATCH /reminders/preferences · POST /reminders/pause", estimate: "~3h" }
        ],
        database_changes: [
            { id: "DB-01", title: "reminder_preferences migration", description: "New table with FK to users, cadence enum, channel enum, timestamps", estimate: "~1h" },
            { id: "DB-02", title: "reminder_logs table", description: "Track every sent reminder: user_id, sent_at, channel, opened_at (nullable)", estimate: "~1h" },
            { id: "DB-03", title: "Index on (next_reminder_at, enabled)", description: "Cron job query optimization. Partial index for enabled=true rows only.", estimate: "~30m" }
        ]
    },
    coding_agent_prompt: `You are implementing the "Smart Accountability Reminders" feature for a SaaS web application.

## Context
Analysis of 3 customer interviews (107 minutes total) by IntentLayer identified that 62% of users churn after their first session because there is no re-engagement loop. This feature is the highest-priority product action based on evidence from real user conversations.

## Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- Database: PostgreSQL via Prisma ORM
- Email: Resend (resend.com)
- Push: Web Push API + service worker
- Job queue: Vercel Cron Jobs or BullMQ

## Feature: Smart Accountability Reminders

### What to build
Users receive a configurable reminder to return to their last session. They choose: cadence (daily / every other day / weekly), channel (email / push / both), and can pause reminders.

### Implementation order

**Step 1 — Database**
Add to prisma/schema.prisma:
  model ReminderPreference {
    id          String   @id @default(cuid())
    userId      String   @unique
    enabled     Boolean  @default(false)
    cadence     Cadence  @default(WEEKLY)
    channel     Channel  @default(EMAIL)
    timezone    String   @default("UTC")
    nextSendAt  DateTime?
    pausedUntil DateTime?
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  enum Cadence { DAILY EVERY_OTHER_DAY WEEKLY }
  enum Channel { EMAIL PUSH BOTH }

Run: npx prisma migrate dev --name add_reminder_preferences

**Step 2 — API Routes**
Create: app/api/reminders/preferences/route.ts
  GET  - return current user's reminder preferences
  POST - upsert preferences (enabled, cadence, channel, timezone)

**Step 3 — Email Template**
In emails/reminder.tsx (using react-email):
  - Subject: "You haven't returned to [App] in X days"
  - Body: brief motivation + CTA button with deep link to last session

**Step 4 — Cron Job**
Create: app/api/cron/reminders/route.ts
  1. Query reminders WHERE enabled=true AND nextSendAt <= now()
  2. For each: send email/push, update nextSendAt based on cadence
  3. Protect route with CRON_SECRET env var

**Step 5 — Settings UI**
Create: app/(dashboard)/settings/reminders/page.tsx
  - Toggle, cadence selector, channel selector, pause button

**Step 6 — Onboarding Step**
In your post-first-session flow, show a modal prompting reminder setup.

Start with: prisma/schema.prisma — add the model above, then run the migration.`
};

// ── API CALL ─────────────────────────────────────────────────
/**
 * analyzeTranscript
 * Calls OpenAI or Anthropic with the system prompt + transcript.
 * Returns parsed JSON matching the DEMO_REPORT shape.
 *
 * @param {string} transcript - Full interview transcript text
 * @param {string} apiKey     - User-provided API key
 * @param {string} provider   - 'openai' | 'anthropic'
 * @param {function} onProgress - optional callback for status updates
 */
export async function analyzeTranscript(transcript, apiKey, provider = 'openai', onProgress = null) {
    if (!transcript || transcript.trim().length < 100) {
        throw new Error('Transcript is too short. Please paste the full interview text (minimum ~100 characters).');
    }
    if (!apiKey || apiKey.trim().length < 20) {
        throw new Error('Please enter a valid API key.');
    }

    const userMessage = `TRANSCRIPT:\n\n${transcript.trim()}`;

    if (onProgress) onProgress('Sending transcript to AI model…');

    let response;
    let rawText;

    if (provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                temperature: 0.2,
                max_tokens: 4096,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `OpenAI error ${response.status}`;
            throw new Error(msg);
        }

        const data = await response.json();
        rawText = data.choices?.[0]?.message?.content || '';

    } else if (provider === 'anthropic') {
        // Note: Anthropic blocks CORS in browsers by default.
        // This path works from a server/proxy. Shown here for completeness.
        response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey.trim(),
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: userMessage }]
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `Anthropic error ${response.status}`;
            throw new Error(msg);
        }

        const data = await response.json();
        rawText = data.content?.[0]?.text || '';
    } else {
        throw new Error(`Unknown provider: ${provider}`);
    }

    if (onProgress) onProgress('Parsing AI response…');

    // Extract JSON from the response (strip any markdown fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('AI returned an unexpected format. Try again or check your API key.');
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
        throw new Error('Failed to parse AI JSON response. The model may have returned malformed output.');
    }

    return parsed;
}
