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

    /* Hero: headline slides up, copy fades in, then the two rows of tiles rise in */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('h1 .line>span', { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.05)
      .fromTo('.hero__title .rise, .hero__side .rise', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.2)
      .add(() => $('h1 em').classList.add('on'), 0.95)
      .fromTo('.reel__row', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.18 }, 0.7);

    // the three facts count in as you reach them
    ScrollTrigger.create({
      trigger: '.facts', start: 'top 88%', once: true,
      onEnter: () => {
        gsap.fromTo('.facts', { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 });
        $$('.facts b').forEach(el => { const n = +el.textContent; const o = { v: 0 };
          gsap.to(o, { v: n, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }); });
      }
    });

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
