/* ============================================================
   IntentLayer App — app.js  (plain script, no ES imports)
   All analyze.js content is inlined here so it works on file://
   ============================================================ */

'use strict';

// ── INLINED from analyze.js ──────────────────────────────────

const SYSTEM_PROMPT = `SYSTEM ROLE:
You are a senior product manager at a successful venture-backed startup.
Your job is not to summarize interviews.
Your job is to decide what the company should build next based strictly on customer evidence.
You must think in terms of product impact, user behavior, retention, and business outcomes.
Avoid generic advice. Produce a clear, decisive recommendation.

CRITICAL RULES:
* Use only evidence from the transcript
* Do not hallucinate features unrelated to user problems
* Prefer solving root causes, not surface complaints
* Recommend ONE primary feature only
* Be confident and specific
* Quote real user statements from the transcript verbatim

FIELD REQUIREMENTS — fill EVERY field with specific, detailed content:
- pain_points[].description: 2-3 sentences — pain detail, business impact, why it matters
- pain_points[].evidence_quote: verbatim exact quote from transcript (do not paraphrase)
- pain_points[].frequency_estimate: percentage like "78%" — estimate from interview evidence
- themes[].frequency_estimate: percentage like "88%"
- themes[].explanation: 2 sentences on the pattern and its product significance
- recommended_feature.confidence_score: INTEGER from 1 to 100 (example: 87). NEVER a decimal like 0.87
- recommended_feature.why_this_is_the_root_problem: 3+ sentences — specific evidence-backed reasoning
- recommended_feature.expected_user_impact: measurable metrics e.g. "+30% retention, -2hr/day wasted"
- recommended_feature.business_impact: concrete revenue/cost impact
- recommended_feature.effort_estimate: e.g. "Medium — 6 to 10 engineering days"
- product_spec.overview: 2-3 sentences — what exactly gets built and why
- product_spec.user_story: "As a [role], I want [action] so that [outcome]"
- product_spec.acceptance_criteria: 4-6 specific testable criteria
- product_spec.success_metrics: EACH item formatted as "Metric name: specific target" — example: "Daily active usage: +40% in 60 days"
- engineering_plan.frontend_tasks: 2-4 tasks with id FE-01, description, estimate e.g. "2 days"
- engineering_plan.backend_tasks: 2-4 tasks with id BE-01, description, estimate
- engineering_plan.database_changes: 1-3 tasks with id DB-01, table/field names, estimate
- coding_agent_prompt: 300+ word implementation guide — include feature context, tech stack (Next.js/Node/Postgres assumed), numbered steps in order, exact file names to create, what to build first

OUTPUT FORMAT — return ONLY raw JSON. Start with { and end with }. NO markdown fences. NO text outside the JSON:

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
    "frontend_tasks":   [{ "id": "", "title": "", "description": "", "estimate": "" }],
    "backend_tasks":    [{ "id": "", "title": "", "description": "", "estimate": "" }],
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


const DEMO_REPORT = {
    core_problem: "Users are not failing to engage with the product—they are failing to return to it. The root cause is the absence of any re-engagement mechanism after the first session. Without an external trigger, the product competes against every other distraction in a user's life and loses by default.",
    pain_points: [
        { title: "No re-engagement mechanism after first session", severity: "HIGH", description: "Users sign up, complete one session, then passively churn. There is no system pulling them back.", quote: "I used it once and totally forgot it existed. There was nothing pulling me back." },
        { title: "Users don't understand what to do after onboarding", severity: "HIGH", description: "The first-session completion rate is low because the next step is unclear after finishing onboarding.", quote: "I didn't know what to do after the setup. I just kind of closed the tab." },
        { title: "No visible progress tracking or achievement feedback", severity: "MEDIUM", description: "Users have no way to see how their use of the product is changing things over time.", quote: "I'd use it more if I could see what I'm getting out of it week over week." },
        { title: "Trust concerns — unclear data handling and privacy", severity: "MEDIUM", description: "Privacy questions surface during the first session, creating hesitation.", quote: "I wasn't sure what you were doing with my data. That made me a little cautious." },
        { title: "Mobile experience feels degraded versus desktop", severity: "LOW", description: "Several interactions that work well on desktop feel clunky or broken on mobile.", quote: "On my phone it was kind of a pain. I ended up just using my laptop." }
    ],
    themes: [
        { name: "Retention", what_users_are_experiencing: "Users churn passively — no active pull to return. The product lacks hooks that reconnect users to their goals.", why_it_matters: "Directly impacts LTV and active user count." },
        { name: "Onboarding", what_users_are_experiencing: "First-session completion rate is low. Users don't know what to do after signing up.", why_it_matters: "Creates a severe bottleneck at the top of the funnel." },
        { name: "Motivation", what_users_are_experiencing: "No feedback loop for personal progress. Users feel like effort disappears into a void.", why_it_matters: "Caps the maximum engagement depth for power users." },
        { name: "Trust", what_users_are_experiencing: "Privacy and data handling questions surface in the first session, creating hesitation.", why_it_matters: "Causes unnecessary drop-off during core conversion moments." },
        { name: "Confusion", what_users_are_experiencing: "Language and labeling in the product creates friction for non-technical users.", why_it_matters: "Slows down time-to-value for the majority of new cohorts." }
    ],
    decision_rationale: {
        root_cause_analysis: "Users form an initial intent to use the product, but without a clear system to pull them back, their attention defaults to other priorities. The critical failure point is the gap between session 1 and session 2.",
        alternative_solutions_considered: [
            {
                feature: "Redesign the onboarding tutorial",
                why_teams_build_it: "Low first-session completion suggests onboarding is confusing. A better tutorial would help users understand the product faster.",
                why_rejected: "Improves activation, not retention. Users who completed onboarding still churned. The problem is post-session dropout, not in-session confusion."
            },
            {
                feature: "Build a progress dashboard",
                why_teams_build_it: "Users mentioned they couldn't see what they were getting out of the product. Visibility into results would theoretically motivate continued use.",
                why_rejected: "A dashboard requires return visits to deliver value—it's downstream of the problem, not upstream. If users aren't returning, they'll never see the dashboard."
            },
            {
                feature: "Add in-product gamification (streaks, badges)",
                why_teams_build_it: "Gamification is a proven pattern for habit formation in consumer products. It creates intrinsic motivation.",
                why_rejected: "Gamification only works if the user is already in the product. It does not solve the initial re-entry problem and adds significant scope complexity for uncertain ROI."
            }
        ],
        why_selected_feature_wins: "The Adaptive Re-engagement Coach is the only intervention that acts before the user returns, not after. It addresses the exact moment of drop-off—after the first session, before the second—by using an external signal (notification) to re-establish intent. It works on users who are already motivated but simply forget, making it a high-leverage fix."
    },
    recommended_feature: {
        name: "Adaptive Re-engagement Coach",
        confidence: 94,
        problem_addressed: "Post-first-session churn due to absence of re-engagement loop",
        expected_user_behavior_change: "Users will receive state-aware triggers that prompt them to return to the application, moving 62% of one-and-done users into a weekly habit loop.",
        expected_business_impact: "+25–30% D7 retention · +18% session frequency · -15% voluntary churn. Estimated payback within first 30 days for cohorts that opt in."
    },
    supporting_quotes: [
        "I used it once and totally forgot it existed. There was nothing pulling me back. I meant to return but life got in the way.",
        "I wanted a reminder but didn't see a way to set one. I just drifted away. Not because I didn't find value — I just stopped thinking about it.",
        "If something texted me like 'hey you haven't come back in three days,' I probably would. That would actually work on me.",
        "I don't need a lot — just something to keep me accountable. Even a weekly email would make a difference.",
        "My calendar is packed. Unless something is actively asking for my attention, it doesn't get any. That's just my reality."
    ],
    user_personas: [
        { persona_name: "The Motivated Starter", behavior_pattern: "Signs up after a triggering life event. Highly engaged in session one, exploring features with genuine curiosity.", primary_need: "Returns only when manually remembering — no system pulls them back after the initial burst." },
        { persona_name: "The Accountability Seeker", behavior_pattern: "Uses the product to stay on track with existing goals. Prefers structured routines and responds well to external nudges.", primary_need: "Loses momentum without consistent check-ins and visible streak or progress data." },
        { persona_name: "The Passive Evaluator", behavior_pattern: "Signed up to 'check it out' rather than solve a specific problem. Low urgency, easily distracted.", primary_need: "Never forms a habit because no feature creates a compelling reason to return." }
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
        ],
        post_launch_validation_metrics: [
            "D7 retention: track weekly for first 90 days, split by reminder opt-in vs not opted in",
            "Reminder open rate: target >35% — signals whether messaging resonates",
            "Session frequency: measure weekly sessions/active user before and after reminder cohort",
            "Opt-in → return rate: % of users who received a reminder and opened the app within 24h",
            "Churn within 30 days: compare churned users who were vs were not in reminder cohort"
        ]
    },
    engineering_plan: {
        frontend_tasks: [
            "FE-01 Settings page: reminder preferences — Toggle, cadence selector, channel selector (email/push), pause button, preview of next reminder time (~5h)",
            "FE-02 Onboarding: reminder setup step — Modal shown after first session completion. Pre-selects weekly cadence. Skippable. (~4h)",
            "FE-03 Browser push notification permission flow — Request permission at opt-in, handle denial gracefully, register service worker (~3h)"
        ],
        backend_tasks: [
            "BE-01 Create reminder_preferences table — Fields: user_id, cadence (enum), channel (enum), enabled (bool), last_sent_at, paused_until, timezone (~3h)",
            "BE-02 Reminder dispatch cron job — Query due reminders, respect timezone and cadence, queue email/push jobs, update last_sent_at (~5h)",
            "BE-03 Email template + deep link generation — Session-aware deep link, unsubscribe token, Resend/SendGrid integration (~4h)",
            "BE-04 Preferences API endpoints — GET /reminders/preferences · PATCH /reminders/preferences · POST /reminders/pause (~3h)"
        ],
        database_changes: [
            "DB-01 reminder_preferences migration — New table with FK to users, cadence enum, channel enum, timestamps (~1h)",
            "DB-02 reminder_logs table — Track every sent reminder: user_id, sent_at, channel, opened_at (nullable) (~1h)",
            "DB-03 Index on (next_reminder_at, enabled) — Cron job query optimization. Partial index for enabled=true rows only. (~30m)"
        ]
    },
    risks_and_mitigations: [
        { risk: "Users opt in to reminders but immediately disable them after the first notification feels spammy", mitigation: "Default to weekly cadence (not daily). Allow instant pause from inside the notification itself with one tap." },
        { risk: "Email deliverability issues cause reminders to land in spam, undermining re-engagement", mitigation: "Use a dedicated sending domain with SPF/DKIM. Monitor bounce rates and open rates in the first 30 days." },
        { risk: "Cron job failures silently skip users, lowering actual send rates without alerting the team", mitigation: "Add a dead-man's-switch alert — if no reminders fire in a 25h window, page on-call. Log every dispatch attempt." },
        { risk: "Feature scope creeps to include in-app reminders, SMS, and analytics before launch", mitigation: "Hard scope lock: email + push only for v1. Build the toggle infrastructure to support future channels without shipping them." }
    ],
    do_nothing_consequence: "Without this feature, the current churn pattern will compound. Users who sign up and experience one good session will continue drifting away at the same rate. D7 retention stays near 22%. Monthly active user growth is capped by acquisition cost, not expanded by activation efficiency. Within 6 months, without addressing re-engagement, CAC will need to 2x to maintain MAU targets. Existing cohorts will underperform, reducing LTV and making the unit economics increasingly unsustainable.",
    coding_agent_prompt: `You are implementing the "Smart Accountability Reminders" feature for a SaaS web application.

