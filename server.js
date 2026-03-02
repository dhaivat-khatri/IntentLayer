/* ============================================================
   IntentLayer — server.js
   Run: node server.js  (or: npm start)
   Then open: http://localhost:3000/app.html
   ============================================================ */

'use strict';
require('dotenv').config(); // load .env file (GROQ_API_KEY, OPENAI_API_KEY, etc.)

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── SYSTEM PROMPT ─────────────────────────────────────────────
const SYSTEM_PROMPT = `SYSTEM MESSAGE:

You are IntentLayer, an AI product decision engine used by startup founders.

You are NOT a summarizer.
You are NOT a brainstorming assistant.

You are acting as a senior product manager whose responsibility is to decide what feature a company should build next based strictly on user interview evidence.

Your goal:
Convert messy customer conversations into a clear product decision and implementation plan.

CRITICAL RULES:
• Use only information grounded in the transcript
• Identify behavioral problems, not just feature requests
• Focus on retention, activation, and user value
• Recommend ONE primary feature only
• Do not list multiple possible solutions
• Do not write explanations outside the JSON
• Your response MUST be valid JSON

HOW TO THINK (follow this reasoning internally):
1. Detect repeated frustrations across different users
2. Identify where users drop off in their journey
3. Infer the root cause behind complaints
4. Consider realistic features a team might build
5. Reject lower-impact solutions
6. Select the single highest-impact feature
7. Justify the decision with user evidence
8. Produce a buildable implementation plan

FEATURE NAMING — the recommended feature name must sound like a shipped product capability:
  GOOD: "Automated Follow-Through Engine", "Post-Session Recovery Flow", "Adaptive Re-engagement Coach", "Workflow Completion Signal"
  BAD: "Better reminders", "Improved onboarding", "More notifications", "Easier setup"

FIELD REQUIREMENTS:
- core_problem: 1–2 sentence diagnosis of the single root-cause problem
- pain_points: 3–5 items, each with a verbatim quote from the transcript
- themes: 3–5 clusters — what users are experiencing + why it matters to the product
- decision_rationale.root_cause_analysis: 2–3 sentences on the underlying behavioral cause
- decision_rationale.alternative_solutions_considered: 3+ items — realistic features a team might actually build
- decision_rationale.alternative_solutions_considered[].why_teams_build_it: plausible PM reasoning for considering it
- decision_rationale.alternative_solutions_considered[].why_rejected: specific, evidence-based rejection
- decision_rationale.why_selected_feature_wins: 3–4 sentences on why chosen feature addresses root cause
- recommended_feature.name: ship-ready capability name (see naming rules above)
- recommended_feature.confidence: INTEGER 1–100. Never a decimal.
- recommended_feature.expected_user_behavior_change: specific before/after behavioral description
- recommended_feature.expected_business_impact: quantified metric impact (D7 retention, churn, LTV)
- supporting_quotes: 5–8 direct or closely paraphrased quotes from the transcript
- user_personas: 2–3 behavioral archetypes
- product_spec.acceptance_criteria: 6–8 specific, testable criteria
- product_spec.success_metrics: "Metric: baseline → target (timeframe)"
- product_spec.post_launch_validation_metrics: 4–6 measurements to run after shipping
- engineering_plan tasks: plain strings, include task name + ~Xh estimate, 3–5 per category
- risks_and_mitigations: 3–5 risks with concrete mitigation for each
- do_nothing_consequence: what happens if this feature is never built (specific, not vague)
- coding_agent_prompt: 500+ words — problem context, expected behavior change, file paths, step-by-step order, v1 constraints, code example

OUTPUT FORMAT — return ONLY raw JSON. Start with { and end with }. NO markdown. NO text outside the JSON:

{
  "core_problem": "",
  "pain_points": [
    { "title": "", "severity": "HIGH | MEDIUM | LOW", "description": "", "quote": "" }
  ],
  "themes": [
    { "name": "", "what_users_are_experiencing": "", "why_it_matters": "" }
  ],
  "decision_rationale": {
    "root_cause_analysis": "",
    "alternative_solutions_considered": [
      { "feature": "", "why_teams_build_it": "", "why_rejected": "" }
    ],
    "why_selected_feature_wins": ""
  },
  "recommended_feature": {
    "name": "", "confidence": 0, "problem_addressed": "",
    "expected_user_behavior_change": "", "expected_business_impact": ""
  },
  "supporting_quotes": [""],
  "user_personas": [
    { "persona_name": "", "behavior_pattern": "", "primary_need": "" }
  ],
  "product_spec": {
    "overview": "", "user_story": "",
    "acceptance_criteria": [""],
    "success_metrics": [""],
    "post_launch_validation_metrics": [""]
  },
  "engineering_plan": {
    "frontend_tasks": [""],
    "backend_tasks": [""],
    "database_changes": [""]
  },
  "risks_and_mitigations": [
    { "risk": "", "mitigation": "" }
  ],
  "do_nothing_consequence": "",
  "coding_agent_prompt": ""
}

WRITING STYLE REQUIREMENTS:
• Be decisive, not vague
• Avoid generic startup buzzwords
• Sound like an internal company strategy document
• Feature names must sound like real shipped capabilities
• Base confidence score on strength and repetition of evidence
• Quotes must be taken or closely paraphrased from the transcript

You are making a real product decision.`;





