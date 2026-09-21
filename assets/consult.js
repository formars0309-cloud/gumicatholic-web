// 원클릭 상담: [data-consult] 버튼을 누르면 입력 창을 띄우고, 제출 내용을 중계 서버(Cloudflare Worker)로 보낸다.
// data-consult 값(hospital·nursing·homecare)이 있으면 해당 서비스를 미리 선택한다.
(() => {
  const ENDPOINT = 'https://gumicatholic-consult.formars0309.workers.dev/submit';
  const PRIVACY = new URL('../privacy/', document.querySelector('script[src*="consult.js"]').src).href;
  const SERVICES = [['hospital', '요양병원 입원 상담'], ['nursing', '요양원 입소 상담'], ['homecare', '재가 서비스 상담']];
  const PHONES = { hospital: '054-455-8883', nursing: '054-443-0303', homecare: '054-443-0303' };

  // 유입 경로: 주소의 ?src= 또는 utm_source, 없으면 이전 페이지 주소로 판단해 세션 동안 기억한다
  const SRC_NAMES = { place: '네이버 플레이스', blog: '기관 블로그', naver: '네이버 검색', google: '구글 검색', daum: '다음 검색', kakao: '카카오', direct: '직접 방문' };
  function source() {
    try {
      let v = sessionStorage.getItem('gc-src');
      if (v) return v;
      const q = new URLSearchParams(location.search);
      v = q.get('src') || q.get('utm_source');
      if (!v) {
        const r = document.referrer;
        v = !r || r.includes(location.hostname) ? 'direct'
          : /search\.naver|m\.search\.naver/.test(r) ? 'naver' : /map\.naver|place\.naver|pcmap\.place/.test(r) ? 'place'
          : /blog\.naver|tistory/.test(r) ? 'blog' : /google\./.test(r) ? 'google' : /daum\.net/.test(r) ? 'daum'
          : /kakao/.test(r) ? 'kakao' : 'ref:' + new URL(r).hostname;
      }
      v = v.slice(0, 40); sessionStorage.setItem('gc-src', v); return v;
    } catch { return 'unknown'; }
  }
  const SRC = source();

  const dlg = document.createElement('dialog');
  dlg.className = 'consult';
  dlg.setAttribute('aria-labelledby', 'consult-title');
  dlg.innerHTML = `
    <form method="dialog" novalidate>
      <button type="button" class="c-close" aria-label="닫기">×</button>
      <p class="c-eyebrow">365일 24시간 접수</p>
      <h2 id="consult-title">원클릭 상담 신청</h2>
      <p class="c-lead">신청은 주말·공휴일에도 받으며, 담당자가 평일 오전 9시 – 오후 6시에 연락드립니다.</p>
      <label>이용 대상자 이름<input name="patient" autocomplete="off" maxlength="40" required></label>
      <label>보호자 이름<input name="guardian" autocomplete="name" maxlength="40" required></label>
      <label>연락처<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="010-0000-0000" maxlength="20" required></label>
      <fieldset><legend>희망하는 상담</legend>
        ${SERVICES.map(([v, t]) => `<label class="c-radio"><input type="radio" name="service" value="${v}" required><span>${t}</span></label>`).join('')}
      </fieldset>
      <label class="c-hp" aria-hidden="true">웹사이트<input name="website" tabindex="-1" autocomplete="off"></label>
      <div class="c-consent">
        <label class="c-check"><input type="checkbox" name="consent" required><span>개인정보 수집·이용에 동의합니다. (필수)</span></label>
        <details><summary>자세히 보기</summary>
          <p>수집 항목: 이용 대상자 이름, 보호자 이름, 연락처, 희망 상담<br>
          이용 목적: 상담 신청 확인과 연락<br>
          보유 기간: 상담 완료 후 지체 없이 파기<br>
          신청 내용은 암호화된 연결로 기관 상담 담당자의 텔레그램 상담방에 전달되며, 이 과정에서 국외 서버를 거칩니다.<br>
          동의하지 않으시면 신청할 수 없으며, 전화로 상담하실 수 있습니다. <a href="${PRIVACY}" target="_blank" rel="noopener">개인정보 처리방침</a></p>
        </details>
      </div>
      <p class="c-msg" role="status" aria-live="polite"></p>
      <button type="submit" class="c-submit">상담 신청하기</button>
    </form>
    <div class="c-done" hidden>
      <h2>신청이 접수되었습니다.</h2>
      <p>담당자가 상담 시간(평일 오전 9시 – 오후 6시)에 남겨 주신 연락처로 연락드리겠습니다.</p>
      <button type="button" class="c-submit c-ok">확인</button>
    </div>`;
  document.body.appendChild(dlg);

  const form = dlg.querySelector('form'), msg = dlg.querySelector('.c-msg'), done = dlg.querySelector('.c-done');
  const submit = dlg.querySelector('button[type=submit]');
  let openedAt = 0, preset = '';

  function open(service) {
    form.reset(); msg.textContent = ''; form.hidden = false; done.hidden = true; submit.disabled = false;
    preset = service || '';
    if (preset) form.querySelector(`input[name=service][value=${preset}]`).checked = true;
    openedAt = Date.now();
    dlg.showModal();
    form.querySelector('input[name=patient]').focus();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-consult]');
    if (!b) return;
    e.preventDefault(); open(b.dataset.consult);
  });
  dlg.querySelector('.c-close').addEventListener('click', () => dlg.close());
  dlg.querySelector('.c-ok').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  const ERR = { name: '이름을 입력해 주세요.', phone: '연락처를 숫자로 정확히 입력해 주세요.', service: '희망하는 상담을 골라 주세요.',
    consent: '개인정보 수집·이용에 동의해 주세요.', wait: '잠시 후 다시 신청해 주세요.', too_fast: '잠시 후 다시 신청해 주세요.' };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(form);
    const data = { patient: f.get('patient').trim(), guardian: f.get('guardian').trim(), phone: f.get('phone').trim(),
      service: f.get('service'), consent: !!f.get('consent'), website: f.get('website'),
      elapsed: Date.now() - openedAt, page: document.title.split('|')[0].trim(), src: SRC_NAMES[SRC] || SRC };
    const digits = data.phone.replace(/\D/g, '');
    const local = !data.patient || !data.guardian ? 'name' : !/^0\d{8,10}$/.test(digits) ? 'phone'
      : !data.service ? 'service' : !data.consent ? 'consent' : '';
    if (local) { msg.textContent = ERR[local]; return; }
    submit.disabled = true; msg.textContent = '보내는 중입니다…';
    try {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ok) { form.hidden = true; done.hidden = false; done.querySelector('.c-ok').focus(); return; }
      msg.textContent = ERR[j.error] || `전송하지 못했습니다. 전화(${PHONES[data.service] || PHONES.hospital})로 문의해 주세요.`;
    } catch {
      msg.textContent = `전송하지 못했습니다. 전화(${PHONES[data.service] || PHONES.hospital})로 문의해 주세요.`;
    }
    submit.disabled = false;
  });
})();
