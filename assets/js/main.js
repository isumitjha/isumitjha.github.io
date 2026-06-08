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
})();
