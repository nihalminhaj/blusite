/* =========================================================
   BLUdot — Shared site behaviour
   ========================================================= */

/* ---- Fact bank (used for "New Random Fact" + sharing) ---- */
const FACT_BANK = [
  { cat: "Science", text: "Known as the Mpemba effect, hot water can sometimes freeze faster than cold water under the same conditions. Scientists still debate exactly why this happens — it may involve evaporation, dissolved gases, or hydrogen bond behavior." },
  { cat: "Space", text: "In space there's no medium for sound waves to travel through. Every explosion, engine, and shockwave you see in sci-fi movies would be completely, perfectly silent in reality." },
  { cat: "Human Body", text: "Your brain uses around 20% of your body's total energy despite making up only about 2% of your body weight — it's the most expensive organ you own." },
  { cat: "Tech", text: "The first computer 'bug' was an actual moth, found trapped in a relay of the Harvard Mark II computer in 1947, which gave the term its enduring name." },
  { cat: "History", text: "The Great Wall of China was built over many centuries by different dynasties, and contrary to popular belief, it is not actually visible from space with the naked eye." },
  { cat: "Nature", text: "Octopuses have three hearts and blue blood — two hearts pump blood to the gills, while the third pumps it to the rest of the body." },
  { cat: "Animal", text: "A group of flamingos is called a \"flamboyance.\" These birds can only eat with their heads upside down, and their pink color comes entirely from the carotenoid pigments in the algae and shrimp they consume." }
];

document.addEventListener('DOMContentLoaded', () => {

  initNavScroll();
  initMobileNav();
  initReveal();
  initCounters();
  initParticles();
  initFlipCards();
  initFactFilters();
  initPortFilters();

});

/* =========================================================
   Nav: shrink / solidify on scroll
   ========================================================= */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* =========================================================
   Mobile hamburger nav
   ========================================================= */
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
}

/* =========================================================
   Scroll reveal (+ triggers skill bar fill when relevant)
   ========================================================= */
function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const animateSkillFill = (el) => {
    const fill = el.querySelector('.skill-fill');
    if (fill && fill.dataset.width) {
      requestAnimationFrame(() => { fill.style.width = fill.dataset.width + '%'; });
    }
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animateSkillFill(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => { el.classList.add('visible'); animateSkillFill(el); });
  }
}

/* =========================================================
   Hero counter animation (#c1, #c2, #c3)
   ========================================================= */
function initCounters() {
  const targets = [
    { el: document.getElementById('c1'), end: 120 },
    { el: document.getElementById('c2'), end: 50 },
    { el: document.getElementById('c3'), end: 30 }
  ].filter(t => t.el);

  if (!targets.length) return;

  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    targets.forEach(t => { t.el.textContent = Math.round(t.end * eased); });
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* =========================================================
   Hero particle / constellation canvas (#particles)
   ========================================================= */
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dots;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    w = canvas.width = rect.width;
    h = canvas.height = rect.height;
    const count = Math.max(24, Math.floor((w * h) / 26000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.6 + 0.6
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const linkDist = Math.min(150, w / 6);

    dots.forEach(d => {
      if (!reduceMotion) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
      }
    });

    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          ctx.strokeStyle = `rgba(34,211,238,${0.15 * (1 - dist / linkDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    dots.forEach(d => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(79,142,247,0.85)';
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(step);
  }

  resize();
  step();
  window.addEventListener('resize', () => { resize(); if (reduceMotion) step(); });
}

/* =========================================================
   Flip cards — tap-to-flip on touch devices
   ========================================================= */
function initFlipCards() {
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      if (window.matchMedia('(hover: none)').matches) {
        card.classList.toggle('flipped');
      }
    });
  });
}

/* =========================================================
   Facts page — category filter
   ========================================================= */
function initFactFilters() {
  const bar = document.getElementById('factFilters');
  if (!bar) return;
  const cards = document.querySelectorAll('.fact-card');

  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });
}

/* =========================================================
   Portfolio page — category filter
   ========================================================= */
function initPortFilters() {
  const bar = document.getElementById('portFilters');
  if (!bar) return;
  const cards = document.querySelectorAll('.port-card');

  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.cat === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });
}

/* =========================================================
   Tip accordion (Facts & Tips page)
   ========================================================= */
function toggleTip(headerEl) {
  const item = headerEl.parentElement;
  const wasOpen = item.classList.contains('open');
  item.parentElement.querySelectorAll('.tip-item.open').forEach(t => t.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* =========================================================
   FAQ accordion (Contact page)
   ========================================================= */
function toggleFaq(headerEl) {
  const item = headerEl.parentElement;
  const wasOpen = item.classList.contains('open');
  item.parentElement.querySelectorAll('.faq-item.open').forEach(f => f.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

/* =========================================================
   Fact of the Day — random fact + share
   ========================================================= */
function newFotd() {
  const el = document.getElementById('fotdText');
  if (!el) return;
  const pick = FACT_BANK[Math.floor(Math.random() * FACT_BANK.length)];
  el.style.opacity = 0;
  setTimeout(() => {
    el.textContent = pick.text;
    el.style.opacity = 1;
  }, 200);
}

function shareFact() {
  const el = document.getElementById('fotdText');
  if (!el) return;
  copyToClipboard(el.textContent.trim(), event.target.closest('button'));
}

function copyFact(btn) {
  const card = btn.closest('.fact-card');
  if (!card) return;
  const title = card.querySelector('h3')?.textContent.trim() || '';
  const body = card.querySelector('p:not(.fact-num)')?.textContent.trim() || '';
  copyToClipboard(`${title} — ${body}`, btn);
}

function copyToClipboard(text, btn) {
  const finish = () => {
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = original; }, 1800);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(finish).catch(finish);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    finish();
  }
}

/* =========================================================
   Contact form — lightweight validation + toast
   ========================================================= */
function sendForm() {
  const name = document.getElementById('fname');
  const email = document.getElementById('femail');
  const subject = document.getElementById('fsubject');
  const message = document.getElementById('fmessage');
  const btn = event.target.closest('button');

  const fields = [name, email, subject, message];
  let valid = true;

  fields.forEach(f => {
    if (!f) return;
    const empty = !f.value || !f.value.trim();
    f.style.borderColor = empty ? '#F87171' : '';
    if (empty) valid = false;
  });

  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.style.borderColor = '#F87171';
    valid = false;
  }

  if (!valid) {
    showToast('Please fill in all fields with a valid email.', true);
    return;
  }

  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
    showToast("Thanks! Your message is in — I'll reply personally soon.", false);
    fields.forEach(f => { if (f) f.value = ''; });
    setTimeout(() => { btn.disabled = false; btn.innerHTML = original; }, 2400);
  }, 900);
}

function showToast(text, isError) {
  let toast = document.getElementById('bluToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bluToast';
    toast.style.cssText = `
      position:fixed;left:50%;bottom:32px;transform:translate(-50%,20px);
      background:rgba(12,12,30,.97);border:1px solid rgba(79,142,247,.35);
      color:#EDF2FF;padding:14px 22px;border-radius:12px;font-size:.9rem;
      font-family:Inter,sans-serif;z-index:9999;opacity:0;
      transition:opacity .35s ease, transform .35s ease;
      box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:90vw;text-align:center;
    `;
    document.body.appendChild(toast);
  }
  toast.style.borderColor = isError ? 'rgba(248,113,113,.5)' : 'rgba(34,211,238,.4)';
  toast.textContent = text;
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%,0)';
  });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%,20px)';
  }, 3200);
}
