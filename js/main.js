/* ══════════════════════════════════════════════════════════════
   BRIGIENT — main.js (GSAP + ScrollTrigger + Lenis)
   Animation wiring is attribute-driven so every page gets the
   same motion language automatically:

   [data-reveal]              fade-up (variants: left|right|scale|fade)
   [data-reveal-group]        stagger direct children
   [data-split]               headline line-split masked reveal
   [data-counter]             count up to data-target
   [data-parallax]            translateY parallax, data-speed="0.2"
   [data-tilt]                3D tilt on hover
   [data-magnetic]            magnetic pull on hover
   [data-marquee]             infinite marquee (data-marquee-speed)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const staticMode = new URLSearchParams(location.search).has('static');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches || staticMode;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ─── Lenis smooth scroll ─── */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  const hasGSAP = typeof gsap !== 'undefined';
  if (hasGSAP && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);
  }

  /* ─── Preloader ─── */
  const pre = document.querySelector('.preloader');
  let introDone = false;
  const runIntro = () => {
    if (introDone) return;
    introDone = true;
    if (!pre) return introHero();
    if (reduceMotion || !hasGSAP) { pre.remove(); introHero(); return; }
    const tl = gsap.timeline({ onComplete: () => { pre.remove(); } });
    tl.to('.preloader__bar', { scaleX: 1, duration: .45, ease: 'power2.inOut' })
      .to('.preloader__mark', { scale: .82, opacity: 0, duration: .25, ease: 'power2.in' }, '-=.1')
      .to(pre, { yPercent: -100, duration: .5, ease: 'power3.inOut', onStart: introHero }, '-=.05');
    // hard fallback: never trap the page behind the preloader
    setTimeout(() => { if (document.body.contains(pre)) { pre.remove(); } }, 2600);
  };

  /* ─── Hero intro (staggered) ─── */
  function introHero() {
    if (!hasGSAP || reduceMotion) return;
    const items = document.querySelectorAll('[data-intro]');
    if (!items.length) return;
    gsap.fromTo(items,
      { y: 44, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', stagger: .1, delay: .05, clearProps: 'transform' });
  }

  if (document.readyState === 'complete') runIntro();
  else {
    window.addEventListener('load', runIntro);
    setTimeout(runIntro, 1800); // fallback if load stalls (slow fonts/images)
  }

  /* ─── Split headlines into masked lines ─── */
  function splitLines(el) {
    const text = el.textContent.trim();
    const words = text.split(/\s+/);
    el.setAttribute('aria-label', text);
    el.innerHTML = '';
    const probe = document.createElement('span');
    words.forEach(w => {
      const s = document.createElement('span');
      s.textContent = w + ' ';
      s.style.display = 'inline-block';
      el.appendChild(s);
    });
    // group words into lines by offsetTop
    const lines = [];
    let lastTop = null, line = [];
    [...el.children].forEach(s => {
      const top = s.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) < 4) { line.push(s); }
      else { lines.push(line); line = [s]; }
      lastTop = top;
    });
    if (line.length) lines.push(line);
    el.innerHTML = '';
    lines.forEach(ws => {
      const mask = document.createElement('span');
      mask.style.cssText = 'display:block;overflow:hidden;';
      const inner = document.createElement('span');
      inner.className = 'split-line';
      inner.style.display = 'block';
      inner.textContent = ws.map(s => s.textContent).join('').replace(/\s+/g, ' ').trim();
      mask.appendChild(inner);
      el.appendChild(mask);
    });
    return el.querySelectorAll('.split-line');
  }

  if (hasGSAP && !reduceMotion) {
    document.querySelectorAll('[data-split]').forEach(el => {
      const inHero = !!el.closest('.hero, .page-hero');
      const linesEls = splitLines(el);
      gsap.fromTo(linesEls,
        { yPercent: 115 },
        {
          yPercent: 0, duration: 1.15, ease: 'power4.out', stagger: .09,
          delay: inHero ? .25 : 0,
          scrollTrigger: inHero ? null : { trigger: el, start: 'top 88%' }
        });
    });
  }

  /* ─── Scroll reveals ─── */
  if (hasGSAP && !reduceMotion) {
    const variants = {
      up:    { y: 48, opacity: 0 },
      left:  { x: -56, opacity: 0 },
      right: { x: 56, opacity: 0 },
      scale: { scale: .9, opacity: 0 },
      fade:  { opacity: 0 },
    };
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.closest('.hero') && el.hasAttribute('data-intro')) return;
      const v = variants[el.dataset.reveal] || variants.up;
      gsap.fromTo(el, v, {
        x: 0, y: 0, scale: 1, opacity: 1,
        duration: 1, ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      const children = [...group.children];
      gsap.fromTo(children,
        { y: 52, opacity: 0 },
        {
          y: 0, opacity: 1, duration: .95, ease: 'power3.out', stagger: .1,
          clearProps: 'transform',
          scrollTrigger: { trigger: group, start: 'top 86%' },
        });
    });

    /* Parallax */
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.speed || '0.25');
      gsap.to(el, {
        yPercent: speed * -100, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  } else {
    // ensure visible without GSAP
    document.querySelectorAll('[data-reveal], [data-intro]').forEach(el => { el.style.opacity = 1; });
  }

  /* ─── Counters ─── */
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseFloat(el.dataset.target || el.textContent) || 0;
    const decimals = (String(el.dataset.target).split('.')[1] || '').length;
    const render = v => { el.textContent = v.toFixed(decimals); };
    if (!hasGSAP || reduceMotion) { render(target); return; }
    const obj = { v: 0 };
    render(0);
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      onUpdate: () => render(obj.v),
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  /* ─── Marquee ─── */
  document.querySelectorAll('[data-marquee]').forEach(track => {
    track.innerHTML += track.innerHTML;
    if (!hasGSAP || reduceMotion) return;
    const speed = parseFloat(track.dataset.marqueeSpeed || '26');
    const tween = gsap.to(track, { xPercent: -50, ease: 'none', duration: speed, repeat: -1 });
    track.parentElement.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: .25, duration: .4 }));
    track.parentElement.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: .4 }));
  });

  /* ─── Tilt cards ─── */
  if (!isTouch && !reduceMotion && hasGSAP) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      const strength = 7;
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - .5) * -strength;
        const ry = ((e.clientX - r.left) / r.width - .5) * strength;
        gsap.to(card, { rotateX: rx, rotateY: ry, transformPerspective: 900, duration: .5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: 'elastic.out(1, .55)' });
      });
    });
  }

  /* ─── Magnetic buttons ─── */
  if (!isTouch && !reduceMotion && hasGSAP) {
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * .3,
          y: (e.clientY - r.top - r.height / 2) * .35,
          duration: .4, ease: 'power2.out',
        });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1, .5)' });
      });
    });
  }

  /* ─── Custom cursor ─── */
  if (!isTouch && !reduceMotion) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot'; ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    let rx = -100, ry = -100, tx = -100, ty = -100;
    window.addEventListener('mousemove', e => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px)`;
    }, { passive: true });
    (function follow() {
      rx += (tx - rx) * .16; ry += (ty - ry) * .16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a, button, summary, [data-tilt]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });
  }

  /* ─── Header: always visible (sticky), blurred once scrolled ─── */
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Scroll progress bar ─── */
  const prog = document.querySelector('.scroll-progress');
  if (prog) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    };
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  /* ─── Mobile nav ─── */
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (lenis) open ? lenis.stop() : lenis.start();
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      burger.classList.remove('is-open');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }));
  }

  /* ─── FAQ: single-open accordion ─── */
  document.querySelectorAll('.accordion').forEach(acc => {
    const items = acc.querySelectorAll('details');
    items.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
    }));
  });

  /* ─── Rotating hero word (typing) ─── */
  const rotator = document.querySelector('.rotator');
  if (rotator) {
    const words = (rotator.dataset.words || 'Identify,Respond,Recover,Govern').split(',');

    // Reserve the width of the longest word so line breaks never change
    // while words cycle (prevents the hero from growing past 100vh).
    const reserveWidth = () => {
      const cs = getComputedStyle(rotator);
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;'
        + 'font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize + ';'
        + 'font-weight:' + cs.fontWeight + ';letter-spacing:' + cs.letterSpacing + ';';
      document.body.appendChild(probe);
      let max = 0;
      words.forEach(w => { probe.textContent = w; max = Math.max(max, probe.offsetWidth); });
      probe.remove();
      rotator.style.minWidth = Math.ceil(max) + 'px';
    };
    reserveWidth();
    window.addEventListener('resize', reserveWidth);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveWidth);

    if (reduceMotion) { rotator.textContent = words[0]; }
    else {
      let wi = 0, ci = words[0].length, deleting = true;
      rotator.textContent = words[0];
      (function tick() {
        const w = words[wi];
        ci += deleting ? -1 : 1;
        rotator.textContent = w.slice(0, ci);
        let d = deleting ? 50 : 90;
        if (!deleting && ci === w.length) { d = 2400; deleting = true; }
        else if (deleting && ci === 0) { wi = (wi + 1) % words.length; deleting = false; d = 380; }
        setTimeout(tick, d);
      })();
    }
  }

  /* ─── Hero particle network ─── */
  const canvas = document.querySelector('.hero__canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let W, H, pts = [], raf;
    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = r.width * devicePixelRatio;
      H = canvas.height = r.height * devicePixelRatio;
      const n = Math.min(76, Math.floor(r.width / 20));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .3 * devicePixelRatio,
        vy: (Math.random() - .5) * .3 * devicePixelRatio,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const link = 140 * devicePixelRatio;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(110,168,254,.5)';
        ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < link) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(13,110,253,' + (.15 * (1 - d / link)) + ')';
            ctx.lineWidth = devicePixelRatio * .8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); draw(); });
    new IntersectionObserver(es => es.forEach(e => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) draw();
    })).observe(canvas);
  }

  /* ─── Shield scene: GSAP orbit + float ─── */
  if (hasGSAP && !reduceMotion) {
    if (document.querySelector('.shield-sweep')) {
      gsap.to('.shield-sweep', { rotate: 360, duration: 5, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    }
    gsap.utils.toArray('.shield-node, .shield-label').forEach((el, i) => {
      gsap.to(el, { y: '+=12', duration: 2.6 + i * .35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .3 });
    });
    gsap.utils.toArray('.orb').forEach((orb, i) => {
      gsap.to(orb, { x: '+=40', y: '+=30', duration: 9 + i * 2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });
  }

  /* ─── Active nav highlighting by filename ─── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav > a, .nav__menu a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page) a.classList.add('is-active');
  });
})();
