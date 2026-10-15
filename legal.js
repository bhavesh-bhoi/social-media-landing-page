(() => {
  const $ = s => document.querySelector(s);
  $('#year').textContent = new Date().getFullYear();
  const burger = $('#burger'), links = $('#navLinks');
  const setMenu = open => {
    burger.classList.toggle('open', open);
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  // Footer wordmark: red spotlight follows the pointer
  const word = $('.footer__word');
  if (word) word.addEventListener('pointermove', e => {
    const r = word.getBoundingClientRect();
    word.style.setProperty('--mx', e.clientX - r.left + 'px');
    word.style.setProperty('--my', e.clientY - r.top + 'px');
  });
})();
