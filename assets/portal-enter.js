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

// 대문 유입 표식을 기관 홈페이지까지 전달한다. 개인 식별 정보는 저장하지 않는다.
(() => {
  const source = new URLSearchParams(location.search).get('src');
  const validSource = source && /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(source);
  document.querySelectorAll('a[href="hospital/"],a[href="nursing-home/"],a[href="home-care/"],a[href="hospital/#contact"]').forEach(link => {
    const target = new URL(link.href);
    if (validSource) target.searchParams.set('src', source);
    target.searchParams.set('via', 'portal');
    link.href = target.href;
  });
})();
