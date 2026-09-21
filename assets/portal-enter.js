// 모바일 메뉴 열고 닫기
(() => {
  const top = document.querySelector('.top'), btn = document.querySelector('.menu-toggle');
  if (!btn) return;
  const set = open => {
    top.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  };
  btn.addEventListener('click', () => set(!top.classList.contains('menu-open')));
  document.addEventListener('click', e => { if (!top.contains(e.target)) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  top.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => set(false)));
})();
