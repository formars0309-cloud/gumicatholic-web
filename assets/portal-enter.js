// 아치를 누르면 그 아치 속으로 들어가듯 확대한 뒤 이동한다(약 0.8초).
// 새 탭 열기(⌘/Ctrl/Shift/가운데 클릭)와 '동작 줄이기' 설정에서는 연출 없이 바로 이동한다.
(() => {
  const portal = document.querySelector('.portal');
  const veil = document.createElement('div');
  veil.className = 'enter-veil';
  document.body.appendChild(veil);
  const still = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('a.arch').forEach(a => a.addEventListener('click', e => {
    if (still.matches || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const p = portal.getBoundingClientRect(), r = a.getBoundingClientRect();
    const x = r.left + r.width / 2 - p.left, y = r.top + r.height * 0.42 - p.top;
    const scale = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.15;
    portal.style.transformOrigin = `${x}px ${y}px`;
    portal.style.setProperty('--enter-scale', scale);
    document.documentElement.classList.add('entering');
    try { sessionStorage.setItem('gc-enter', '1'); } catch {}
    setTimeout(() => { location.href = a.href; }, 780);
  }));

  // 뒤로 가기로 돌아오면(페이지 보관 캐시) 원래 모습으로
  addEventListener('pageshow', ev => { if (ev.persisted) document.documentElement.classList.remove('entering'); });
})();

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
