// ============================================
// VOTE ISHAAN SINGH — script.js v3
// Pulsing grid · Vote confetti · Scroll carousel
// Back-to-top · IS. logo link
// ============================================

/* ───────────────────────────────────────────
   1. PULSING GRID (canvas-based)
─────────────────────────────────────────── */
(function () {
  const canvas = document.getElementById('gridCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const CELL = 60;
  let w, h, cols, rows;
  let time = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // ── PULSE TUNING ──────────────────────────────────────
    // RATE:       time += X  →  higher = faster (try 0.015–0.06)
    time += 0.032;
    // BRIGHTNESS: alpha = BASE + RANGE * ...
    //             BASE  = floor brightness
    //             RANGE = how much it pulses above the base
    //             alpha swings between BASE and BASE+RANGE
    // ─────────────────────────────────────────────────────
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const phase = Math.sin(time + c * 0.4 + r * 0.3);
        const alpha = 0.10 + 0.13 * ((phase + 1) / 2); // 0.10 – 0.23

        ctx.beginPath();
        ctx.moveTo(c * CELL, r * CELL);
        ctx.lineTo((c + 1) * CELL, r * CELL);
        ctx.strokeStyle = `rgba(0,245,160,${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(c * CELL, r * CELL);
        ctx.lineTo(c * CELL, (r + 1) * CELL);
        ctx.strokeStyle = `rgba(0,245,160,${alpha})`;
        ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();


/* ───────────────────────────────────────────
   2. VOTE BUTTON — bounce + confetti
─────────────────────────────────────────── */
(function () {
  const btn = document.getElementById('voteBtn');
  const canvas = document.getElementById('confettiCanvas');
  if (!btn || !canvas) return;
  const ctx = canvas.getContext('2d');

  function sizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  let particles = [];
  let animId = null;

  const COLORS = ['#00f5a0', '#7b61ff', '#ff6fd8', '#ffd166', '#06d6a0', '#ffffff'];

  function spawnConfetti() {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.bottom;
    for (let i = 0; i < 60; i++) {
      const angle = (Math.random() * Math.PI * 1.2) - Math.PI * 0.1 - Math.PI / 2;
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 5 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        gravity: 0.25,
        life: 1,
        decay: 0.016 + Math.random() * 0.012,
        isCircle: Math.random() > 0.6
      });
    }
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    if (particles.length === 0) {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      return;
    }
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.99;
      p.rotation += p.rotationSpeed;
      p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.isCircle) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    });
    animId = requestAnimationFrame(animateConfetti);
  }

  btn.addEventListener('click', () => {
    btn.classList.remove('bouncing');
    void btn.offsetWidth;
    btn.classList.add('bouncing');
    btn.addEventListener('animationend', () => btn.classList.remove('bouncing'), { once: true });
    spawnConfetti();
    if (!animId) animId = requestAnimationFrame(animateConfetti);
  });
})();


/* ───────────────────────────────────────────
   3. BACK-TO-TOP + IS. NAV LOGO
   On speech.html the logo navigates to index.html#hero
   On index.html it smooth-scrolls to top
─────────────────────────────────────────── */
(function () {
  const btn  = document.getElementById('backToTop');
  const logo = document.getElementById('navLogo');

  const onIndexPage = window.location.pathname.endsWith('index.html') ||
                      window.location.pathname === '/' ||
                      window.location.pathname.endsWith('/');

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (btn) {
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', scrollTop);
  }

  if (logo) {
    logo.addEventListener('click', e => {
      e.preventDefault();
      if (onIndexPage) {
        // already on index — just scroll to top
        scrollTop();
      } else {
        // on speech.html or any other page — go back to index hero
        window.location.href = 'index.html#hero';
      }
    });
  }
})();


/* ───────────────────────────────────────────
   4. GOALS SCROLL-HIJACK CAROUSEL
   ─ Triggers only once the section is centred in the viewport
   ─ 1 slide visible at a time, with padding preserved
   ─ Spacer = (SLIDE_COUNT - 1) * vh so the 6th slide has full dwell time
   ─ Nav "Goals" highlights correctly while section is pinned
─────────────────────────────────────────── */
(function () {
  const section  = document.getElementById('goals');
  const track    = document.getElementById('goalsTrack');
  const spacerEl = document.getElementById('goalsSpacerEl');
  if (!section || !track || !spacerEl) return;

  const slides      = Array.from(track.children);
  const SLIDE_COUNT = slides.length;          // 6
  const TRANSITIONS = SLIDE_COUNT - 1;        // 5 transitions needed

  // No gap between slides — padding stays inside each .carousel-slide card
  track.style.gap = '0px';

  // ── Slide sizing ─────────────────────────────────────────────────
  // The outer container has padding: 0 2.5rem which gives the visible
  // gap between slide cards and the viewport edges.
  // Slides must be sized to the INNER available width (clientWidth minus
  // the outer's left+right padding), otherwise the card fills edge-to-edge
  // with no visible gap.
  function sizeSlides() {
    const outer = document.querySelector('.goals-carousel-outer');
    if (!outer) return;
    const cs    = getComputedStyle(outer);
    const innerW = outer.clientWidth
                 - parseFloat(cs.paddingLeft)
                 - parseFloat(cs.paddingRight);
    slides.forEach(s => {
      s.style.width    = innerW + 'px';
      s.style.minWidth = innerW + 'px';
      s.style.maxWidth = innerW + 'px';
    });
  }

  // ── Spacer height ────────────────────────────────────────────────
  // Layout:
  //   0 → TRIGGER_OFFSET px   : slide 0 visible, section pinning begins
  //   each vh after that       : one slide transition
  //   final extra DWELL_VH     : slide 6 sits on screen before section releases
  //
  // Total spacer = TRIGGER_OFFSET + (TRANSITIONS × vh) + DWELL_VH
  const TRIGGER_OFFSET = Math.round(window.innerHeight * 0.5); // half-vh lead-in
  const DWELL_VH       = window.innerHeight;                   // full-vh dwell on last slide

  function setSpacerHeight() {
    const total = TRIGGER_OFFSET + (TRANSITIONS * window.innerHeight) + DWELL_VH;
    spacerEl.style.height = total + 'px';
  }

  function applySlide(idx) {
    const clamped = Math.max(0, Math.min(idx, TRANSITIONS));
    const slideW  = slides[0].offsetWidth; // live — stays correct after resize
    track.style.transform = `translateX(-${clamped * slideW}px)`;
  }

  function onScroll() {
    const sectionTop  = section.offsetTop;
    const rawScrolled = window.scrollY - sectionTop;

    // Phase 1: lead-in — stay on slide 0 until section is centred
    const scrolled = rawScrolled - TRIGGER_OFFSET;
    if (scrolled <= 0) { applySlide(0); return; }

    // Phase 2: slide transitions (clamp handles the final dwell)
    const idx = Math.floor(scrolled / window.innerHeight);
    applySlide(idx); // applySlide clamps to max TRANSITIONS, holding slide 6
  }

  function onResize() {
    sizeSlides();
    setSpacerHeight();
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  sizeSlides();
  setSpacerHeight();
  onScroll();
})();


/* ───────────────────────────────────────────
   5. NAVBAR — scroll background + active links
   Bug 2 fix: #goals uses a sticky+spacer layout so IntersectionObserver
   fires on the wrapper, not the spacer.  We instead drive the active
   state from scroll position directly, using getBoundingClientRect().
─────────────────────────────────────────── */
(function () {
  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Map anchor href → section element (handle both pages)
  const sectionIds = ['hero', 'about', 'goals', 'why'];
  const sectionEls = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

  function getActiveId() {
    const mid = window.innerHeight / 2;
    let activeId = null;
    let closestDist = Infinity;

    sectionEls.forEach(el => {
      const rect = el.getBoundingClientRect();

      // For #goals the "element" is the sticky wrapper which is always 100vh tall —
      // but its visual presence spans (section.offsetTop) to
      // (section.offsetTop + section.offsetHeight).
      // We detect it as active when the user is scrolled inside its full range.
      const sectionTop    = el.offsetTop;
      const sectionBottom = sectionTop + el.offsetHeight;
      const scrollY       = window.scrollY;

      if (el.id === 'goals') {
        if (scrollY >= sectionTop && scrollY < sectionBottom) {
          activeId = 'goals';
          return;
        }
      }

      // For all other sections: whichever section's centre is closest to
      // the viewport midpoint wins.
      const centre = rect.top + rect.height / 2;
      const dist   = Math.abs(centre - mid);
      if (dist < closestDist) {
        closestDist = dist;
        activeId = el.id;
      }
    });

    // If goals was explicitly matched, it beats everything else
    return activeId;
  }

  function updateNav() {
    if (navbar) {
      navbar.style.background = window.scrollY > 60
        ? 'rgba(10,10,15,0.97)'
        : 'rgba(10,10,15,0.85)';
    }
    const activeId = getActiveId();
    navLinks.forEach(a => {
      const href = a.getAttribute('href');
      // Match both "#goals" (index.html) and "index.html#goals" (speech.html)
      const matchesActive = href === `#${activeId}` || href === `index.html#${activeId}`;
      a.classList.toggle('active', matchesActive);
    });
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav(); // run once on load
})();


/* ───────────────────────────────────────────
   6. SCROLL REVEAL
─────────────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('#about .about-grid > *, .why-card');
  els.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => obs.observe(el));
})();
