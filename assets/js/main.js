/* =================================================================
   Sumit Jha — Portfolio interactions
   Progressive enhancement: everything degrades gracefully.
   ================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  // Let CSS know GSAP is driving reveals (so it won't double-animate them).
  if (hasGSAP && !reduceMotion) root.classList.add('has-gsap');
  // Section headings get a dedicated 3D kinetic title animation — opt them out of the generic reveal.
  document.querySelectorAll('.section__head[data-reveal]').forEach(function (h) { h.removeAttribute('data-reveal'); });

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme toggle (with brief cross-fade) ---------- */
  var toggle = document.getElementById('themeToggle');
  function setTheme(t) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    window.setTimeout(function () { root.classList.remove('theme-anim'); }, 500);
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Mobile nav ---------- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('navBurger');
  var navLinksWrap = document.querySelector('.nav__links');
  function closeMenu() {
    nav.classList.remove('is-open');
    if (navLinksWrap) navLinksWrap.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      if (navLinksWrap) navLinksWrap.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
  }
  function scrollToTarget(target) {
    var offset = -68;
    if (lenis) { lenis.scrollTo(target, { offset: offset }); }
    else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    });
  });

  /* ---------- Nav scrolled state + scroll progress ---------- */
  var progress = document.querySelector('.scroll-progress');
  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('is-scrolled', y > 20);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (lenis) lenis.on('scroll', onScroll);
  onScroll();

  /* ---------- Active nav link ---------- */
  var navAnchors = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
  var navSections = navAnchors
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && navSections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = '#' + entry.target.id;
          navAnchors.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === id); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- Reveal on scroll (everything except the hero) ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'))
    .filter(function (el) { return !el.closest('.hero'); });
  if (reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else if (hasGSAP) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    if (lenis) lenis.on('scroll', window.ScrollTrigger.update);
    revealEls.forEach(function (el) {
      window.gsap.fromTo(el, { y: 32, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
      });
    });
  } else if ('IntersectionObserver' in window) {
    var revObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { revObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Timeline line draw + traveling marker on scroll ---------- */
  if (hasGSAP && !reduceMotion) {
    var tlWrap = document.querySelector('.timeline');
    if (tlWrap) {
      window.gsap.fromTo(tlWrap, { '--draw': 0 }, {
        '--draw': 1, ease: 'none',
        scrollTrigger: { trigger: tlWrap, start: 'top 75%', end: 'bottom 80%', scrub: true }
      });
      var marker = tlWrap.querySelector('.tl-marker');
      if (marker) {
        window.gsap.fromTo(marker, { top: '0%' }, {
          top: '100%', ease: 'none',
          scrollTrigger: { trigger: tlWrap, start: 'top 70%', end: 'bottom 78%', scrub: true }
        });
      }
    }
  }

  /* ---------- 3D kinetic section titles ---------- */
  function splitWordsEl(el, cls) {
    var words = el.textContent.split(' ');
    el.textContent = '';
    var out = [];
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = cls;
      s.textContent = w;
      el.appendChild(s);
      out.push(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return out;
  }
  document.querySelectorAll('.section__head').forEach(function (head) {
    var title = head.querySelector('.section__title');
    var lead = head.querySelector('.section__index, .spark');
    var words = title ? splitWordsEl(title, 'kw') : [];
    if (!hasGSAP || reduceMotion || !words.length) return; // titles stay visible
    var tl = window.gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 85%', toggleActions: 'play none none reverse' } });
    if (lead) tl.from(lead, { y: 18, autoAlpha: 0, duration: 0.45, ease: 'power2.out' });
    tl.from(words, { rotationX: -90, y: 36, autoAlpha: 0, transformOrigin: '50% 50% -36px', duration: 0.85, ease: 'power3.out', stagger: 0.08 }, lead ? '-=0.25' : 0);
  });

  /* ---------- Split text + hero intro ---------- */
  function splitInto(el) {
    var words = el.textContent.split(' ');
    el.textContent = '';
    var spans = [];
    words.forEach(function (w, idx) {
      var s = document.createElement('span');
      s.className = 'split-word';
      s.textContent = w;
      el.appendChild(s);
      spans.push(s);
      if (idx < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return spans;
  }
  function heroIntro() {
    var chars = [];
    document.querySelectorAll('.hero__title [data-split]').forEach(function (line) {
      chars = chars.concat(splitInto(line));
    });
    var boot = document.getElementById('boot');

    function revealScreen() {
      var t = window.gsap.timeline();
      if (boot) t.to(boot, { autoAlpha: 0, duration: 0.3, onComplete: function () { boot.style.display = 'none'; boot.classList.remove('is-typing'); } });
      t.set('#screenContent', { autoAlpha: 1 })
        .from(chars, { yPercent: 115, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.09 })
        .from('.screen .hero__eyebrow', { y: 16, autoAlpha: 0, duration: 0.5 }, '<')
        .from('.screen .hero__lead', { y: 16, autoAlpha: 0, duration: 0.5 }, '<0.2')
        .from('.screen .hero__cta', { y: 16, autoAlpha: 0, duration: 0.5 }, '<0.15')
        .from('.screen .hero__social', { y: 16, autoAlpha: 0, duration: 0.5 }, '<0.15');
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }

    if (hasGSAP && !reduceMotion) {
      window.gsap.set('#screenContent', { autoAlpha: 0 });
      if (boot) boot.style.display = 'block';
      window.gsap.timeline({ delay: 0.05 })
        // Laptop flies in from the right...
        .from('#laptop', { xPercent: 24, rotateY: -28, autoAlpha: 0, duration: 1.0, ease: 'power3.out', transformOrigin: 'right center' })
        // ...screen flickers on like a booting terminal...
        .to('#laptopFlicker', { opacity: 0.85, duration: 0.05, repeat: 5, yoyo: true }, '-=0.2')
        .set('#laptopFlicker', { opacity: 0 })
        // ...terminal boots, then the home content renders on the screen.
        .add(function () { window.gsap.set('#laptop', { clearProps: 'transform' }); bootSequence(revealScreen); });
    } else {
      if (boot) boot.style.display = 'none';
      // #screenContent is visible by default (no JS / reduced motion)
    }
  }

  /* ---------- Preloader orchestration ---------- */
  var pre = document.getElementById('preloader');
  var started = false;
  function revealSite() {
    if (started) return;
    started = true;
    if (pre) pre.classList.add('is-done');
    heroIntro();
  }
  if (reduceMotion) {
    if (pre) pre.style.display = 'none';
    revealSite();
  } else {
    window.setTimeout(revealSite, 1200);
    window.addEventListener('load', function () { window.setTimeout(revealSite, 400); });
  }

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null, dur = 1400;
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { countObs.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Magnetic buttons + social ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.magnetic, .hero__social a').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + x * 0.25 + 'px,' + y * 0.4 + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- 3D tilt cards ---------- */
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.proj, .skill-card, .edu, .tl__card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(800px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- Button click ripple ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var r = btn.getBoundingClientRect();
      var span = document.createElement('span');
      span.className = 'ripple';
      var size = Math.max(r.width, r.height);
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - r.left) + 'px';
      span.style.top = (e.clientY - r.top) + 'px';
      btn.appendChild(span);
      window.setTimeout(function () { span.remove(); }, 600);
    });
  });

  /* ---------- Hero terminal boot sequence ---------- */
  // [spanClass, text] — typed into the laptop screen before the content "renders"
  var BOOT = [
    ['b-dim', '$ '], ['b-cmd', 'ssh sumit@portfolio\n'],
    ['b-ok', '✓ authenticated\n'],
    ['b-dim', '$ '], ['b-cmd', './launch --hello\n'],
    ['b-dim', 'booting developer environment…\n'],
    ['b-dim', 'mounting projects  '], ['b-acc', '████████ 100%\n'],
    ['b-ok', '✓ ready — rendering portfolio\n']
  ];
  function bootSequence(done) {
    var boot = document.getElementById('boot');
    if (!boot) { if (done) done(); return; }
    boot.textContent = '';
    boot.classList.add('is-typing');
    var i = 0;
    (function nextTok() {
      if (i >= BOOT.length) { window.setTimeout(function () { if (done) done(); }, 380); return; }
      var tok = BOOT[i++];
      var span = document.createElement('span');
      if (tok[0]) span.className = tok[0];
      boot.appendChild(span);
      var txt = tok[1], j = 0;
      (function ch() {
        if (j >= txt.length) { window.setTimeout(nextTok, 55); return; }
        span.textContent += txt.charAt(j++);
        var p = txt.charAt(j - 1);
        window.setTimeout(ch, p === '\n' ? 40 : p === ' ' ? 6 : 13 + Math.random() * 22);
      })();
    })();
  }

  /* ---------- Hero parallax on scroll ---------- */
  if (hasGSAP && !reduceMotion) {
    window.gsap.to('.laptop--hero', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Hero orbs follow the cursor (parallax) ---------- */
  var orbs = document.querySelector('.hero__orbs');
  if (orbs && finePointer && !reduceMotion) {
    var hero = document.getElementById('home');
    hero.addEventListener('mousemove', function (e) {
      var cx = (e.clientX / window.innerWidth - 0.5);
      var cy = (e.clientY / window.innerHeight - 0.5);
      orbs.style.transform = 'translate(' + (cx * 40) + 'px,' + (cy * 40) + 'px)';
    });
    hero.addEventListener('mouseleave', function () { orbs.style.transform = ''; });
  }

  /* ---------- Open Source: self-drawing git graph ---------- */
  (function () {
    var svg = document.getElementById('gitgraph');
    if (!svg) return;
    var lines = svg.querySelectorAll('.gg-line, .gg-branch');
    var nodes = svg.querySelectorAll('.gg-node');
    if (reduceMotion || !hasGSAP) return; // static graph is fine
    lines.forEach(function (p) {
      var len = p.getTotalLength();
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    window.gsap.set(nodes, { scale: 0 });
    var tl = window.gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 80%', toggleActions: 'play none none reverse' } });
    tl.to(lines, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: 0.2 })
      .to(nodes, { scale: 1, duration: 0.4, ease: 'back.out(2)', stagger: 0.12 }, '-=0.9');
  })();

  /* ---------- Contact: paper plane follows the path ---------- */
  (function () {
    var path = document.getElementById('planePath');
    var plane = document.getElementById('plane');
    if (!path || !plane) return;
    if (reduceMotion || !hasGSAP) { plane.style.opacity = '1'; return; }
    var len = path.getTotalLength();
    function place(l) {
      var p = path.getPointAtLength(l);
      var p2 = path.getPointAtLength(Math.min(l + 1, len));
      var ang = Math.atan2(p2.y - p.y, p2.x - p.x) * 180 / Math.PI;
      plane.setAttribute('transform', 'translate(' + p.x + ',' + (p.y - 8) + ') rotate(' + ang + ')');
    }
    place(0);
    var proxy = { l: 0 };
    window.gsap.timeline({ scrollTrigger: { trigger: '.contact', start: 'top 70%', toggleActions: 'play none none reverse' } })
      .set(plane, { opacity: 1 })
      .to(proxy, { l: len, duration: 2.4, ease: 'power1.inOut', onUpdate: function () { place(proxy.l); } });
  })();

  /* ---------- Cursor spotlight glow on cards ---------- */
  if (finePointer) {
    document.querySelectorAll('.proj, .skill-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Hero interactive constellation ---------- */
  (function () {
    var canvas = document.getElementById('constellation');
    if (!canvas || reduceMotion) return;
    var hero = document.getElementById('home');
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], mouse = { x: -9999, y: -9999 }, running = false, raf = 0;

    function init() {
      var n = Math.max(24, Math.min(80, Math.floor(W * H / 15000)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32 });
    }
    function resize() {
      W = hero.offsetWidth; H = hero.offsetHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      init();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var rgb = root.getAttribute('data-theme') === 'dark' ? '255,255,255' : '20,20,19';
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dxm = p.x - mouse.x, dym = p.y - mouse.y, dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 130 && dm > 0.01) { p.x += (dxm / dm) * 1.1; p.y += (dym / dm) * 1.1; }
        ctx.fillStyle = 'rgba(' + rgb + ',0.5)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 130) {
            ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.13 * (1 - d / 130)).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    function start() { if (running) return; running = true; draw(); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    hero.addEventListener('mousemove', function (e) { var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    hero.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
    window.addEventListener('resize', resize);
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (en) { en.isIntersecting ? start() : stop(); }); }).observe(hero);
    } else { start(); }
  })();

  /* ---------- Featured project 3D ring (drag to spin) ---------- */
  (function () {
    var stage = document.getElementById('pringStage');
    if (!stage || reduceMotion) return;
    var cards = stage.querySelectorAll('.pring__card');
    var n = cards.length; if (!n) return;
    var radius = 250, step = 360 / n;
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)'; });
    var rot = 0, vel = 0, dragging = false, lastX = 0;
    function render() { stage.style.transform = 'translateZ(-' + radius + 'px) rotateY(' + rot + 'deg)'; }
    function loop() { if (!dragging) { rot += vel; vel *= 0.94; if (Math.abs(vel) < 0.015) vel = 0; rot += 0.12; } render(); requestAnimationFrame(loop); }
    stage.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; vel = 0; stage.classList.add('is-grab'); try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
    stage.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; rot += dx * 0.45; vel = dx * 0.45; });
    function up() { dragging = false; stage.classList.remove('is-grab'); }
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up); window.addEventListener('pointerup', up);
    render(); requestAnimationFrame(loop);
  })();

  /* ---------- Command palette (⌘K / Ctrl-K) ---------- */
  (function () {
    var modal = document.getElementById('cmdk'), input = document.getElementById('cmdkInput'),
        list = document.getElementById('cmdkList'), hintEl = document.getElementById('cmdkHint');
    if (!modal || !input || !list) return;
    function go(sel) { var t = document.querySelector(sel); close(); if (t) scrollToTarget(t); }
    var cmds = [
      { ic: '▸', label: 'Go to About', hint: 'about', run: function () { go('#about'); } },
      { ic: '▸', label: 'Go to Experience', hint: 'experience', run: function () { go('#experience'); } },
      { ic: '▸', label: 'Go to Skills', hint: 'skills', run: function () { go('#skills'); } },
      { ic: '▸', label: 'Go to Projects', hint: 'projects', run: function () { go('#projects'); } },
      { ic: '▸', label: 'Go to Open Source', hint: 'open source', run: function () { go('#opensource'); } },
      { ic: '▸', label: 'Go to Certificates', hint: 'certs', run: function () { go('#certificates'); } },
      { ic: '▸', label: 'Go to Contact', hint: 'contact', run: function () { go('#contact'); } },
      { ic: '⤓', label: 'Download résumé', hint: 'cv / pdf', run: function () { window.open('Sumit_Jha_Resume.pdf', '_blank'); close(); } },
      { ic: '◐', label: 'Toggle theme', hint: 'dark / light', run: function () { if (toggle) toggle.click(); } },
      { ic: '✉', label: 'Email Sumit', hint: 'mailto', run: function () { window.location.href = 'mailto:7sumitjha@gmail.com'; close(); } },
      { ic: '↗', label: 'Open GitHub', hint: 'github', run: function () { window.open('https://github.com/isumitjha', '_blank'); close(); } },
      { ic: '↗', label: 'Open LinkedIn', hint: 'linkedin', run: function () { window.open('https://www.linkedin.com/in/7sumitjha/', '_blank'); close(); } }
    ];
    var filtered = cmds.slice(), active = 0;
    function render() {
      list.innerHTML = '';
      filtered.forEach(function (c, i) {
        var li = document.createElement('li');
        li.className = 'cmdk__item' + (i === active ? ' is-active' : '');
        li.innerHTML = '<span class="ci-ic"></span><span class="ci-lbl"></span><span class="ci-hint"></span>';
        li.children[0].textContent = c.ic; li.children[1].textContent = c.label; li.children[2].textContent = c.hint;
        li.addEventListener('click', function () { c.run(); });
        li.addEventListener('mousemove', function () { if (active !== i) { active = i; paint(); } });
        list.appendChild(li);
      });
    }
    function paint() { Array.prototype.forEach.call(list.children, function (li, i) { li.classList.toggle('is-active', i === active); }); }
    function ensureVis() { var el = list.children[active]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
    function filter() { var q = input.value.toLowerCase().trim(); filtered = cmds.filter(function (c) { return (c.label + ' ' + c.hint).toLowerCase().indexOf(q) >= 0; }); active = 0; render(); }
    function isOpen() { return !modal.hidden; }
    function open() { modal.hidden = false; input.value = ''; filtered = cmds.slice(); active = 0; render(); window.setTimeout(function () { input.focus(); }, 30); }
    function close() { modal.hidden = true; }
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); isOpen() ? close() : open(); return; }
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, filtered.length - 1); paint(); ensureVis(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paint(); ensureVis(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) filtered[active].run(); }
    });
    input.addEventListener('input', filter);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    if (hintEl) hintEl.addEventListener('click', open);
  })();

  /* ---------- Text scramble / decode on nav links ---------- */
  if (!reduceMotion) {
    var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*<>/{}[]=';
    document.querySelectorAll('.nav__links a').forEach(function (link) {
      var orig = link.textContent, raf2 = 0;
      link.addEventListener('mouseenter', function () {
        var len = orig.length, frame = 0;
        cancelAnimationFrame(raf2);
        (function run() {
          var out = '';
          for (var i = 0; i < len; i++) {
            if (i < frame / 2) out += orig.charAt(i);
            else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
          }
          link.textContent = out; frame++;
          if (frame / 2 < len) raf2 = requestAnimationFrame(run);
          else link.textContent = orig;
        })();
      });
      link.addEventListener('mouseleave', function () { cancelAnimationFrame(raf2); link.textContent = orig; });
    });
  }

  /* ---------- Live local (IST) clock ---------- */
  (function () {
    var el = document.getElementById('localTime');
    if (!el) return;
    function tick() {
      var now = new Date();
      var ist = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
      var h = ist.getHours(), m = ist.getMinutes();
      el.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    tick();
    window.setInterval(tick, 20000);
  })();

  /* ---------- Contribution heatmap ---------- */
  (function () {
    var grid = document.getElementById('contribGrid');
    if (!grid) return;
    var cols = 28, total = cols * 7, sq = [];
    for (var i = 0; i < total; i++) {
      var r = Math.random();
      var lvl = r < 0.4 ? 0 : r < 0.62 ? 1 : r < 0.8 ? 2 : r < 0.93 ? 3 : 4;
      var cell = document.createElement('i');
      if (lvl) cell.className = 'lvl-' + lvl;
      grid.appendChild(cell);
      sq.push(cell);
    }
    if (reduceMotion || !hasGSAP) return;
    window.gsap.from(sq, {
      scale: 0, autoAlpha: 0, transformOrigin: 'center', duration: 0.4, ease: 'power2.out', stagger: 0.004,
      scrollTrigger: { trigger: grid, start: 'top 86%', toggleActions: 'play none none reverse' }
    });
  })();

  /* ---------- Konami easter egg ---------- */
  (function () {
    var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var pos = 0;
    function toast(msg) {
      var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); });
      window.setTimeout(function () { t.classList.remove('show'); window.setTimeout(function () { t.remove(); }, 450); }, 3200);
    }
    function party() {
      toast('🎉 dev mode unlocked — keep building!');
      if (reduceMotion) return;
      var glyphs = ['{', '}', ';', '/', '<', '>', '=>', '✦', '☕', '0', '1', '&&', '#', '()'];
      for (var i = 0; i < 46; i++) {
        var s = document.createElement('span');
        s.className = 'glyph-rain';
        s.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
        s.style.left = (Math.random() * 100) + 'vw';
        s.style.fontSize = (12 + Math.random() * 22) + 'px';
        var dur = 2.5 + Math.random() * 2.5;
        s.style.animation = 'fall ' + dur + 's linear ' + (Math.random() * 0.8).toFixed(2) + 's forwards';
        s.style.opacity = (0.5 + Math.random() * 0.5).toFixed(2);
        document.body.appendChild(s);
        (function (node, d) { window.setTimeout(function () { node.remove(); }, (d + 1.2) * 1000); })(s, dur);
      }
    }
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[pos]) { pos++; if (pos === seq.length) { pos = 0; party(); } }
      else { pos = (k === seq[0]) ? 1 : 0; }
    });
  })();

  /* ---------- Interactive terminal ---------- */
  (function () {
    var body = document.getElementById('consoleBody'), input = document.getElementById('consoleInput');
    if (!body || !input) return;
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function ml(s) { return esc(s).replace(/\n/g, '<br>'); }
    function line(html) { var d = document.createElement('div'); d.className = 'console__line'; d.innerHTML = html; body.appendChild(d); body.scrollTop = body.scrollHeight; }
    function echo(cmd) { line('<span class="cl-prompt">~$</span> <span class="cl-cmd">' + esc(cmd) + '</span>'); }
    function go(sel) { var t = document.querySelector(sel); if (t) scrollToTarget(t); }
    var C = {
      help: function () { return 'commands:\n  about      whoami      skills      stack\n  projects   experience  opensource  talks\n  certs      contact     social      resume\n  coffee     theme       clear       sudo'; },
      about: function () { return 'Sumit Jha — Software Engineer II @ OpenTeams.\nFull-stack engineer & open-source contributor in New Delhi, India.\nI build AI-driven apps, secure enterprise systems & developer tools.'; },
      whoami: function () { return 'visitor — but maybe a future collaborator :)'; },
      skills: function () { return 'Languages : Python, TypeScript, JavaScript, SQL\nBackend   : FastAPI, Django, Flask, Pydantic\nFrontend  : React, Next.js, Tailwind, WebGL\nDevOps    : Docker, GitHub Actions, AWS, Terraform/OpenTofu'; },
      stack: function () { return 'Python · TypeScript · React · Next.js · FastAPI · Django · Docker · AWS · PostgreSQL · Terraform · Git · Linux'; },
      projects: function () { go('#projects'); return 'opening projects…'; },
      experience: function () { go('#experience'); return 'OpenTeams → PiHex / Python AI Solutions → Essentia → TruAct. opening…'; },
      opensource: function () { go('#opensource'); return 'NiiVue, SymPy, Panel, Nebari, jupyterlab-conda-store & more. opening…'; },
      oss: function () { return C.opensource(); },
      talks: function () { go('#talks'); return 'PyCon India 2024 — lightning talk on Panel. opening…'; },
      certs: function () { go('#certificates'); return 'Udemy · HackerRank · NPTEL. opening…'; },
      contact: function () { go('#contact'); return 'reach me at 7sumitjha@gmail.com — opening contact…'; },
      social: function () { return 'GitHub   : github.com/isumitjha\nLinkedIn : linkedin.com/in/7sumitjha'; },
      resume: function () { window.open('Sumit_Jha_Resume.pdf', '_blank'); return 'downloading résumé… (Sumit_Jha_Resume.pdf)'; },
      cv: function () { return C.resume(); },
      coffee: function () { return '☕ brewing… done. productivity +30%, bugs -2.'; },
      theme: function () { if (toggle) toggle.click(); return 'toggled theme.'; },
      clear: function () { body.innerHTML = ''; return ''; },
      sudo: function () { return 'nice try 😄 — you already have root here.'; },
      ls: function () { return 'about  experience  skills  projects  opensource  talks  certs  contact'; },
      echo: function (a) { return a.join(' '); }
    };
    function run(raw) {
      var t = raw.trim(); if (!t) return;
      var parts = t.split(/\s+/), cmd = parts[0].toLowerCase(), args = parts.slice(1);
      echo(t);
      if (C[cmd]) { var out = C[cmd](args); if (out) line(ml(out)); }
      else { line('<span class="cl-err">command not found: ' + esc(cmd) + '</span> — try <span class="cl-cmd">help</span>'); }
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { run(input.value); input.value = ''; } });
    document.querySelectorAll('.tw').forEach(function (b) {
      b.addEventListener('click', function () { echo(b.textContent); line('<span class="cl-acc">✦</span> ' + esc(b.textContent) + ' — part of my daily toolkit.'); input.focus(); });
    });
  })();
})();