// ── JSON REPAIR ───────────────────────────────────────────────
function repairJson(str) {
    const stack = [];
    let inStr = false, escape = false, lastGoodIdx = 0;
    for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inStr) { escape = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{' || ch === '[') { stack.push(ch); }
        else if (ch === '}' || ch === ']') {
            if (stack.length === 0) break;
            stack.pop();
            if (stack.length === 0) lastGoodIdx = i;
        }
    }
    if (stack.length === 0) return str.slice(0, lastGoodIdx + 1);
    let repaired = str.trimEnd().replace(/,\s*$/, '');
    for (let i = stack.length - 1; i >= 0; i--) {
        repaired += stack[i] === '{' ? '}' : ']';
    }
    return repaired;
}

function parseAIResponse(rawText) {
    let cleaned = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();

    const braceStart = cleaned.indexOf('{');
    if (braceStart === -1)
        throw new Error('AI returned non-JSON text. Try mistral or llama3.1:8b for better JSON output.');
    cleaned = cleaned.slice(braceStart);

    try { return JSON.parse(cleaned); } catch (_) { }

    const repaired = repairJson(cleaned);
    try { return JSON.parse(repaired); } catch (e) {
        throw new Error('Failed to parse AI JSON. The model likely ran out of tokens. Try a shorter transcript or switch to mistral.');
    }
}

// ── LLM CALL ─────────────────────────────────────────────────
async function callLLM(provider, transcript, apiKey, modelName) {
    const userMessage = `TRANSCRIPT:\n\n${transcript.trim()}`;
    let rawText = '';

    // ── OLLAMA (native /api/chat — properly enforces num_predict) ──
    if (provider === 'ollama') {
        const model = (modelName || '').trim() || 'llama3.2';

        // IMPORTANT: Use /api/chat (native endpoint), NOT /v1/chat/completions.
        // The OpenAI-compat endpoint silently ignores the `options` field,
        // meaning num_predict was never applied and output was truncated.
        const res = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                stream: false,
                options: {
                    temperature: 0.2,
                    num_ctx: 16384,  // full context window (input + output)
                    num_predict: 4096,   // max output tokens — actually enforced here
                },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ]
            })
        }).catch(() => {
            throw new Error('Cannot connect to Ollama. Make sure it is running:\n  ollama serve');
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error || `Ollama error ${res.status}`);
        }

        const data = await res.json();
        rawText = data.message?.content || '';

        // Log token stats to help diagnose truncation
        const generated = data.eval_count || 0;
        const prompt = data.prompt_eval_count || 0;
        console.log(`    → tokens: prompt=${prompt}, generated=${generated}, done_reason=${data.done_reason}`);
        if (data.done_reason === 'length') {
            console.warn(`    ⚠️  Model hit num_predict limit! Increase num_predict or shorten the transcript.`);
        }

        // ── OPENAI ────────────────────────────────────────────────
    } else if (provider === 'openai') {
        const model = (modelName || '').trim() || 'gpt-4o';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model, temperature: 0.2, max_tokens: 4096,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ]
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `OpenAI error ${res.status}`);
        }
        const data = await res.json();
        rawText = data.choices?.[0]?.message?.content || '';

        // ── ANTHROPIC ─────────────────────────────────────────────
    } else if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 4096,
                system: SYSTEM_PROMPT,
                messages: [{ role: 'user', content: userMessage }]
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Anthropic error ${res.status}`);
        }
        const data = await res.json();
        rawText = data.content?.[0]?.text || '';

        // ── HUGGINGFACE ───────────────────────────────────────────
    } else if (provider === 'huggingface') {
        const model = (modelName || '').trim() || 'mistralai/Mixtral-8x7B-Instruct-v0.1';
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model, temperature: 0.2, max_tokens: 4096,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ]
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HuggingFace error ${res.status}`);
        }
        const data = await res.json();
        rawText = data.choices?.[0]?.message?.content || '';

        // ── GROQ ──────────────────────────────────────────────────
    } else if (provider === 'groq') {
        // Groq uses an OpenAI-compatible API — just a different base URL
        const model = (modelName || '').trim() || 'llama-3.3-70b-versatile';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                temperature: 0.2,
                max_tokens: 4096,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userMessage }
                ]
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Groq error ${res.status}. Check your API key at console.groq.com`);
        }
        const data = await res.json();
        rawText = data.choices?.[0]?.message?.content || '';

    } else {
        throw new Error(`Unknown provider: ${provider}`);
    }

    return parseAIResponse(rawText);
}

// ── MIDDLEWARE ────────────────────────────────────────────────
// Allow requests from file:// and any localhost origin (needed when app.html
// is opened directly from the filesystem rather than through the server)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname)));

// ── API ROUTE ─────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
    const { transcript, provider = 'ollama', model = '' } = req.body;
    let { apiKey = '' } = req.body;

    if (!transcript || transcript.trim().length < 100) {
        return res.status(400).json({ error: 'Transcript is too short (minimum ~100 characters).' });
    }
    if (provider !== 'ollama' && (!apiKey || apiKey.trim().length < 10)) {
        return res.status(400).json({ error: 'Please provide a valid API key.' });
    }

    console.log(`[${new Date().toISOString()}] Analyze — provider: ${provider}, model: ${model || 'default'}, key: ${apiKey ? '✓ set' : '✗ missing'}`);

    const MAX_ATTEMPTS = 3;
    let lastErr;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`[${new Date().toISOString()}] ↻ Retry attempt ${attempt}/${MAX_ATTEMPTS}…`);
            }
            const report = await callLLM(provider, transcript, apiKey.trim(), model.trim());
            console.log(`[${new Date().toISOString()}] ✓ Report generated (attempt ${attempt})`);
            return res.json({ report });
        } catch (err) {
            lastErr = err;
            const isParseErr = err.message.includes('parse') || err.message.includes('JSON') || err.message.includes('token');
            console.error(`[${new Date().toISOString()}] ✗ Attempt ${attempt} failed:`, err.message);
            // Only retry on parse/JSON errors — not on auth/connection errors
            if (!isParseErr || attempt === MAX_ATTEMPTS) break;
        }
    }
    res.status(500).json({ error: lastErr.message });
});

// ── START ─────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════════════╗');
    console.log(`  ║  IntentLayer backend  →  http://localhost:${PORT}       ║`);
    console.log('  ║  Open: http://localhost:3000/app.html            ║');
    console.log('  ║  Press Ctrl+C to stop                            ║');
    console.log('  ╚══════════════════════════════════════════════════╝');
    console.log('');
});
