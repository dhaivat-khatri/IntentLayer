/* ============================================================
   IntentLayer — main.js
   Interactivity: nav scroll, tabs, copy, reveal animations,
   mobile menu, email subscribe
   ============================================================ */

'use strict';

// ── NAV SCROLL ──────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// ── MOBILE MENU ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ── SMOOTH SCROLL NAV ───────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const id = anchor.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ── SCROLL REVEAL ───────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

// Apply reveal to key content blocks
const revealTargets = [
  '.hero-badge', '.section-tag', '.section-headline', '.section-sub',
  '.p-card', '.benefit-card', '.user-card', '.vision-card',
  '.pipeline-step', '.demo-output-panel', '.demo-tabs-panel',
  '.fits-layer', '.cta-box', '.problem-workflow',
  '.wf-step', '.fits-statement', '.fits-sub'
];

document.querySelectorAll(revealTargets.join(', ')).forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger sibling elements in grids for a cascade effect
  const delay = Math.min(i * 0 + 0, 0); // Individual stagger done via nth-child below
  revealObserver.observe(el);
});

// Stagger grid children
['p-card', 'benefit-card', 'user-card', 'vision-card', 'pipeline-step'].forEach(cls => {
  document.querySelectorAll(`.${cls}`).forEach((el, i) => {
    el.style.transitionDelay = `${i * 80}ms`;
  });
});

// ── DEMO TABS ───────────────────────────────────────────────
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const content = document.getElementById(`tab-content-${tab}`);
    if (content) content.classList.add('active');
  });
});

// ── COPY BUTTONS ────────────────────────────────────────────
const copyTexts = {
  prd: `## Feature: Smart Accountability Reminders

### Problem Statement
Users churn after first session due to absence of re-engagement. 62% do not return organically.

### User Story
As a user, I want to receive a timely nudge to return to my session — on my terms.

### Acceptance Criteria
- User can set reminder cadence (daily/weekly)
- System sends push + email notifications
- Reminder links directly to last session state
- User can pause or disable at any time

### Success Metrics
- D7 retention: target +25%
- Reminder opt-in rate: > 40%`,

  tasks: `## Engineering Tasks

[ ] BE-01  Create reminder_preferences table
    Fields: user_id, cadence, last_sent, enabled

[ ] BE-02  Cron job: check & dispatch reminders
    Queue reminders at user-preferred local time

[ ] BE-03  Email + push notification templates
    Deep link to last active session state

[ ] FE-01  Settings page: reminder preference UI
    Toggle + cadence selector + preview

[ ] FE-02  Onboarding step: prompt reminder setup
    Show after first session completion`,

  prompt: `## Coding Agent Prompt

You are implementing the "Smart Accountability Reminders" feature for a SaaS app.

Context:
- Stack: Next.js, Prisma, PostgreSQL, Resend
- Users churn due to no re-engagement loop
- Feature is highest-priority by IntentLayer

Tasks to implement:
1. DB migration: reminder_preferences table
2. Cron job (Vercel Cron / BullMQ)
3. Email template with session deep link
4. Settings UI component (React)
5. Onboarding modal trigger

Start with: prisma/schema.prisma
Add reminder_preferences model, then run prisma migrate dev`
};

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.copy;
    const text = copyTexts[key] || '';
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  });
});

// ── IMPACT BARS ANIMATION ───────────────────────────────────
// Bars animate to their width when the section scrolls into view
const impactBars = document.querySelectorAll('.impact-bar');
const savedWidths = [];

impactBars.forEach((bar, i) => {
  savedWidths[i] = bar.style.width;
  bar.style.width = '0';
});

const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      impactBars.forEach((bar, i) => {
        setTimeout(() => {
          bar.style.transition = 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
          bar.style.width = savedWidths[i];
        }, i * 150 + 200);
      });
      barObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const impactSection = document.querySelector('.impact-bars');
if (impactSection) barObserver.observe(impactSection);

// ── FOOTER EMAIL SUBSCRIBE ──────────────────────────────────
const emailInput = document.getElementById('footer-email');
const subscribeBtn = document.getElementById('footer-subscribe');
const subscribeMsg = document.getElementById('footer-subscribe-msg');

function handleSubscribe() {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    emailInput.style.borderColor = '#f87171';
    emailInput.focus();
    setTimeout(() => { emailInput.style.borderColor = ''; }, 2000);
    return;
  }

  // Simulate form submission
  subscribeBtn.textContent = '…';
  subscribeBtn.disabled = true;
  setTimeout(() => {
    emailInput.value = '';
    subscribeBtn.textContent = 'Subscribe';
    subscribeBtn.disabled = false;
    subscribeMsg.classList.remove('hidden');
    setTimeout(() => subscribeMsg.classList.add('hidden'), 4000);
  }, 800);
}

subscribeBtn.addEventListener('click', handleSubscribe);
emailInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSubscribe();
});

// ── MOCKUP INTERACTIVE HOVER ────────────────────────────────
const interviewItems = document.querySelectorAll('.interview-item');
interviewItems.forEach(item => {
  if (!item.classList.contains('processing')) {
    item.addEventListener('click', () => {
      interviewItems.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
    });
  }
});

// ── NAV ACTIVE SECTION HIGHLIGHT ────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinksAll.forEach(link => {
        link.style.color = link.getAttribute('href') === `#${id}`
          ? 'var(--text-primary)'
          : '';
      });
    }
  });
}, { threshold: 0.4, rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'))}px 0px 0px 0px` });

sections.forEach(s => sectionObserver.observe(s));

// ── HERO HOW BUTTON ─────────────────────────────────────────
document.getElementById('hero-how-btn').addEventListener('click', (e) => {
  e.preventDefault();
  const sol = document.getElementById('solution');
  const top = sol.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top, behavior: 'smooth' });
});

// ── PLACEHOLDER FOOTER LINKS ─────────────────────────────────
['footer-about', 'footer-contact', 'footer-privacy'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      // Future pages — no-op for now
    });
  }
});

console.log('%c◈ IntentLayer', 'color: #5b8ef0; font-size: 18px; font-weight: bold;');
console.log('%cThe intelligence layer between customers and code.', 'color: #8a93a8; font-size: 13px;');
