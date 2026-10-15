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

    /* Hero: headline slides up, copy fades in, then the composition builds */
    gsap.timeline({ defaults: { ease: 'power4.out' } })
      .fromTo('h1 .line>span', { yPercent: 110, autoAlpha: 1 }, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.05)
      .fromTo('.rise', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.2)
      .add(() => $('h1 em').classList.add('on'), 1)
      .from('.art__panel', { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 60%', duration: 0.9 }, 0.2)
      .from('.phone', { autoAlpha: 0, y: 60, duration: 0.9 }, 0.45)
      .from('.pgrid i', { autoAlpha: 0, scale: 0.7, duration: 0.4, stagger: 0.04, ease: 'back.out(1.6)' }, 0.9)
      .from('.acard--rep', { autoAlpha: 0, x: 40, duration: 0.8 }, 0.9)
      .from('.acard--cal', { autoAlpha: 0, x: -40, duration: 0.8 }, 1.05)
      .from('.mbars i', { scaleY: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' }, 1.3)
      .from('.week .on i', { scale: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(2.4)' }, 1.4);

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
