/* Bảng theo dõi lỗi QA bản dịch Hàn → Việt. Chạy thẳng trong trình duyệt, lưu bằng localStorage. */
(function () {
  'use strict';
  const S = window.S, CATS = window.CATS;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'qat:data';
  const RECHECK_MIN = 15;                       // admin mất khoảng 10–15 phút mới lên app

  /* ---------- Lưu trữ ---------- */
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  function load() {
    try {
      const d = JSON.parse(get(KEY) || 'null');
      if (d && Array.isArray(d.items)) return { nextId: d.nextId || d.items.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1, items: d.items.filter(x => x && x.id) };
    } catch (e) {}
    return { nextId: 1, items: [] };
  }
  let data = load();
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
  function flush() {
    clearTimeout(saveT); saveT = 0;
    {
      const ok = set(KEY, JSON.stringify(data));
      const h = hm(new Date());
      $('#sync').textContent = ok ? tp(`Đã lưu lúc ${h} (trên trình duyệt này)`, `${h} 저장됨 (이 브라우저)`) : tp('Chưa lưu được: bộ nhớ trình duyệt đầy hoặc bị chặn. Hãy xuất file JSON ngay.', '저장 실패: 바로 JSON을 내보내세요.');
    }
  }
  // Lưu ngay khi đóng tab hoặc chuyển app trên điện thoại
  window.addEventListener('pagehide', () => { if (saveT) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && saveT) flush(); });

  /* ---------- Ngôn ngữ ---------- */
  let lang = get('qat:lang'); if (!['bi', 'vi', 'ko'].includes(lang)) lang = 'bi';
  const t = (vi, ko) => lang === 'vi' ? vi : lang === 'ko' ? ko : vi + '<span class="ko">' + ko + '</span>';
  const T = k => t(S[k][0], S[k][1]);
  const tp = (vi, ko) => lang === 'vi' ? vi : lang === 'ko' ? ko : vi + ' · ' + ko;
  const TP = k => tp(S[k][0], S[k][1]);

  /* ---------- Thời gian ---------- */
  const pad = n => String(n).padStart(2, '0');
  const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const todayKey = () => dayKey(Date.now());

  /* ---------- Trạng thái lọc ---------- */
  let fStatus = 'all', fCat = '', q = '', editing = null;
  const isDue = x => x.status === 'fixed' && x.fixedAt && Date.now() >= x.fixedAt + RECHECK_MIN * 60000;

  function applyStatic() {
    document.documentElement.lang = lang === 'ko' ? 'ko' : 'vi';
    document.querySelectorAll('[data-t]').forEach(e => { e.innerHTML = T(e.dataset.t); });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === lang));
    $('#q').placeholder = TP('search');
    const catOpts = CATS.map(c => `<option value="${c}">${esc(TP('c_' + c))}</option>`).join('');
    $('#fcat').innerHTML = `<option value="">${esc(TP('allcat'))}</option>` + catOpts;
    $('#fcat').value = fCat;
    const cur = $('#cat').value; $('#cat').innerHTML = catOpts; if (cur) $('#cat').value = cur;
    applyTheme();
  }

  function render() { renderTabs(); renderToday(); renderList(); }

  function renderTabs() {
    const n = s => data.items.filter(x => s === 'all' || (s === 'due' ? isDue(x) : x.status === s)).length;
    const tabs = [['all', 'all'], ['new', 'st_new'], ['fixed', 'st_fixed'], ['checked', 'st_checked']];
    const due = n('due');
    if (due) tabs.push(['due', 'due']);
    $('#tabs').innerHTML = tabs.map(([k, l]) => `<button type="button" data-g="tab" data-v="${k}" class="${k === 'due' ? 'due' : ''}" aria-pressed="${fStatus === k}">${T(l)} <b>${n(k)}</b></button>`).join('');
  }

  function todayStats() {
    const tk = todayKey(), on = ts => ts && dayKey(ts) === tk;
    const added = data.items.filter(x => on(x.created)), fixed = data.items.filter(x => on(x.fixedAt)), checked = data.items.filter(x => on(x.checkedAt));
    const byCat = {};
    added.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + 1; });
    return { added, fixed, checked, byCat };
  }
  function renderToday() {
    const s = todayStats();
    $('#today').innerHTML = t(`Hôm nay: <b>${s.added.length}</b> lỗi mới · <b>${s.fixed.length}</b> đã sửa trên admin · <b>${s.checked.length}</b> đã kiểm tra trên app`,
      `오늘: 신규 <b>${s.added.length}</b>건 · 관리자 수정 <b>${s.fixed.length}</b>건 · 앱 확인 <b>${s.checked.length}</b>건`);
  }
  // Tóm tắt tiếng Hàn để dán vào báo cáo ngày
  function summaryKo() {
    const s = todayStats(), d = new Date();
    const cats = Object.entries(s.byCat).map(([c, n]) => `${S['c_' + c][1]} ${n}`).join(', ');
    const open = data.items.filter(x => x.status !== 'checked').length;
    return `번역 QA (${d.getMonth() + 1}/${d.getDate()})
- 신규 이슈 ${s.added.length}건${cats ? ` (${cats})` : ''}
- 관리자 페이지 수정 ${s.fixed.length}건
- 앱 반영 확인 ${s.checked.length}건
- 남은 이슈 ${open}건`;
  }

  function matches(x) {
    if (fStatus === 'due' ? !isDue(x) : (fStatus !== 'all' && x.status !== fStatus)) return false;
    if (fCat && x.cat !== fCat) return false;
    if (q) { const h = [x.key, x.screen, x.ko, x.before, x.after, x.note].join(' ').toLowerCase(); if (!h.includes(q)) return false; }
    return true;
  }

  function renderList() {
    const items = data.items.filter(matches).sort((a, b) => b.id - a.id);
    if (!data.items.length) { $('#list').innerHTML = `<div class="emptybox">${T('empty')}</div>`; return; }
    if (!items.length) { $('#list').innerHTML = `<div class="emptybox">${T('nomatch')}</div>`; return; }
    $('#list').innerHTML = items.map(card).join('');
    // gợi ý tên màn hình đã dùng
    $('#screens').innerHTML = [...new Set(data.items.map(x => x.screen).filter(Boolean))].map(s => `<option value="${esc(s)}">`).join('');
  }

  function card(x) {
    const st = x.status || 'new';
    const where = [x.screen && esc(x.screen), x.key && `<code>${esc(x.key)}</code>`].filter(Boolean).join(' · ');
    let rec = '';
    if (st === 'fixed' && x.fixedAt) {
      const at = new Date(x.fixedAt + RECHECK_MIN * 60000);
      rec = isDue(x) ? `<span class="recheck now">⏰ ${T('recheck_now')}</span>` : `<span class="recheck">⏳ ${T('recheck')} ${hm(at)}</span>`;
    }
    const next = st === 'new' ? `<button class="step" type="button" data-act="fixed">${T('tofixed')}</button>`
      : st === 'fixed' ? `<button class="step" type="button" data-act="checked">${T('tochecked')}</button>`
      : `<button class="step done" type="button" data-act="reopen">${T('reopen')}</button>`;
    return `<article class="item st-${st}" data-id="${x.id}">
      <div class="head"><span class="num">#${x.id}</span><span class="tag">${T('c_' + (x.cat || 'other'))}</span><span class="badge ${st}">${T('st_' + st)}</span>${where ? `<span class="where">${where}</span>` : ''}</div>
      ${x.ko ? `<p class="src" lang="ko"><span>KO</span>${esc(x.ko)}</p>` : ''}
      <div class="pair" lang="vi">
        <div class="b${x.before ? '' : ' empty'}">${x.before ? esc(x.before) : '—'}</div><div class="arrow" aria-hidden="true">→</div>
        <div class="a${x.after ? '' : ' empty'}">${x.after ? esc(x.after) : '—'}</div>
      </div>
      ${x.note ? `<p class="note">📝 ${esc(x.note)}</p>` : ''}
      <div class="foot-row"><div class="acts">${next}${rec}</div>
        <div class="acts"><button class="mini" type="button" data-act="edit">${T('edit')}</button><button class="mini" type="button" data-act="del" aria-label="${esc(TP('del'))}">✕</button></div></div>
    </article>`;
  }

  /* ---------- Form ---------- */
  const F = () => $('#form');
  function openForm(x) {
    editing = x ? x.id : null;
    const f = F(); f.reset(); f.hidden = false; $('#fmsg').textContent = '';
    if (x) ['key', 'screen', 'ko', 'before', 'after', 'note'].forEach(k => { f.elements[k].value = x[k] || ''; });
    f.elements.cat.value = x ? (x.cat || 'other') : (get('qat:lastcat') || 'overflow');
    if (!x && get('qat:lastscreen')) f.elements.screen.value = get('qat:lastscreen');   // thường QA nhiều lỗi trên cùng 1 màn hình
    $('[data-g=saveadd]').hidden = !!x;
    f.scrollIntoView({ block: 'nearest' });
    (x ? f.elements.ko : f.elements.ko).focus();
  }
  function submit(keepOpen) {
    const f = F(), v = k => f.elements[k].value.trim().normalize('NFC');
    const vals = { key: v('key'), screen: v('screen'), cat: f.elements.cat.value, ko: v('ko'), before: v('before'), after: v('after'), note: v('note') };
    if (!vals.ko && !vals.before && !vals.after) { $('#fmsg').textContent = TP('need'); return; }
    set('qat:lastcat', vals.cat); set('qat:lastscreen', vals.screen);
    if (editing) Object.assign(data.items.find(x => x.id === editing), vals, { updated: Date.now() });
    else data.items.push(Object.assign({ id: data.nextId++, status: 'new', created: Date.now() }, vals));
    save();
    if (keepOpen) {
      ['key', 'ko', 'before', 'after', 'note'].forEach(k => { f.elements[k].value = ''; });
      $('#fmsg').textContent = tp('Đã lưu, nhập lỗi tiếp theo.', '저장됨. 다음 이슈를 입력하세요.');
      f.elements.ko.focus();
    } else { f.hidden = true; editing = null; }
    render();
  }

  /* ---------- Xóa + hoàn tác ---------- */
  let undoBuf = null, toastT = 0;
  function toast(msg) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span><button class="ghost" type="button" data-g="undo">${T('undo')}</button>`;
    el.hidden = false; clearTimeout(toastT);
    toastT = setTimeout(() => { el.hidden = true; undoBuf = null; }, 10000);
  }

  /* ---------- Sao chép ---------- */
  async function copy(txt, b) {
    const o = b.innerHTML;
    try { await navigator.clipboard.writeText(txt); b.textContent = TP('copied'); }
    catch (e) { window.prompt('Ctrl+C', txt); }
    setTimeout(() => { b.innerHTML = o; }, 1400);
  }

  /* ---------- Sao lưu ---------- */
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  const stamp = () => todayKey();
  function exportJSON() { if (saveT) flush(); download(`vi-qa-tracker-${stamp()}.json`, JSON.stringify({ app: 'vi-qa-tracker', version: 1, exported: new Date().toISOString(), ...data }, null, 2), 'application/json'); }
  function exportCSV() {
    const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const head = ['STT', 'Mã chuỗi', 'Màn hình', 'Loại lỗi', 'Câu Hàn gốc', 'Bản Việt lỗi', 'Bản Việt sửa', 'Ghi chú', 'Trạng thái', 'Ngày tạo'];
    const rows = [...data.items].sort((a, b) => a.id - b.id).map(x => [x.id, x.key, x.screen, S['c_' + (x.cat || 'other')][0], x.ko, x.before, x.after, x.note, S['st_' + (x.status || 'new')][0], x.created ? dayKey(x.created) : '']);
    // BOM để Excel đọc đúng tiếng Việt / tiếng Hàn
    download(`vi-qa-tracker-${stamp()}.csv`, '﻿' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  $('#impf').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d || d.app !== 'vi-qa-tracker' || !Array.isArray(d.items)) throw new Error('format');
        // Gộp: lỗi trùng STT thì giữ bản sửa sau cùng
        const byId = new Map(data.items.map(x => [x.id, x]));
        let added = 0, upd = 0;
        d.items.forEach(x => {
          if (!x || !x.id) return;
          const cur = byId.get(x.id);
          if (!cur) { byId.set(x.id, x); added++; }
          else if ((x.updated || x.created || 0) > (cur.updated || cur.created || 0)) { byId.set(x.id, x); upd++; }
        });
        data.items = [...byId.values()];
        data.nextId = Math.max(data.nextId, d.nextId || 0, ...data.items.map(x => x.id + 1));
        save(); render();
        $('#bmsg').textContent = tp(`Đã nhập: ${added} lỗi mới, ${upd} lỗi cập nhật.`, `가져오기: 신규 ${added}건, 업데이트 ${upd}건`);
      } catch (err) { $('#bmsg').textContent = tp('File không đúng định dạng sao lưu của web này.', '이 웹의 백업 파일이 아닙니다.'); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });

  /* ---------- Sáng / tối ---------- */
  let theme = get('qat:theme'); if (!['auto', 'light', 'dark'].includes(theme)) theme = 'auto';
  function applyTheme() {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = theme;
    const b = $('#btheme'); b.textContent = theme === 'auto' ? '◐' : theme === 'light' ? '☀' : '☾';
    b.title = tp(theme === 'auto' ? 'Giao diện: theo máy' : theme === 'light' ? 'Giao diện: sáng' : 'Giao diện: tối', theme === 'auto' ? '테마: 시스템' : theme === 'light' ? '테마: 라이트' : '테마: 다크');
    b.setAttribute('aria-label', b.title);
  }

  /* ---------- Sự kiện ---------- */
  $('#list').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = +b.closest('[data-id]').dataset.id, x = data.items.find(i => i.id === id); if (!x) return;
    const a = b.dataset.act;
    if (a === 'fixed') { x.status = 'fixed'; x.fixedAt = Date.now(); }
    else if (a === 'checked') { x.status = 'checked'; x.checkedAt = Date.now(); }
    else if (a === 'reopen') { x.status = 'new'; x.fixedAt = 0; x.checkedAt = 0; }
    else if (a === 'edit') { openForm(x); return; }
    else if (a === 'del') {
      data.items = data.items.filter(i => i.id !== id); undoBuf = x;
      toast(tp(`Đã xóa lỗi #${id}`, `#${id} 삭제됨`));
    }
    x.updated = Date.now(); save(); render();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b) return;
    const g = b.dataset.g;
    if (g === 'lang') { lang = b.dataset.v; set('qat:lang', lang); applyStatic(); render(); }
    else if (g === 'theme') { theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'; set('qat:theme', theme); applyTheme(); }
    else if (g === 'tab') { fStatus = b.dataset.v; render(); }
    else if (g === 'add') openForm(null);
    else if (g === 'saveadd') submit(true);
    else if (g === 'cancel') { F().hidden = true; editing = null; }
    else if (g === 'copysum') copy(summaryKo(), b);
    else if (g === 'undo') { if (undoBuf) { data.items.push(undoBuf); undoBuf = null; save(); render(); } $('#toast').hidden = true; }
    else if (g === 'export') { exportJSON(); $('#bmsg').textContent = tp('Đã xuất file JSON.', 'JSON을 내보냈습니다.'); }
    else if (g === 'csv') exportCSV();
  });
  F().addEventListener('submit', e => { e.preventDefault(); submit(false); });
  // Ctrl+Enter trong form = Lưu và thêm tiếp
  F().addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(!editing); } });
  $('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase().normalize('NFC'); renderList(); });
  $('#fcat').addEventListener('change', e => { fCat = e.target.value; renderList(); });
  // Mở 2 tab cùng lúc: tab kia lưu thì tab này cập nhật
  window.addEventListener('storage', e => { if (e.key === KEY) { data = load(); render(); } });
  // Cập nhật giờ "kiểm tra lại" mỗi phút
  setInterval(() => { if (data.items.some(x => x.status === 'fixed')) { renderTabs(); if (!document.activeElement || !document.activeElement.closest('#list')) renderList(); } }, 60000);

  applyStatic();
  $('#sync').textContent = tp('Dữ liệu lưu trên trình duyệt này', '이 브라우저에 저장됨');
  render();
})();
