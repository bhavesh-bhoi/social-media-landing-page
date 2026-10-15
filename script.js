(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- Basics (no libraries needed) ---------- */
  $('#year').textContent = new Date().getFullYear();

  const burger = $('#burger'), links = $('#navLinks');
  const setMenu = open => {
    burger.classList.toggle('open', open);
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));

  // highlight the current section in the nav
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('a:not(.btn)', links).forEach(a => a.classList.toggle('active', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  // Before / after slider
  const ba = $('#ba'), baRange = $('#baRange');
  if (ba) baRange.addEventListener('input', () => ba.style.setProperty('--p', baRange.value + '%'));

  // FAQ: smooth open/close, one answer open at a time
  const qas = $$('.qa');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slide = (d, open) => {
    if (d.open === open && !d._busy) return;
    const body = $('p', d);
    if (calm || !d.animate) { d.open = open; return; }
    const from = d.offsetHeight;      // measure first so an interrupted animation reverses smoothly
    if (d._anim) d._anim.cancel();
    // measure the height of both states
    d.open = true; const openH = d.offsetHeight;
    d.open = false; const closedH = d.offsetHeight;
    d.open = true;
    d.style.overflow = 'hidden';
    d._busy = true;
    const ease = 'cubic-bezier(.22,.8,.2,1)';
    const anim = d.animate({ height: [from + 'px', (open ? openH : closedH) + 'px'] }, { duration: 420, easing: ease });
    body.animate({ opacity: open ? [0, 1] : [1, 0], transform: open ? ['translateY(-6px)', 'none'] : ['none', 'translateY(-6px)'] }, { duration: 320, easing: 'ease-out', delay: open ? 80 : 0, fill: 'backwards' });
    d._anim = anim;
    anim.onfinish = () => {
      d.open = open; d.style.overflow = ''; d._busy = false; d._anim = null;
    };
  };
  qas.forEach(d => $('summary', d).addEventListener('click', e => {
    e.preventDefault();
    const willOpen = !(d.open && !d._busy ? true : d._busy && d._wantOpen);
    d._wantOpen = willOpen;
    if (willOpen) qas.forEach(o => { if (o !== d && (o.open || o._busy)) { o._wantOpen = false; slide(o, false); } });
    slide(d, willOpen);
  }));

  /* ---------- Animation (GSAP) ---------- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || reduce) { root.classList.add('no-anim'); return; }

  try {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });

    /* Hero: headline slides up, copy fades in, the stage pops in */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('h1 .line>span', { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.05)
      .fromTo('.hero__copy .rise', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.2)
      .fromTo('.orbit', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 1, stagger: 0.15 }, 0.2)
      .fromTo('.disc', { autoAlpha: 0, scale: 0.6, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'back.out(1.4)' }, 0.3)
      .fromTo('.phone', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.5)
      .fromTo('.scard', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.15 }, 1)
      .add(startLoops, 1.4);

    // headline word swap: seen. remembered. followed. chosen.
    const words = $$('#swap .w');
    if (words.length > 1) {
      gsap.set(words, { yPercent: 115, autoAlpha: 0 });
      gsap.set(words[0], { yPercent: 0, autoAlpha: 1 });
      let wi = 0;
      const swap = () => {
        const cur = words[wi]; wi = (wi + 1) % words.length; const nx = words[wi];
        gsap.timeline()
          .to(cur, { yPercent: -115, autoAlpha: 0, duration: 0.55, ease: 'power3.in' })
          .fromTo(nx, { yPercent: 115, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out' }, '-=0.1');
        gsap.delayedCall(2.5, swap);
      };
      gsap.delayedCall(3.4, swap);
    }

    function startLoops() {
      // notifications pop in one after another, forever
      const toasts = $$('.toast');
      const tt = gsap.timeline({ repeat: -1 });
      toasts.forEach((t, i) => {
        const at = i * 1.5;
        tt.fromTo(t, { autoAlpha: 0, y: 18, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.8)' }, at)
          .to(t, { autoAlpha: 0, y: -12, duration: 0.4, ease: 'power2.in' }, at + 3);
      });
      tt.to({}, { duration: 0.6 });

      // hearts float up from the phone, over and over
      const hearts = $$('.hrt');
      gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.5 })
        .fromTo(hearts, { y: 0, x: 0, opacity: 0, scale: 0.3 },
          { y: i => -140 - i * 26, x: i => [-40, 10, 50, -20, 30, -55][i % 6], opacity: 1, scale: 1, duration: 1.3, stagger: 0.38, ease: 'power1.out' })
        .to(hearts, { opacity: 0, duration: 0.5, stagger: 0.38 }, 0.9);

      // report bars grow, hold, then drop and grow again
      const bars = $$('.mb i');
      gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
        .fromTo(bars, { scaleY: 0.08 }, { scaleY: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' })
        .to({}, { duration: 1.6 })
        .to(bars, { scaleY: 0.08, duration: 0.4, stagger: 0.04, ease: 'power2.in' });

      // calendar days get ticked off one by one
      const days = $$('.wk li');
      const ct = gsap.timeline({ repeat: -1, repeatDelay: 1 });
      days.forEach((d, i) => ct.add(() => d.classList.add('on'), i * 0.45).fromTo(d, { scale: 0.7 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' }, i * 0.45));
      ct.to({}, { duration: 1.4 }).add(() => days.forEach(d => d.classList.remove('on')));
    }

    /* Scroll reveals */
    ScrollTrigger.batch('.reveal', {
      start: 'top 90%', once: true,
      onEnter: els => gsap.fromTo(els, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.09, overwrite: true })
    });

    /* Before / after: the handle sweeps in from the edge to the middle */
    if (ba) {
      ScrollTrigger.create({
        trigger: ba, start: 'top 75%', once: true,
        onEnter: () => gsap.fromTo(ba, { '--p': '96%' }, {
          '--p': '50%', duration: 1.5, ease: 'power3.inOut', delay: 0.2,
          onUpdate: () => { baRange.value = parseFloat(getComputedStyle(ba).getPropertyValue('--p')) || 50; }
        })
      });
    }

    /* Process: the line fills and each step lights up as you reach it */
    const steps = $$('.step');
    if (getComputedStyle($('.steps__line')).display !== 'none') {
      gsap.to('.steps__line i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#steps', start: 'top 70%', end: 'bottom 70%', scrub: 0.4 } });
    }
    steps.forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 72%', onEnter: () => s.classList.add('on'), onLeaveBack: () => s.classList.remove('on') }));

    addEventListener('load', () => ScrollTrigger.refresh());
  } catch (err) {
    console.error('Animation setup failed, showing static page', err);
    root.classList.add('no-anim');
    window.gsap && gsap.killTweensOf('*');
  }
})();