## Context
Analysis of 3 customer interviews (107 minutes total) by IntentLayer identified that 62% of users churn after their first session because there is no re-engagement loop. This is the highest-priority product action based on evidence from real user conversations.

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


async function analyzeTranscript(transcript, apiKey, provider = 'ollama', onProgress = null, modelName = '') {
    if (!transcript || transcript.trim().length < 100) throw new Error('Transcript is too short (minimum ~100 characters).');

    if (onProgress) onProgress('Sending transcript to AI model…');

    // All LLM calls go through the backend server — no CORS issues, no API keys in browser
    let res;
    // Use absolute URL so this works whether opened via file:// or http://localhost:3000
    const BACKEND = 'http://localhost:3000';
    try {
        res = await fetch(`${BACKEND}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transcript,
                provider,
                apiKey: apiKey || '',
                model: modelName || ''
            })
        });
    } catch (networkErr) {
        throw new Error('Cannot reach the IntentLayer backend. Restart it:\n\n  cd IntentLayer && npm start\n\nThen try again (server must be running on port 3000).');
    }

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(payload.error || `Server error ${res.status}`);
    }

    if (onProgress) onProgress('Parsing AI response…');
    return payload.report;
}


// ── STATE ────────────────────────────────────────────────────
const state = {
    files: [],
    inputMode: 'upload',
    report: null,
    currentPage: 'upload',
    usedAI: false,
};

// ── UTILITIES ────────────────────────────────────────────────
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}
function formatDuration() {
    return `${Math.floor(Math.random() * 45) + 15}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
}
function getFileIcon(name) {
    return { mp4: '🎬', mp3: '🎵', wav: '🎵', m4a: '🎵' }[name.split('.').pop().toLowerCase()] || '📁';
}
function uid() { return Math.random().toString(36).slice(2, 9); }
function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
}

// ── PAGE NAV ─────────────────────────────────────────────────
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${name}`);
    if (target) target.classList.add('active');
    state.currentPage = name;
    const order = ['upload', 'processing', 'report'];
    const idx = order.indexOf(name);
    document.querySelectorAll('.bc-item').forEach((item, i) => {
        item.classList.remove('active', 'done');
        if (i === idx) item.classList.add('active');
        else if (i < idx) item.classList.add('done');
    });
    window.scrollTo(0, 0);
}

// ── MODE TABS ─────────────────────────────────────────────────
const tabUpload = document.getElementById('tab-upload');
const tabTranscript = document.getElementById('tab-transcript');
const uploadPanel = document.getElementById('upload-mode-panel');
const transcriptPanel = document.getElementById('transcript-mode-panel');

function switchMode(mode) {
    state.inputMode = mode;
    tabUpload.classList.toggle('active', mode === 'upload');
    tabTranscript.classList.toggle('active', mode === 'transcript');
    uploadPanel.style.display = mode === 'upload' ? '' : 'none';
    transcriptPanel.style.display = mode === 'transcript' ? '' : 'none';
    updateStartButton();
}

tabUpload.addEventListener('click', () => switchMode('upload'));
tabTranscript.addEventListener('click', () => switchMode('transcript'));

// ── TRANSCRIPT INPUT ─────────────────────────────────────────
const transcriptInput = document.getElementById('transcript-input');
const charCount = document.getElementById('transcript-charcount');

transcriptInput.addEventListener('input', () => {
    charCount.textContent = `${transcriptInput.value.length.toLocaleString()} characters`;
    updateStartButton();
});

// ── API CONFIG TOGGLE ─────────────────────────────────────────
const configToggle = document.getElementById('api-config-toggle');
const configBody = document.getElementById('api-config-body');
const configChevron = document.getElementById('api-chevron');
const apiKeyInput = document.getElementById('api-key-input');
const apiStatusBadge = document.getElementById('api-status-badge');
const providerSelect = document.getElementById('api-provider-select');
const modelNameRow = document.getElementById('model-name-row');
const apiKeyRow = document.getElementById('api-key-row');
const apiModelInput = document.getElementById('api-model-input');
const apiNoteText = document.getElementById('api-note-text');

configBody.style.display = 'none'; // start collapsed

// Provider-specific UI notes
const PROVIDER_META = {
    ollama: { keyRequired: false, keyPlaceholder: 'Not needed for Ollama', modelPlaceholder: 'llama3.2', defaultModel: 'llama3.2', showModel: true, note: 'Ollama runs 100% locally — no key needed. Make sure Ollama is running and your model is pulled. Start with: <code>OLLAMA_ORIGINS="*" ollama serve</code><br>Pull a model: <code>ollama pull llama3.2</code> &nbsp;|&nbsp; <code>ollama pull mistral</code>' },
    huggingface: { keyRequired: true, keyPlaceholder: 'hf_... (free at huggingface.co/settings/tokens)', modelPlaceholder: 'mistralai/Mixtral-8x7B-Instruct-v0.1', defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1', showModel: true, note: 'Free tier available — get a token at <a href="https://huggingface.co/settings/tokens" target="_blank">huggingface.co/settings/tokens</a>. Good free models: <code>mistralai/Mixtral-8x7B-Instruct-v0.1</code>, <code>HuggingFaceH4/zephyr-7b-beta</code>' },
    groq: { keyRequired: true, keyPlaceholder: 'gsk_... (from console.groq.com/keys)', modelPlaceholder: 'llama-3.3-70b-versatile', defaultModel: 'llama-3.3-70b-versatile', showModel: true, note: 'Groq runs inference at lightning speed. Get a free API key at <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a>. Recommended models: <code>llama-3.3-70b-versatile</code>, <code>mixtral-8x7b-32768</code>, <code>llama3-70b-8192</code>' },
    openai: { keyRequired: true, keyPlaceholder: 'sk-...', modelPlaceholder: '', defaultModel: '', showModel: false, note: 'Your API key is only used for this request and is never stored.' },
    anthropic: { keyRequired: true, keyPlaceholder: 'sk-ant-...', modelPlaceholder: '', defaultModel: '', showModel: false, note: 'Your API key is only used for this request and is never stored.' },
};


function applyProviderUI(provider) {
    const meta = PROVIDER_META[provider] || PROVIDER_META.ollama;
    // Model name row
    modelNameRow.style.display = meta.showModel ? '' : 'none';
    if (meta.showModel) {
        apiModelInput.placeholder = meta.modelPlaceholder;
        if (!apiModelInput.value || Object.values(PROVIDER_META).some(m => m.defaultModel === apiModelInput.value)) {
            apiModelInput.value = meta.defaultModel;
        }
    }
    // Key row
    apiKeyRow.style.display = meta.keyRequired ? '' : 'none';
    apiKeyInput.placeholder = meta.keyPlaceholder;
    // Note
    apiNoteText.innerHTML = meta.note;
    // Badge
    updateConfigBadge();
    // Also update start button hint
    updateStartButton();
}

function updateConfigBadge() {
    const provider = providerSelect.value;
    const meta = PROVIDER_META[provider] || PROVIDER_META.ollama;
    const hasKey = apiKeyInput.value.trim().length > 5;
    const modelName = apiModelInput.value.trim();
    const providerLabel = { ollama: `Ollama · ${modelName || 'llama3.2'}`, huggingface: `HuggingFace · ${(modelName.split('/').pop()) || 'Mixtral'}`, groq: `Groq · ${modelName || 'llama-3.3-70b'}`, openai: 'GPT-4o', anthropic: 'Claude 3.5' }[provider] || provider;
    if (!meta.keyRequired || hasKey) {
        apiStatusBadge.textContent = `✓ ${providerLabel}`;
        apiStatusBadge.classList.add('configured');
    } else {
        apiStatusBadge.textContent = 'Not configured — uses demo output';
        apiStatusBadge.classList.remove('configured');
    }
}

configToggle.addEventListener('click', () => {
    const open = configBody.style.display !== 'none';
    configBody.style.display = open ? 'none' : 'flex';
    configChevron.classList.toggle('open', !open);
});

providerSelect.addEventListener('change', () => applyProviderUI(providerSelect.value));
apiKeyInput.addEventListener('input', updateConfigBadge);
apiModelInput.addEventListener('input', () => { updateConfigBadge(); updateStartButton(); });

// Declare startBtn/uploadHint BEFORE applyProviderUI() so updateStartButton() can reference them
const startBtn = document.getElementById('start-analysis-btn');
const uploadHint = document.getElementById('upload-hint');

// Apply initial state (Ollama is default)
applyProviderUI(providerSelect.value);

// ── FILE UPLOAD ───────────────────────────────────────────────
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileListEl = document.getElementById('file-list');
// startBtn and uploadHint declared above (before applyProviderUI)

const ACCEPTED = ['mp3', 'wav', 'mp4', 'm4a'];

function isAccepted(f) { return ACCEPTED.includes(f.name.split('.').pop().toLowerCase()); }

function addFiles(raw) {
    const newFiles = Array.from(raw).filter(isAccepted).map(file => ({
        file, id: uid(), name: file.name, size: formatSize(file.size),
        duration: formatDuration(), icon: getFileIcon(file.name), progress: 0
    }));
    if (!newFiles.length) { showToast('Unsupported type. Use .mp3, .mp4, .wav, or .m4a'); return; }
    state.files.push(...newFiles);
    renderFileList();
    updateStartButton();
}

function removeFile(id) {
    state.files = state.files.filter(f => f.id !== id);
    renderFileList();
    updateStartButton();
}

function renderFileList() {
    fileListEl.innerHTML = '';
    state.files.forEach(item => {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.id = `file-${item.id}`;
        div.innerHTML = `
          <div class="file-icon">${item.icon}</div>
          <div class="file-meta">
            <div class="file-name">${esc(item.name)}</div>
            <div class="file-info">${item.size} · ~${item.duration}</div>
            <div class="file-progress-wrap"><div class="file-progress-bar" id="fpb-${item.id}" style="width:0%"></div></div>
          </div>
          <button class="file-remove" aria-label="Remove" data-id="${item.id}">✕</button>`;
        fileListEl.appendChild(div);
    });
    fileListEl.querySelectorAll('.file-remove').forEach(btn =>
        btn.addEventListener('click', () => removeFile(btn.dataset.id)));
}

function isProviderReady() {
    const provider = (providerSelect || { value: 'ollama' }).value;
    const meta = PROVIDER_META[provider];
    if (!meta) return false;
    if (!meta.keyRequired) return true;  // Ollama — no key needed
    return (apiKeyInput.value || '').trim().length > 5;
}

function updateStartButton() {
    const providerReady = isProviderReady();
    if (state.inputMode === 'upload') {
        const has = state.files.length > 0;
        startBtn.disabled = !has;
        uploadHint.textContent = has
            ? `${state.files.length} file${state.files.length > 1 ? 's' : ''} ready — click Start Analysis`
            : 'Add at least one interview to begin';
    } else {
        const len = transcriptInput.value.trim().length;
        startBtn.disabled = len < 100 || !providerReady;
        if (len < 100) {
            uploadHint.textContent = `Paste at least 100 characters of transcript (${len}/100)`;
        } else if (!providerReady) {
            uploadHint.innerHTML = '<span style="color:#f5a623">⚠ API key required for cloud models. Expand configuration.</span>';
        } else {
            uploadHint.textContent = `${len.toLocaleString()} characters ready — click Start Analysis`;
        }
    }
}

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });
document.getElementById('upload-browse-btn').addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });

// ── PROCESSING ANIMATION ─────────────────────────────────────
const STAGE_TIMINGS = [800, 2200, 1800, 1700, 2200, 1600, 1800];
const STAGE_LABELS = [
    'Uploading files…',
    'Transcribing audio with speaker diarization…',
    'Extracting pain points and frustrations…',
    'Identifying recurring themes…',
    'Evaluating product opportunities…',
    'Generating feature recommendation…',
    'Writing product specification & engineering plan…'
];

function animateStages(onComplete) {
    const stages = document.querySelectorAll('.stage');
    const fill = document.getElementById('overall-progress-fill');
    const label = document.getElementById('progress-label');
    stages.forEach(s => { s.classList.remove('active', 'done'); s.querySelector('.stage-status').innerHTML = ''; });
    function activate(idx) {
        if (idx >= stages.length) {
            if (fill) fill.style.width = '100%';
            if (label) label.textContent = 'Analysis complete ✓';
            setTimeout(onComplete, 500);
            return;
        }
        if (idx > 0) {
            stages[idx - 1].classList.remove('active');
            stages[idx - 1].classList.add('done');
            stages[idx - 1].querySelector('.stage-status').innerHTML = '<span class="stage-check">✓</span>';
        }
        stages[idx].classList.add('active');
        stages[idx].querySelector('.stage-status').innerHTML = '<div class="stage-spinner"></div>';
        if (fill) fill.style.width = `${Math.round(((idx + 0.5) / stages.length) * 100)}%`;
        if (label) label.textContent = STAGE_LABELS[idx];
        setTimeout(() => activate(idx + 1), STAGE_TIMINGS[idx]);
    }
    activate(0);
}

// ── ANALYSIS ENTRY ────────────────────────────────────────────
async function startAnalysis() {
    if (startBtn.disabled) return;
    const apiKey = (apiKeyInput.value || '').trim();
    const isTranscript = state.inputMode === 'transcript';
    const transcript = isTranscript ? transcriptInput.value.trim() : null;

    const providerReady = isProviderReady();

    showPage('processing');
    await new Promise(r => setTimeout(r, 100));

    const modelName = (apiModelInput ? apiModelInput.value.trim() : '');
    const provider = providerSelect ? providerSelect.value : 'ollama';

    if (isTranscript && providerReady) {
        // Call the real AI API
        try {
            // Run first 5 stages (simulate transcription steps)
            await new Promise(resolve => {
                const stages = document.querySelectorAll('.stage');
                const fill = document.getElementById('overall-progress-fill');
                const label = document.getElementById('progress-label');
                let idx = 0;
                function tick() {
                    if (idx >= 5) { resolve(); return; }
                    if (idx > 0) { stages[idx - 1].classList.remove('active'); stages[idx - 1].classList.add('done'); stages[idx - 1].querySelector('.stage-status').innerHTML = '<span class="stage-check">✓</span>'; }
                    stages[idx].classList.add('active');
                    stages[idx].querySelector('.stage-status').innerHTML = '<div class="stage-spinner"></div>';
                    if (fill) fill.style.width = `${Math.round(((idx + 0.5) / 7) * 100)}%`;
                    if (label) label.textContent = STAGE_LABELS[idx];
                    idx++;
                    setTimeout(tick, STAGE_TIMINGS[idx - 1]);
                }
                tick();
            });

            const result = await analyzeTranscript(transcript, apiKey, provider,
                msg => { const l = document.getElementById('progress-label'); if (l) l.textContent = msg; }, modelName);
            state.report = result;
            state.usedAI = true;

            // Finish last 2 stages
            await new Promise(resolve => {
                const stages = document.querySelectorAll('.stage');
                const fill = document.getElementById('overall-progress-fill');
                let idx = 5;
                function tick() {
                    if (idx >= stages.length) {
                        if (fill) fill.style.width = '100%';
                        const l = document.getElementById('progress-label');
                        if (l) l.textContent = 'Analysis complete ✓';
                        setTimeout(resolve, 500);
                        return;
                    }
                    if (stages[idx - 1]) { stages[idx - 1].classList.remove('active'); stages[idx - 1].classList.add('done'); stages[idx - 1].querySelector('.stage-status').innerHTML = '<span class="stage-check">✓</span>'; }
                    stages[idx].classList.add('active');
                    stages[idx].querySelector('.stage-status').innerHTML = '<div class="stage-spinner"></div>';
                    if (fill) fill.style.width = `${Math.round(((idx + 0.5) / 7) * 100)}%`;
                    idx++;
                    setTimeout(tick, STAGE_TIMINGS[idx - 1] || 1200);
                }
                tick();
            });
        } catch (err) {
            showAIError(err.message);
            return; // don't navigate to report page
        }
    } else {
        // Demo mode — simulate all stages
        state.report = DEMO_REPORT;
        state.usedAI = false;
        await new Promise(resolve => animateStages(resolve));
    }

    renderReport(state.report);
    showPage('report');
    initReport();
}

startBtn.addEventListener('click', startAnalysis);

// ── AI ERROR STATE ─────────────────────────────────────────
function showAIError(msg) {
    // Hide the stages/progress, reveal error panel
    document.getElementById('stages-container').style.opacity = '0.3';
    const progressWrap = document.getElementById('overall-progress-wrap');
    if (progressWrap) progressWrap.style.display = 'none';
    const errState = document.getElementById('ai-error-state');
    const errMsg = document.getElementById('ai-error-msg');
    const errTips = document.getElementById('ai-error-tips');
    if (!errState) return;
    errMsg.textContent = msg;

    // Contextual tips based on error type
    let tips = [];
    const m = msg.toLowerCase();
    if (m.includes('cors') || m.includes('fetch') || m.includes('failed to fetch') || m.includes('networkerror')) {
        tips = [
            '🔌 Ollama CORS is not enabled. Restart it with:',
            '<code>OLLAMA_ORIGINS="*" ollama serve</code>',
            'Then refresh this page and try again.'
        ];
    } else if (m.includes('unexpected format') || m.includes('parse') || m.includes('json')) {
        tips = [
            '🤖 The model returned non-JSON text. Try:',
            '• Switch to <strong>mistral</strong> or <strong>llama3.1:8b</strong> — they generate more reliable JSON',
            '• Shorten your transcript and try again',
        ];
    } else if (m.includes('quota') || m.includes('billing') || m.includes('limit')) {
        tips = [
            '💳 Your API key has run out of credits.',
            'Switch to <strong>Ollama (local — free)</strong> instead.',
        ];
    } else if (m.includes('404') || m.includes('not found')) {
        tips = [
            '🦙 Model not found. Make sure you pulled it:',
            '<code>ollama pull mistral</code>',
            'Then confirm the model name exactly matches what you typed.',
        ];
    } else if (m.includes('context') || m.includes('too long') || m.includes('token')) {
        tips = [
            '📏 Transcript too long for this model\'s context window.',
            '• Try trimming your transcript to ~2000 words',
            '• Or switch to <strong>llama3.1:8b</strong> which handles longer contexts',
        ];
    } else {
        tips = [
            '• Make sure Ollama is running: <code>OLLAMA_ORIGINS="*" ollama serve</code>',
            '• Check the model name is correct (e.g. <code>mistral</code> or <code>llama3.2</code>)',
            '• Try a shorter transcript',
        ];
    }
    errTips.innerHTML = tips.map(t => `<p>${t}</p>`).join('');
    errState.style.display = 'flex';

    // Wire up buttons (once)
    const retryBtn = document.getElementById('ai-error-retry');
    const demoBtn = document.getElementById('ai-error-demo');
    const retryClone = retryBtn.cloneNode(true);
    const demoClone = demoBtn.cloneNode(true);
    retryBtn.parentNode.replaceChild(retryClone, retryBtn);
    demoBtn.parentNode.replaceChild(demoClone, demoBtn);

    retryClone.addEventListener('click', () => {
        errState.style.display = 'none';
        document.getElementById('stages-container').style.opacity = '';
        if (progressWrap) progressWrap.style.display = '';
        showPage('upload');
    });
    demoClone.addEventListener('click', () => {
        errState.style.display = 'none';
        document.getElementById('stages-container').style.opacity = '';
        if (progressWrap) progressWrap.style.display = '';
        state.report = DEMO_REPORT;
        state.usedAI = false;
        renderReport(state.report);
        showPage('report');
        initReport();
    });
}

// ── DYNAMIC REPORT RENDERING ──────────────────────────────────
function renderReport(r) {
    const rec = r.recommended_feature || {};

    // Header
    const mainTitle = document.getElementById('report-main-title');
    if (mainTitle) mainTitle.textContent = rec.name || 'Product Decision Report';

    // Sidebar meta
    const metaPain = document.getElementById('meta-pain-count');
    const metaTheme = document.getElementById('meta-theme-count');
    const metaMode = document.getElementById('meta-mode');
    if (metaPain) metaPain.textContent = `${(r.pain_points || []).length} found`;
    if (metaTheme) metaTheme.textContent = `${(r.themes || []).length} found`;
    if (metaMode) metaMode.textContent = state.usedAI ? '✓ AI-powered' : 'Demo report';

    const dateEl = document.getElementById('report-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // — Pain points
    const painList = document.getElementById('pain-list');
    if (painList) painList.innerHTML = (r.pain_points || []).map((p, i) => {
        const sev = (p.severity || '').toUpperCase();
        const sevClass = sev === 'HIGH' ? 'sev-high' : sev === 'MEDIUM' ? 'sev-medium' : 'sev-low';
        const sevLabel = sev === 'MEDIUM' ? 'MED' : (sev || 'LOW');
        const pctNum = parseInt(p.frequency_estimate) || Math.max(10, 90 - i * 14);
        const desc = p.description || '';
        return `<div class="pain-row">
          <span class="sev-badge ${sevClass}">${sevLabel}</span>
          <div class="pain-text">
            <div class="pain-name">${esc(p.title)}</div>
            <div class="pain-sub">${esc(desc)}</div>
            ${p.quote ? `<div class="pain-quote">"${esc(p.quote)}"</div>` : ''}
          </div>
          <div class="pain-freq">
            <div class="freq-bar" style="--pct:${pctNum}%"></div>
            <span class="freq-num">${esc(p.frequency_estimate || pctNum + '%')}</span>
          </div>
        </div>`;
    }).join('');

    // — Themes
    const themesGrid = document.getElementById('themes-grid');
    if (themesGrid) themesGrid.innerHTML = (r.themes || []).map((t, i) => {
        const pctNum = parseInt(t.frequency_estimate) || Math.max(20, 88 - i * 16);
        const freqStr = t.frequency_estimate || (pctNum + '%');
        // Derive severity label from frequency
        const freqN = typeof t.frequency_estimate === 'string'
            ? parseInt(t.frequency_estimate) : (t.frequency_estimate || pctNum);
        const sevLabel = freqN >= 70 ? 'High' : freqN >= 40 ? 'Medium' : 'Low';
        const sevClass = freqN >= 70 ? 'sev-high' : freqN >= 40 ? 'sev-medium' : 'sev-low';
        return `<div class="theme-card${i === 0 ? ' theme-top' : ''}">
          <div class="theme-top-row">
            <div class="theme-label">${esc(t.name)}</div>
            <span class="sev-badge ${sevClass}" style="font-size:10px;padding:2px 8px">${sevLabel}</span>
          </div>
          <div class="theme-bar-wrap"><div class="theme-bar" style="--pct:${pctNum}%"></div></div>
          <div class="theme-big-pct">${esc(freqStr)}</div>
          <div class="theme-desc">${esc(t.what_users_are_experiencing)}<br><br><strong>Why it matters:</strong> ${esc(t.why_it_matters)}</div>
        </div>`;
    }).join('');

    // — Decision Rationale (new section 04)
    const ratCore = document.getElementById('rationale-core');
    const ratAlts = document.getElementById('rationale-alts');
    const ratWinner = document.getElementById('rationale-winner');
    const rat = r.decision_rationale || {};
    const cp = r.core_problem || '';
    if (ratCore) {
        ratCore.innerHTML = cp ? `
          <div class="rationale-problem">
            <div class="rationale-problem-label">🔍 Core Problem Statement</div>
            <div class="rationale-problem-text">${esc(cp)}</div>
          </div>` : '';
    }
    if (ratAlts) {
        const alts = rat.alternative_solutions_considered || [];
        if (alts.length) {
            ratAlts.innerHTML = `
              <div class="alts-header">Alternatives Considered — and Why They Were Rejected</div>
              <div class="alts-table">
                <div class="alts-row alts-head">
                  <div class="alts-col">Feature idea</div>
                  <div class="alts-col">Why a team would consider it</div>
                  <div class="alts-col alts-col-rejected">Why it was rejected</div>
                </div>
                ${alts.map(a => `
                  <div class="alts-row">
                    <div class="alts-col alts-feature">${esc(a.feature)}</div>
                    <div class="alts-col alts-considered">${esc(a.why_teams_build_it)}</div>
                    <div class="alts-col alts-rejected">${esc(a.why_rejected)}</div>
                  </div>`).join('')}
              </div>`;
        }
    }
    if (ratWinner) {
        ratWinner.innerHTML = rat.why_selected_feature_wins ? `
          <div class="winner-block">
            <div class="winner-label">✓ Why the selected feature wins</div>
            <div class="winner-text">${esc(rat.why_selected_feature_wins)}</div>
          </div>` : '';
    }

    // — Recommendation
    const recCont = document.getElementById('recommend-container');
    if (recCont) {
        let score = rec.confidence != null ? Number(rec.confidence) : 88;
        if (score > 0 && score <= 1) score = Math.round(score * 100);
        if (!score || score < 1) score = 88;
        const circumference = 2 * Math.PI * 24;
        const dash = (score / 100) * circumference;

        recCont.innerHTML = `<div class="recommend-card">
          <div class="rec-header">
            <div class="rec-left">
              <div class="rec-eyebrow">RECOMMENDED BUILD</div>
              <div class="rec-title">${esc(rec.name || '—')}</div>
            </div>
            <div class="confidence-meter">
              <div class="conf-ring">
                <svg viewBox="0 0 60 60" class="conf-svg">
                  <circle cx="30" cy="30" r="24" class="conf-track"/>
                  <circle cx="30" cy="30" r="24" class="conf-fill" style="stroke-dasharray:${dash} ${circumference}"/>
                </svg>
                <span class="conf-num">${score}%</span>
              </div>
              <div class="conf-label">Confidence</div>
            </div>
          </div>
          <div class="rec-why">${esc(rat.root_cause_analysis || '')}</div>
          <div class="rec-fields">
            <div class="rec-field"><div class="rf-label">Problem Addressed</div><div class="rf-val">${esc(rec.problem_addressed || '—')}</div></div>
            <div class="rec-field"><div class="rf-label">Expected Behavior Change</div><div class="rf-val">${esc(rec.expected_user_behavior_change || '—')}</div></div>
            <div class="rec-field"><div class="rf-label">Expected Business Impact</div><div class="rf-val">${esc(rec.expected_business_impact || '—')}</div></div>
          </div>
        </div>`;
    }

    // — Evidence quotes, grouped by theme
    const evList = document.getElementById('evidence-list');
    if (evList) {
        const quotes = r.supporting_quotes || [];
        if (quotes.length === 0) {
            evList.innerHTML = '<p class="empty-note">No quotes extracted — try a longer transcript.</p>';
        } else {
            // Group by theme
            const groups = {};
            const groupOrder = [];
            quotes.forEach(q => {
                const quoteText = typeof q === 'string' ? q : (q.quote || '');
                const speaker = typeof q === 'object' ? (q.speaker || '') : '';
                const ts = typeof q === 'object' ? (q.timestamp || '') : '';
                const theme = typeof q === 'object' && q.theme ? q.theme : 'General';
                if (!groups[theme]) { groups[theme] = []; groupOrder.push(theme); }
                groups[theme].push({ quoteText, speaker, ts });
            });
            const themeColors = ['tag-retention', 'tag-motivation', 'tag-onboard', 'tag-trust', 'tag-integration', 'tag-general'];
            evList.innerHTML = groupOrder.map((theme, gi) => {
                const colorClass = themeColors[gi % themeColors.length];
                const items = groups[theme].map(({ quoteText, speaker, ts }) => `
                  <div class="evidence-item">
                    <div class="ev-quote">${esc(quoteText)}</div>
                    <div class="ev-meta">
                      ${speaker ? `<span class="ev-source">User Interview · ${esc(speaker)}${ts ? ' · ' + esc(ts) : ''}</span>` : ''}
                    </div>
                  </div>`).join('');
                return `<div class="ev-group">
                  <div class="ev-group-label"><span class="ev-group-dot ${colorClass}"></span>${esc(theme)}</div>
                  ${items}
                </div>`;
            }).join('');
        }
    }

    // — PRD
    const prd = r.product_spec || {};
    const prdBlock = document.getElementById('prd-block');
    if (prdBlock) {
        const criteria = (prd.acceptance_criteria || []).map(c => `<li>${esc(c)}</li>`).join('');
        // Metrics: handle both "Metric: target" strings AND plain strings / objects
        const metrics = (prd.success_metrics || []).map(m => {
            let metricName = '', metricTarget = '';
            if (typeof m === 'object' && m !== null) {
                metricName = m.metric || m.name || m.label || JSON.stringify(m);
                metricTarget = m.target || m.value || m.details || '—';
            } else {
                const str = String(m);
                const colonIdx = str.indexOf(':');
                if (colonIdx > 0) {
                    metricName = str.slice(0, colonIdx).trim();
                    metricTarget = str.slice(colonIdx + 1).trim() || '—';
                } else {
                    // Plain string with no colon — show as metric, dash as target
                    const arrowIdx = str.indexOf('→');
                    if (arrowIdx > 0) {
                        metricName = str.slice(0, arrowIdx).trim();
                        metricTarget = str.slice(arrowIdx + 1).trim();
                    } else {
                        metricName = str;
                        metricTarget = '—';
                    }
                }
            }
            return `<div class="metrics-row"><span>${esc(metricName)}</span><span>${esc(metricTarget)}</span></div>`;
        }).join('');
        prdBlock.innerHTML = `
          <div class="prd-section-head">Overview</div>
          <p class="prd-text">${esc(prd.overview || '—')}</p>
          <div class="prd-section-head">User Story</div>
          <p class="prd-text italic-text">${esc(prd.user_story || '—')}</p>
          <div class="prd-section-head">Acceptance Criteria</div>
          <ul class="prd-list">${criteria || '<li>—</li>'}</ul>
          <div class="prd-section-head">Success Metrics</div>
          <div class="metrics-table">
            <div class="metrics-row metrics-header"><span>Metric</span><span>Target / Details</span></div>
            ${metrics || '<div class="metrics-row"><span>—</span><span>—</span></div>'}
          </div>
          ${(prd.post_launch_validation_metrics && prd.post_launch_validation_metrics.length) ? `
          <div class="prd-section-head" style="margin-top:20px">Post-Launch Validation Metrics</div>
          <div class="post-launch-metrics">
            ${prd.post_launch_validation_metrics.map(m => `<div class="plm-item"><span class="plm-bullet">→</span><span class="plm-text">${esc(m)}</span></div>`).join('')}
          </div>` : ''}`;
    }

    // — Engineering plan
    const eng = r.engineering_plan || {};
    const engCols = document.getElementById('eng-columns');
    if (engCols) {
        const renderTasks = (tasks, prefix) => (tasks || []).map((t, i) => {
            const str = typeof t === 'string' ? t : (t.title ? `${t.title} ${t.description || ''} ${t.estimate || ''}` : '');
            return `
          <div class="eng-task">
            <span class="task-id">${prefix}-${String(i + 1).padStart(2, '0')}</span>
            <div class="task-body">
              <div class="task-name" style="font-weight: normal; font-size: 13px;">${esc(str)}</div>
            </div>
          </div>`;
        }).join('');
        engCols.innerHTML = `
          <div class="eng-col">
            <div class="eng-col-header"><span class="eng-col-icon">🗄️</span> Backend</div>
            <div class="eng-tasks">${renderTasks(eng.backend_tasks, 'BE')}</div>
          </div>
          <div class="eng-col">
            <div class="eng-col-header"><span class="eng-col-icon">🖥️</span> Frontend</div>
            <div class="eng-tasks">${renderTasks(eng.frontend_tasks, 'FE')}</div>
          </div>
          <div class="eng-col">
            <div class="eng-col-header"><span class="eng-col-icon">💾</span> Database</div>
            <div class="eng-tasks">${renderTasks(eng.database_changes, 'DB')}</div>
          </div>`;
    }

    // — User Personas
    const personasGrid = document.getElementById('personas-grid');
    if (personasGrid) {
        const personas = r.user_personas || [];
        if (personas.length === 0) {
            personasGrid.innerHTML = '<p class="empty-note">No personas generated — run analysis with a longer transcript.</p>';
        } else {
            personasGrid.innerHTML = personas.map((p, i) => {
                const icons = ['👤', '🧑‍💼', '🧑‍💻', '👩‍🔬'];
                return `<div class="persona-card${i === 0 ? ' persona-top' : ''}">
                  <div class="persona-header">
                    <span class="persona-icon">${icons[i % icons.length]}</span>
                    <div class="persona-name">${esc(p.persona_name || p.name)}</div>
                  </div>
                  <div class="persona-desc">${esc(p.behavior_pattern || p.description)}</div>
                  <div class="persona-pain">
                    <span class="persona-pain-label">Primary Need</span>
                    <span class="persona-pain-text">${esc(p.primary_need || p.pain_summary)}</span>
                  </div>
                </div>`;
            }).join('');
        }
    }

    // — Risks & Mitigations
    const risksList = document.getElementById('risks-list');
    if (risksList) {
        const risks = r.risks_and_mitigations || [];
        if (risks.length === 0) {
            risksList.innerHTML = '<p class="empty-note">No risks generated — regenerate with Groq or a larger model.</p>';
        } else {
            risksList.innerHTML = risks.map(risk => {
                return `<div class="risk-row">
                  <div class="risk-left">
                    <span class="sev-badge sev-medium">RISK</span>
                  </div>
                  <div class="risk-body">
                    <div class="risk-text">${esc(risk.risk)}</div>
                    <div class="risk-mitigation">
                      <span class="risk-mit-label">↳ Mitigation</span>
                      <span class="risk-mit-text">${esc(risk.mitigation)}</span>
                    </div>
                  </div>
                </div>`;
            }).join('');
        }
    }

    // — Risk of not building
    const rnbBlock = document.getElementById('risk-of-not-building-block');
    if (rnbBlock) {
        const rnb = r.do_nothing_consequence || r.risk_of_not_building || '';
        rnbBlock.innerHTML = rnb ? `
          <div class="rnb-card">
            <div class="rnb-header">
              <span class="rnb-icon">⚠</span>
              <span class="rnb-title">If we do nothing</span>
            </div>
            <div class="rnb-text">${esc(rnb)}</div>
          </div>` : '';
    }

    // — Agent prompt: show fully; auto-build structured guide if model returned something short
    const promptEl = document.getElementById('agent-prompt-text');
    if (promptEl) {
        let promptText = r.coding_agent_prompt || '';
        // If the model gave a short prompt (<300 chars), build a proper structured one
        // Use the structured fallback if prompt is short OR lacks ## section headers
        // (AI often returns a flat paragraph — this ensures the Step 1/2/3/4 format always shows)
        if ((!promptText.includes('##') || promptText.length < 300) && rec.name) {
            const spec = r.product_spec || {};
            const eng = r.engineering_plan || {};
            const criteria = (spec.acceptance_criteria || []).map(c => `- ${c}`).join('\n');
            const beTasks = (eng.backend_tasks || []).map(t => `**${t.id || 'BE'}** ${t.title}\n   ${t.description || ''} (${t.estimate || ''})`).join('\n');
            const feTasks = (eng.frontend_tasks || []).map(t => `**${t.id || 'FE'}** ${t.title}\n   ${t.description || ''} (${t.estimate || ''})`).join('\n');
            const dbTasks = (eng.database_changes || []).map(t => `**${t.id || 'DB'}** ${t.title}\n   ${t.description || ''} (${t.estimate || ''})`).join('\n');
            promptText =
                `You are implementing the "${rec.name}" feature.

## Context
${rec.why_this_is_the_root_problem || rec.problem_it_solves || ''}

## Problem Solved
${rec.problem_it_solves || ''}

## Affected Users
${rec.affected_users || ''}

## Expected Impact
${rec.expected_user_impact || ''}

## Stack (assumed)
- Frontend: Next.js / React, TypeScript
- Backend: Node.js API routes
- Database: PostgreSQL via Prisma ORM
- Auth: existing session handling

## Product Overview
${spec.overview || ''}

## User Story
${spec.user_story || ''}

## Acceptance Criteria
${criteria || '(see product spec)'}

## Implementation Order

### Step 1 — Database
Start with any schema changes or new tables. Run migrations before building the API.
${dbTasks || ''}

### Step 2 — Backend API
Build the required API endpoints. Validate all inputs, handle errors, return correct status codes.
${beTasks || ''}

### Step 3 — Frontend UI
Implement the UI components and wire them to the API. Handle loading, error, and empty states.
${feTasks || ''}

### Step 4 — Testing
Test the happy path, edge cases, and failure scenarios before marking the feature complete.

## Effort Estimate
${rec.effort_estimate || ''}

Write clean, well-commented code. Start with the database migration.`;
        }
        promptEl.textContent = promptText || '(No prompt generated)';
    }
}

// ── REPORT UI INIT ────────────────────────────────────────────
function initReport() {
    // Animate theme bars
    setTimeout(() => {
        document.querySelectorAll('.theme-bar').forEach(bar => {
            const pct = bar.style.getPropertyValue('--pct') || '70%';
            bar.style.setProperty('--pct', '0%');
            requestAnimationFrame(() => {
                setTimeout(() => {
                    bar.style.transition = 'width 0.8s cubic-bezier(0.22,1,0.36,1)';
                    bar.style.setProperty('--pct', pct);
                }, 50);
            });
        });
    }, 300);
    initTocTracking();
}

let tocObserver = null;
let tocInitialized = false;

function initTocTracking() {
    const tocLinks = document.querySelectorAll('.toc-item');
    const sections = document.querySelectorAll('.report-section');
    const body = document.getElementById('report-body');
    if (!body) return;

    if (!tocInitialized) {
        tocLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const t = document.getElementById(link.dataset.section);
                if (t) {
                    body.scrollTo({ top: t.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
        tocInitialized = true;
    }

    if (tocObserver) tocObserver.disconnect();

    tocObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tocLinks.forEach(l => l.classList.remove('active'));
                const a = document.querySelector(`.toc-item[data-section="${entry.target.id}"]`);
                if (a) a.classList.add('active');
            }
        });
    }, { root: body, threshold: 0, rootMargin: '-100px 0px -60% 0px' });

    sections.forEach(s => tocObserver.observe(s));
}

// ── SHARE MODAL ───────────────────────────────────────────────
const shareBtn = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const shareClose = document.getElementById('share-close');
const copyLinkBtn = document.getElementById('copy-link-btn');

shareBtn.addEventListener('click', () => shareModal.classList.remove('hidden'));
shareClose.addEventListener('click', () => shareModal.classList.add('hidden'));
shareModal.addEventListener('click', e => { if (e.target === shareModal) shareModal.classList.add('hidden'); });
copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('share-url-input').value).then(() => {
        copyLinkBtn.textContent = 'Copied!';
        setTimeout(() => copyLinkBtn.textContent = 'Copy link', 2000);
    });
});

document.getElementById('pdf-btn').addEventListener('click', () => {
    showToast('📄 PDF export — demo mode (no file generated)');
});

// ── COPY AGENT PROMPT ─────────────────────────────────────────
document.getElementById('copy-prompt-btn').addEventListener('click', function () {
    const text = document.getElementById('agent-prompt-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        this.textContent = '✓ Copied!';
        setTimeout(() => { this.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 4V2.5A1.5 1.5 0 0 1 5.5 1H10a1.5 1.5 0 0 1 1.5 1.5V8A1.5 1.5 0 0 1 10 9.5H8.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg> Copy prompt'; }, 2500);
    });
});

// ── RESET ─────────────────────────────────────────────────────
function resetToUpload() {
    state.files = [];
    state.report = null;
    state.usedAI = false;
    renderFileList();
    transcriptInput.value = '';
    charCount.textContent = '0 characters';
    document.querySelectorAll('.stage').forEach(s => {
        s.classList.remove('active', 'done');
        s.querySelector('.stage-status').innerHTML = '';
    });
    const fill = document.getElementById('overall-progress-fill');
    const label = document.getElementById('progress-label');
    if (fill) fill.style.width = '0';
    if (label) label.textContent = 'Starting analysis…';
    ['pain-list', 'themes-grid', 'recommend-container', 'evidence-list', 'prd-block', 'eng-columns']
        .forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = ''; });
    updateStartButton();
    showPage('upload');
}

document.getElementById('rerun-btn').addEventListener('click', resetToUpload);
const reportBottomAccess = document.getElementById('report-bottom-access');
if (reportBottomAccess) reportBottomAccess.addEventListener('click', () => { window.location.href = 'index.html#cta'; });

// ── DEMO SHORTCUT (View Example Report button) ────────────────
(function addDemoBtn() {
    const actions = document.querySelector('.upload-actions');
    if (!actions || document.getElementById('demo-report-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.id = 'demo-report-btn';
    btn.style.marginLeft = 'auto';
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> View Example Report';
    btn.addEventListener('click', () => {
        state.report = DEMO_REPORT;
        state.usedAI = false;
        renderReport(DEMO_REPORT);
        showPage('report');
        initReport();
    });
    actions.appendChild(btn);
})();

// ── KEYBOARD ──────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') shareModal.classList.add('hidden');
});

// ── INIT ──────────────────────────────────────────────────────
showPage('upload');
updateStartButton();
console.log('%c◈ IntentLayer', 'color:#4f86f7;font-weight:bold;font-size:16px');
console.log('%cAI Product Decision Engine — ready', 'color:#8b95aa;font-size:12px');
