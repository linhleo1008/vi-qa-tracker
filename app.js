/* QA Tracker: quản lý issue QA bản dịch / bug theo cách các công cụ quản lý lỗi chuyên nghiệp làm
   (board theo trạng thái, danh sách, dashboard, trang chi tiết có bình luận và lịch sử).
   Chạy thẳng trong trình duyệt, dữ liệu lưu bằng localStorage. */
(function () {
  'use strict';
  const S = window.S, TYPES = window.TYPES, STATUSES = window.STATUSES, PRIORITIES = window.PRIORITIES,
    SEVERITIES = window.SEVERITIES, MARKETS = window.MARKETS, CATS = window.CATS;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'qat:data';
  const RECHECK_MIN = 15;                       // admin mất khoảng 10–15 phút mới lên app
  const TRANS_CATS = ['context', 'order', 'term', 'spell', 'missing', 'unused'];

  /* ---------- Lưu trữ ---------- */
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  let projKey = (get('qat:pkey') || 'VNQA').toUpperCase();
  let me = get('qat:me') || 'Leo';

  /* ---------- Ngôn ngữ ---------- */
  let lang = get('qat:lang'); if (!['bi', 'vi', 'ko'].includes(lang)) lang = 'bi';
  const t = (vi, ko) => lang === 'vi' ? vi : lang === 'ko' ? ko : vi + '<span class="ko">' + ko + '</span>';
  const T = k => t(S[k][0], S[k][1]);
  const tp = (vi, ko) => lang === 'vi' ? vi : lang === 'ko' ? ko : vi + ' · ' + ko;
  const TP = k => tp(S[k][0], S[k][1]);
  const TV = k => S[k][lang === 'ko' ? 1 : 0];       // một ngôn ngữ (cho chỗ hẹp)

  /* ---------- Thời gian ---------- */
  const pad = n => String(n).padStart(2, '0');
  const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const todayKey = () => dayKey(Date.now());
  const fmt = ts => { if (!ts) return '—'; const d = new Date(ts); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + hm(d); };
  const fmtShort = ts => { if (!ts) return '—'; const d = new Date(ts); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
  const daysSince = ts => ts ? Math.floor((Date.now() - ts) / 864e5) : 0;
  const trunc = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

  /* ---------- Dữ liệu ---------- */
  // Tóm tắt tự tạo cho issue cũ chưa có
  function autoSummary(x) {
    if (x.type === 'translation' || x.type === 'ui') {
      const src = x.ko || x.screen || '';
      const pair = [x.before, x.after].filter(Boolean).join(' → ');
      return trunc(src + (pair ? ': ' + pair : ''), 140) || trunc(x.note, 140);
    }
    const base = x.ko || x.screen || '';
    return trunc(base + (x.before ? ' — ' + x.before : ''), 140) || trunc(x.note, 140);
  }
  // Nâng cấp issue cũ lên cấu trúc mới (không đổi 'updated' để giữ nhận biết "chưa chỉnh")
  function upgrade(x) {
    x.cat = CATS.includes(x.cat) ? x.cat : 'other';
    if (!TYPES.includes(x.type)) x.type = x.cat === 'overflow' ? 'ui' : TRANS_CATS.includes(x.cat) ? 'translation' : 'bug';
    if (x.severity === undefined) { const m = /Mức độ (S[123])/.exec(x.note || ''); x.severity = m ? m[1] : ''; }
    if (!PRIORITIES.includes(x.priority)) {
      x.priority = x.severity === 'S1' || /khẩn cấp|긴급/i.test(x.note || '') ? 'highest' : x.severity === 'S2' ? 'high' : 'medium';
    }
    if (!STATUSES.includes(x.status)) x.status = 'new';
    if (!MARKETS.includes(x.market)) x.market = 'VN';
    if (!x.summary) x.summary = autoSummary(x);
    if (x.assignee === undefined) x.assignee = (x.status === 'reported' || x.status === 'waiting') ? 'Dev' : me;
    if (x.reporter === undefined) x.reporter = me;
    if (!Array.isArray(x.labels)) x.labels = [];
    if (!Array.isArray(x.comments)) x.comments = [];
    if (!Array.isArray(x.history)) x.history = [];
    ['key', 'screen', 'ko', 'before', 'after', 'note', 'ticket', 'desc', 'steps', 'actual', 'expected', 'os', 'build', 'device'].forEach(k => { if (x[k] === undefined) x[k] = ''; });
    return x;
  }
  function load() {
    try {
      const d = JSON.parse(get(KEY) || 'null');
      if (d && Array.isArray(d.items)) {
        const items = d.items.filter(x => x && x.id).map(upgrade);
        return { nextId: Math.max(d.nextId || 1, ...items.map(x => x.id + 1), 1), items };
      }
    } catch (e) {}
    return { nextId: 1, items: [] };
  }
  let data = load();
  let saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
  function flush() {
    clearTimeout(saveT); saveT = 0;
    const ok = set(KEY, JSON.stringify(data)), h = hm(new Date());
    $('#sync').textContent = ok ? tp(`Đã lưu lúc ${h} (trên trình duyệt này) · ${data.items.length} issue`, `${h} 저장됨 (이 브라우저) · 이슈 ${data.items.length}건`)
      : tp('Chưa lưu được: bộ nhớ trình duyệt đầy hoặc bị chặn. Hãy xuất file JSON ngay.', '저장 실패: 바로 JSON을 내보내세요.');
  }
  window.addEventListener('pagehide', () => { if (saveT) flush(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && saveT) flush(); });

  const byId = id => data.items.find(x => x.id === id);
  const keyOf = x => projKey + '-' + x.id;
  const isOpen = x => x.status !== 'checked';
  const isDue = x => x.status === 'fixed' && x.fixedBy !== 'dev' && x.fixedAt && Date.now() >= x.fixedAt + RECHECK_MIN * 60000;
  const isOld = x => (x.status === 'reported' || x.status === 'waiting') && daysSince(x.reportedAt) >= 3;
  const priRank = p => PRIORITIES.indexOf(p);
  const initials = n => { n = String(n || '').trim(); if (!n) return ''; const w = n.split(/\s+/); return (w.length > 1 ? w[0][0] + w[w.length - 1][0] : n.slice(0, 2)).toUpperCase(); };

  /* ---------- Đổi trạng thái, ghi lịch sử ---------- */
  function log(x, f, from, to) { x.history.push({ t: Date.now(), by: me, f, from: String(from ?? ''), to: String(to ?? '') }); }
  function setStatus(x, st, by) {
    const now = Date.now(), was = x.status;
    if (st === was) return;
    if (st === 'reported' || st === 'waiting') { if (!x.reportedAt) x.reportedAt = now; x.fixedAt = 0; x.checkedAt = 0; if (!x.assignee || x.assignee === me) x.assignee = 'Dev'; }
    if (st === 'fixed') { x.fixedAt = now; x.fixedBy = by || (was === 'reported' || was === 'waiting' ? 'dev' : 'admin'); x.checkedAt = 0; }
    if (st === 'checked') { x.checkedAt = now; if (!x.fixedAt) x.fixedAt = now; }
    if (st === 'new') { x.reportedAt = 0; x.fixedAt = 0; x.checkedAt = 0; x.fixedBy = ''; }
    log(x, 'status', was, st);
    x.status = st; x.updated = now;
  }

  /* ---------- Bộ lọc ---------- */
  let view = get('qat:view'); if (!['board', 'list', 'dash'].includes(view)) view = 'board';
  const F = { q: '', type: '', mk: '', pri: '', cat: '', as: '', quick: '', status: '' };
  let sort = { k: 'updated', dir: -1 };
  function matches(x) {
    if (F.type && x.type !== F.type) return false;
    if (F.mk && x.market !== F.mk) return false;
    if (F.pri && x.priority !== F.pri) return false;
    if (F.cat && x.cat !== F.cat) return false;
    if (F.as && (x.assignee || '') !== (F.as === '_none' ? '' : F.as)) return false;
    if (F.quick === 'mine' && !(x.assignee === me && isOpen(x))) return false;
    if (F.quick === 'due' && !isDue(x)) return false;
    if (F.quick === 'high' && !(isOpen(x) && priRank(x.priority) <= 1)) return false;
    if (F.quick === 'old' && !isOld(x)) return false;
    if (F.quick === 'open' && !isOpen(x)) return false;
    if (F.status && x.status !== F.status) return false;
    if (F.q) {
      const h = [keyOf(x), x.summary, x.key, x.screen, x.ko, x.before, x.after, x.note, x.ticket, x.desc, x.labels.join(' '), x.assignee].join(' ').toLowerCase().normalize('NFC');
      if (!h.includes(F.q)) return false;
    }
    return true;
  }
  const filtered = () => data.items.filter(matches);

  /* ---------- Vẽ phần tĩnh ---------- */
  function applyStatic() {
    document.documentElement.lang = lang === 'ko' ? 'ko' : 'vi';
    document.querySelectorAll('[data-t]').forEach(e => { e.innerHTML = T(e.dataset.t); });
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === lang));
    $('#q').placeholder = TP('search');
    $('#s_key').value = projKey; $('#s_me').value = me;
    renderFilters(); applyTheme();
  }
  function opts(list, prefix, allKey, cur) {
    return `<option value="">${esc(TP(allKey))}</option>` + list.map(v => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(TP(prefix + v))}</option>`).join('');
  }
  function renderFilters() {
    $('#f_type').innerHTML = opts(TYPES, 't_', 'f_all_type', F.type);
    $('#f_mk').innerHTML = opts(MARKETS, 'mk_', 'f_all_mk', F.mk);
    $('#f_pri').innerHTML = opts(PRIORITIES, 'p_', 'f_all_pri', F.pri);
    $('#f_cat').innerHTML = opts(CATS, 'c_', 'f_all_cat', F.cat);
    const people = [...new Set(data.items.map(x => x.assignee).filter(Boolean))].sort();
    $('#f_as').innerHTML = `<option value="">${esc(TP('f_all_as'))}</option>` + people.map(p => `<option value="${esc(p)}"${p === F.as ? ' selected' : ''}>${esc(p)}</option>`).join('') + `<option value="_none"${F.as === '_none' ? ' selected' : ''}>${esc(TP('unassigned'))}</option>`;
  }
  function renderQuick() {
    const n = fn => data.items.filter(fn).length;
    const chips = [['mine', 'q_mine', n(x => x.assignee === me && isOpen(x))], ['due', 'q_due', n(isDue)], ['high', 'q_high', n(x => isOpen(x) && priRank(x.priority) <= 1)], ['old', 'q_old', n(isOld)]];
    const any = F.q || F.type || F.mk || F.pri || F.cat || F.as || F.quick || F.status;
    $('#quick').innerHTML = chips.map(([k, l, c]) => `<button type="button" class="chip" data-g="quick" data-v="${k}" aria-pressed="${F.quick === k}">${T(l)}<b>${c}</b></button>`).join('')
      + (F.status ? `<button type="button" class="chip" data-g="unstatus" aria-pressed="true">${T('st_' + F.status)} ✕</button>` : '')
      + (F.quick === 'open' ? `<button type="button" class="chip" data-g="quick" data-v="open" aria-pressed="true">${T('d_open')} ✕</button>` : '')
      + (any ? `<button type="button" class="chip clear" data-g="clearf">${T('f_clear')}</button>` : '');
  }

  /* ---------- Thành phần nhỏ ---------- */
  const typeIcon = x => `<span class="type ${x.type}" title="${esc(TP('t_' + x.type))}" aria-label="${esc(TP('t_' + x.type))}">${{ bug: 'B', translation: 'D', ui: 'UI', task: 'T' }[x.type]}</span>`;
  const priIcon = p => `<span class="pri-i ${p}" title="${esc(TP('p_' + p))}"><i>${{ highest: '⇈', high: '↑', medium: '=', low: '↓', lowest: '⇊' }[p]}</i>${esc(S['p_' + p][0])}</span>`;
  const mkTag = x => `<span class="mk ${esc(x.market)}" title="${esc(TP('mk_' + x.market))}">${esc(x.market)}</span>`;
  const badge = st => `<span class="badge ${st}">${esc(TV('st_' + st))}</span>`;
  const avatar = n => n ? `<span class="av" title="${esc(n)}">${esc(initials(n))}</span>` : `<span class="av none" title="${esc(TP('unassigned'))}">?</span>`;
  function warnLine(x) {
    if (isDue(x)) return `<span class="warnline now">⏰ ${esc(TV('recheck_now'))}</span>`;
    if (x.status === 'fixed' && x.fixedBy !== 'dev' && x.fixedAt) return `<span class="warnline">⏳ ${esc(TV('recheck'))} ${hm(new Date(x.fixedAt + RECHECK_MIN * 60000))}</span>`;
    if (x.status === 'reported' || x.status === 'waiting') { const d = daysSince(x.reportedAt); if (d >= 3) return `<span class="warnline">📨 ${d} ${lang === 'ko' ? '일' : 'ngày'}</span>`; }
    return '';
  }

  /* ---------- Board ---------- */
  const COL_LIMIT = 60;
  function renderBoard() {
    const its = filtered();
    if (!data.items.length) { $('#view').innerHTML = `<div class="emptybox">${T('empty')}</div>`; return; }
    $('#view').innerHTML = `<div class="board">${STATUSES.map(st => {
      const list = its.filter(x => x.status === st).sort((a, b) => priRank(a.priority) - priRank(b.priority) || (b.updated || b.created) - (a.updated || a.created));
      return `<div class="col" data-st="${st}"><div class="colh"><span>${T('st_' + st)}</span><b>${list.length}</b></div>
        <div class="cards">${list.slice(0, COL_LIMIT).map(card).join('')}${list.length > COL_LIMIT ? `<div class="more">+${list.length - COL_LIMIT} · ${esc(TP('v_list'))}</div>` : ''}</div></div>`;
    }).join('')}</div>`;
  }
  function card(x) {
    const w = warnLine(x);
    return `<button type="button" class="card" draggable="true" data-id="${x.id}">
      <span class="sum">${esc(x.summary)}</span>
      <span class="meta">${typeIcon(x)}<span class="ikey">${esc(keyOf(x))}</span>${mkTag(x)}<span class="lbl">${esc(TV('c_' + x.cat))}</span>
        <span class="sp">${priIcon(x.priority)}${avatar(x.assignee)}</span></span>
      ${w ? `<span class="meta">${w}</span>` : ''}
    </button>`;
  }

  /* ---------- Danh sách ---------- */
  const COLS = [['key', 'Key'], ['type', 'f_type'], ['summary', 'f_summary'], ['market', 'f_market'], ['priority', 'f_priority'], ['status', 'f_status'], ['assignee', 'f_assignee'], ['updated', 'f_updated']];
  function sortVal(x, k) {
    if (k === 'key') return x.id;
    if (k === 'priority') return priRank(x.priority);
    if (k === 'status') return STATUSES.indexOf(x.status);
    if (k === 'updated') return x.updated || x.created || 0;
    return String(x[k] || '').toLowerCase();
  }
  function renderList() {
    if (!data.items.length) { $('#view').innerHTML = `<div class="emptybox">${T('empty')}</div>`; return; }
    const its = filtered().sort((a, b) => { const A = sortVal(a, sort.k), B = sortVal(b, sort.k); return (A > B ? 1 : A < B ? -1 : 0) * sort.dir; });
    $('#view').innerHTML = `<p class="mut">${its.length} ${esc(TV('count'))}</p><div class="tablewrap"><table>
      <thead><tr>${COLS.map(([k, l]) => `<th><button type="button" data-g="sort" data-v="${k}"${sort.k === k ? ` aria-sort="${sort.dir > 0 ? 'ascending' : 'descending'}"` : ''}>${l === 'Key' ? 'Key' : T(l)} ${sort.k === k ? (sort.dir > 0 ? '▲' : '▼') : ''}</button></th>`).join('')}</tr></thead>
      <tbody>${its.length ? its.map(x => `<tr data-id="${x.id}" tabindex="0">
        <td class="ikey">${esc(keyOf(x))}</td><td>${typeIcon(x)}</td>
        <td class="sumc">${esc(x.summary)}${x.screen ? `<small>${esc(x.screen)}</small>` : ''}</td>
        <td>${mkTag(x)}</td><td>${priIcon(x.priority)}</td><td>${badge(x.status)} ${warnLine(x)}</td>
        <td>${avatar(x.assignee)} <span class="mut">${esc(x.assignee || '')}</span></td><td class="mut">${fmtShort(x.updated || x.created)}</td></tr>`).join('')
        : `<tr><td colspan="8" class="mut">${T('nomatch')}</td></tr>`}</tbody></table></div>`;
  }

  /* ---------- Dashboard ---------- */
  function bars(rows, g) {
    const max = Math.max(1, ...rows.map(r => r[2]));
    return `<div class="bars">${rows.map(([v, label, n]) => `<button type="button" class="bar" data-g="${g}" data-v="${esc(v)}"><span>${label}</span><span class="track"><span class="fill" style="width:${(n / max * 100).toFixed(1)}%"></span></span><b>${n}</b></button>`).join('')}</div>`;
  }
  function todayStats() {
    const tk = todayKey(), on = ts => ts && dayKey(ts) === tk;
    const added = data.items.filter(x => on(x.created)), fixed = data.items.filter(x => on(x.fixedAt)), checked = data.items.filter(x => on(x.checkedAt));
    const reported = data.items.filter(x => on(x.reportedAt)), pending = data.items.filter(x => x.status === 'reported' || x.status === 'waiting');
    const byCat = {}; added.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + 1; });
    return { added, fixed, checked, reported, pending, byCat };
  }
  // Tóm tắt tiếng Hàn để dán vào báo cáo ngày
  function summaryKo() {
    const s = todayStats(), d = new Date();
    const cats = Object.entries(s.byCat).map(([c, n]) => `${S['c_' + c][1]} ${n}`).join(', ');
    const open = data.items.filter(isOpen).length;
    return `번역 QA (${d.getMonth() + 1}/${d.getDate()})
- 신규 이슈 ${s.added.length}건${cats ? ` (${cats})` : ''}
- 개발팀 요청 ${s.reported.length}건 (처리 대기 총 ${s.pending.length}건)
- 수정 완료 ${s.fixed.length}건 (관리자 ${s.fixed.filter(x => x.fixedBy !== 'dev').length} / 개발 ${s.fixed.filter(x => x.fixedBy === 'dev').length})
- 앱 반영 확인 ${s.checked.length}건
- 남은 이슈 ${open}건`;
  }
  function renderDash() {
    const all = data.items, open = all.filter(isOpen);
    const cnt = (list, fn) => list.filter(fn).length;
    const days = [...Array(14)].map((_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 13 + i); return dayKey(d); });
    const cr = days.map(dk => cnt(all, x => dayKey(x.created) === dk)), cl = days.map(dk => cnt(all, x => x.checkedAt && dayKey(x.checkedAt) === dk));
    const mx = Math.max(1, ...cr, ...cl);
    $('#view').innerHTML = `<div class="dash">
      <div class="kpis">
        <button type="button" class="kpi" data-g="kpi" data-v="all"><b>${all.length}</b><span>${T('d_total')}</span></button>
        <button type="button" class="kpi" data-g="kpi" data-v="open"><b>${open.length}</b><span>${T('d_open')}</span></button>
        <button type="button" class="kpi${cnt(all, isDue) ? ' warn' : ''}" data-g="kpi" data-v="due"><b>${cnt(all, isDue)}</b><span>${T('d_due')}</span></button>
        <button type="button" class="kpi${cnt(all, isOld) ? ' warn' : ''}" data-g="kpi" data-v="old"><b>${cnt(all, isOld)}</b><span>${T('d_old')}</span></button>
      </div>
      <div class="panel"><h3>${T('d_bystatus')}</h3>${bars(STATUSES.map(s => [s, T('st_' + s), cnt(all, x => x.status === s)]), 'dstatus')}</div>
      <div class="panel"><h3>${T('d_bypri')}</h3>${bars(PRIORITIES.map(p => [p, priIcon(p), cnt(open, x => x.priority === p)]), 'dpri')}</div>
      <div class="panel"><h3>${T('d_bymk')}</h3>${bars(MARKETS.map(m => [m, T('mk_' + m), cnt(open, x => x.market === m)]), 'dmk')}</div>
      <div class="panel"><h3>${T('d_bycat')}</h3>${bars(CATS.map(c => [c, T('c_' + c), cnt(open, x => x.cat === c)]).filter(r => r[2]), 'dcat')}</div>
      <div class="panel"><h3>${T('d_trend')}</h3>
        <div class="trend">${days.map((_, i) => `<div title="${days[i]}: +${cr[i]} / ✓${cl[i]}"><i class="c" style="height:${cr[i] / mx * 100}%"></i><i class="d" style="height:${cl[i] / mx * 100}%"></i></div>`).join('')}</div>
        <div class="trendx">${days.map(d => `<span>${d.slice(8)}</span>`).join('')}</div>
        <div class="legend"><span><i style="background:var(--brand)"></i>${esc(TP('d_created'))}</span><span><i style="background:var(--good)"></i>${esc(TP('d_closed'))}</span></div></div>
      <div class="panel"><h3>${T('copysum')}</h3><pre class="sumbox" lang="ko">${esc(summaryKo())}</pre><button class="ghost" type="button" data-g="copysum">${T('copysum')}</button></div>
    </div>`;
  }

  function render() {
    document.querySelectorAll('.views button').forEach(b => b.setAttribute('aria-selected', b.dataset.v === view));
    renderQuick();
    if (view === 'board') renderBoard(); else if (view === 'list') renderList(); else renderDash();
  }

  /* ---------- Trang chi tiết issue ---------- */
  let openId = null, draft = null, actTab = 'comments', delArmed = false;
  const FIELDS_TEXT = ['summary', 'desc', 'steps', 'actual', 'expected', 'key', 'ko', 'before', 'after', 'screen', 'ticket', 'os', 'build', 'device', 'note', 'assignee', 'reporter'];
  const FIELDS_SEL = ['type', 'priority', 'severity', 'market', 'cat'];
  const TRACKED = ['type', 'priority', 'severity', 'market', 'cat', 'assignee', 'summary'];
  const sel = (name, list, prefix, cur) => `<select name="${name}">${list.map(v => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(TP(prefix + v))}</option>`).join('')}</select>`;
  const fld = (name, label, val, area, attrs = '') => `<label><span>${T(label)}</span>${area ? `<textarea name="${name}" rows="${area}"${attrs}>${esc(val)}</textarea>` : `<input name="${name}" value="${esc(val)}"${attrs}>`}</label>`;

  function openDrawer(id) {
    const x = id ? byId(id) : null;
    openId = x ? x.id : null; delArmed = false;
    draft = x || upgrade({ id: 0, status: 'new', type: F.type || 'translation', market: F.mk || get('qat:lastmk') || 'VN', cat: F.cat || get('qat:lastcat') || 'context', priority: 'medium', assignee: me, reporter: me, summary: '', screen: get('qat:lastscreen') || '' });
    renderDrawer();
    $('#scrim').hidden = false; $('#drawer').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const s = $('#drawer [name=summary]'); if (s && !x) s.focus(); else { const c = $('#drawer [data-g=dclose]'); if (c) c.focus(); } }, 30);
    if (x) history.replaceState(null, '', '#' + keyOf(x));
  }
  function closeDrawer() {
    if ($('#drawer').hidden) return;
    $('#scrim').hidden = true; $('#drawer').hidden = true; document.body.style.overflow = '';
    openId = null; draft = null;
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    render();
  }
  function renderDrawer() {
    const x = draft, isNew = !openId;
    const btn = (act, key, alt) => `<button class="step${alt ? ' alt' : ''}" type="button" data-act="${act}">${T(key)}</button>`;
    const flow = isNew ? '' : x.status === 'new' ? btn('selffix', 'b_selffix') + btn('report', 'b_report', 1)
      : x.status === 'reported' ? btn('waiting', 'b_waiting', 1) + btn('devfixed', 'b_devfixed')
      : x.status === 'waiting' ? btn('devfixed', 'b_devfixed')
      : x.status === 'fixed' ? btn('checked', 'b_checked') + btn('reopen', 'b_reopen', 1) : btn('reopen', 'b_reopen', 1);
    const tk = x.ticket && /^https?:\/\//.test(x.ticket) ? ` <a href="${esc(x.ticket)}" target="_blank" rel="noopener">↗</a>` : '';
    const feed = actTab === 'comments'
      ? (x.comments.length ? x.comments.slice().reverse().map(c => `<div class="ev">${avatar(c.by)}<div><small><b>${esc(c.by)}</b> · ${fmt(c.t)}</small><p class="cbody">${esc(c.text)}</p></div></div>`).join('') : `<p class="mut">${T('none')}</p>`)
      : (x.history.length ? x.history.slice().reverse().map(h => `<div class="ev">${avatar(h.by)}<div><small><b>${esc(h.by)}</b> · ${fmt(h.t)}</small><p>${esc(histText(h))}</p></div></div>`).join('') : `<p class="mut">${T('none')}</p>`);
    const people = [...new Set([me, 'Dev', '중계팀', ...data.items.map(i => i.assignee), ...data.items.map(i => i.reporter)].filter(Boolean))];
    $('#drawer').innerHTML = `
      <div class="dhead">${typeIcon(x)}<b id="dtitle" class="ikey">${isNew ? esc(TP('create')) : esc(keyOf(x))}</b>${isNew ? '' : badge(x.status)}
        <div class="sp">${isNew ? `<button class="pri" type="button" data-g="dsave">${T('save')}</button>` : `<button class="ghost" type="button" data-g="dcopy">${T('copylink')}</button>`}
          <button class="ghost" type="button" data-g="dclose" aria-label="${esc(TP('close'))}">✕</button></div></div>
      <form class="dbody" id="dform" onsubmit="return false">
        <div class="dmain">
          <input class="sumin" name="summary" value="${esc(x.summary)}" placeholder="${esc(TP('f_summary'))}" aria-label="${esc(TP('f_summary'))}">
          ${flow ? `<div class="flow">${flow}${warnLine(x)}</div>` : ''}
          <div class="sec"><h4>${T('sec_trans')}</h4>
            ${fld('ko', 'f_ko', x.ko, 2, ' lang="ko"')}
            <div class="g2">${fld('before', 'f_before', x.before, 2, ' lang="vi"')}${fld('after', 'f_after', x.after, 2, ' lang="vi"')}</div>
            ${fld('key', 'f_key', x.key, 0, ' placeholder="match_end_title"')}</div>
          <div class="sec"><h4>${T('sec_bug')}</h4>
            ${fld('desc', 'f_desc', x.desc, 3)}${fld('steps', 'f_steps', x.steps, 3, ' placeholder="1. …&#10;2. …"')}
            <div class="g2">${fld('actual', 'f_actual', x.actual, 2)}${fld('expected', 'f_expected', x.expected, 2)}</div>
            ${fld('note', 'f_note', x.note, 3)}</div>
          ${isNew ? '' : `<div class="sec"><h4>${T('sec_activity')}</h4>
            <div class="tabs2" role="tablist"><button type="button" role="tab" data-g="acttab" data-v="comments" aria-selected="${actTab === 'comments'}">${T('comments')} (${x.comments.length})</button>
              <button type="button" role="tab" data-g="acttab" data-v="history" aria-selected="${actTab === 'history'}">${T('history')} (${x.history.length})</button></div>
            ${actTab === 'comments' ? `<textarea id="cmt" rows="2" placeholder="${esc(TP('addcomment'))}" aria-label="${esc(TP('comments'))}"></textarea><div class="acts"><button class="ghost" type="button" data-g="addcmt">${T('send')}</button></div>` : ''}
            <div class="feed">${feed}</div></div>`}
        </div>
        <div class="dside">
          <div class="sec"><h4>${T('sec_details')}</h4>
            ${isNew ? '' : `<label><span>${T('f_status')}</span>${sel('status', STATUSES, 'st_', x.status)}</label>`}
            <label><span>${T('f_type')}</span>${sel('type', TYPES, 't_', x.type)}</label>
            <label><span>${T('f_priority')}</span>${sel('priority', PRIORITIES, 'p_', x.priority)}</label>
            <label><span>${T('f_severity')}</span>${sel('severity', SEVERITIES, 'sev_', x.severity)}</label>
            <label><span>${T('f_market')}</span>${sel('market', MARKETS, 'mk_', x.market)}</label>
            <label><span>${T('f_cat')}</span>${sel('cat', CATS, 'c_', x.cat)}</label>
            ${fld('assignee', 'f_assignee', x.assignee, 0, ' list="people"')}${fld('reporter', 'f_reporter', x.reporter, 0, ' list="people"')}
            ${fld('labels', 'f_labels', x.labels.join(', '), 0)}
            ${fld('screen', 'f_screen', x.screen, 0, ' list="screens"')}
            <label><span>${T('f_ticket')}${tk}</span><input name="ticket" value="${esc(x.ticket)}" placeholder="LS-123 / https://…"></label></div>
          <div class="sec"><h4>${T('sec_env')}</h4>
            ${fld('os', 'f_os', x.os, 0, ' list="oslist"')}${fld('build', 'f_build', x.build, 0, ' placeholder="41.8"')}${fld('device', 'f_device', x.device, 0)}</div>
          ${isNew ? '' : `<p class="metaline">${esc(TV('f_created'))}: ${fmt(x.created)}<br>${esc(TV('f_updated'))}: ${fmt(x.updated || x.created)}${x.reportedAt ? `<br>📨 ${fmt(x.reportedAt)}` : ''}${x.fixedAt ? `<br>🛠 ${fmt(x.fixedAt)}${x.fixedBy === 'dev' ? ' · ' + esc(TV('by_dev')) : ''}` : ''}</p>
            <button class="ghost danger" type="button" data-g="ddel">${T(delArmed ? 'del2' : 'del')}</button>`}
        </div>
      </form>
      <datalist id="people">${people.map(p => `<option value="${esc(p)}">`).join('')}</datalist>
      <datalist id="screens">${[...new Set(data.items.map(i => i.screen).filter(Boolean))].slice(0, 300).map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      <datalist id="oslist"><option value="iOS"><option value="Android"><option value="iOS, Android"></datalist>`;
  }
  function histText(h) {
    if (h.f === 'created') return lang === 'ko' ? '이슈 생성' : 'Tạo issue';
    const lbl = { status: 'f_status', type: 'f_type', priority: 'f_priority', severity: 'f_severity', market: 'f_market', cat: 'f_cat', assignee: 'f_assignee', summary: 'f_summary' }[h.f];
    const name = lbl ? TV(lbl) : h.f;
    const val = v => { if (!v) return '—'; if (h.f === 'status') return TV('st_' + v); if (h.f === 'priority') return (S['p_' + v] || [v])[0]; if (h.f === 'type') return TV('t_' + v); if (h.f === 'cat') return TV('c_' + v); return trunc(v, 60); };
    return `${name}: ${val(h.from)} → ${val(h.to)}`;
  }
  // Đọc giá trị từ form vào issue; với issue đã có thì ghi lịch sử những trường quan trọng
  function readForm(x, track) {
    const f = $('#dform'); if (!f || !x) return false;
    const val = n => f.elements[n] ? f.elements[n].value.trim().normalize('NFC') : x[n];
    let changed = false;
    FIELDS_TEXT.concat(FIELDS_SEL).forEach(n => {
      if (!f.elements[n]) return;
      const v = val(n);
      if (v !== (x[n] ?? '')) { if (track && TRACKED.includes(n)) log(x, n, x[n], v); x[n] = v; changed = true; }
    });
    const labels = val('labels').split(',').map(s => s.trim()).filter(Boolean);
    if (labels.join('|') !== x.labels.join('|')) { x.labels = labels; changed = true; }
    if (f.elements.status && f.elements.status.value !== x.status) { setStatus(x, f.elements.status.value); changed = true; }
    if (changed && track) x.updated = Date.now();
    return changed;
  }
  function createFromDraft() {
    const x = draft; readForm(x, false);
    if (!x.summary) x.summary = autoSummary(x);
    if (!x.summary) { toast(TP('need')); return; }
    x.id = data.nextId++; x.created = Date.now(); x.updated = x.created;
    x.history = [{ t: x.created, by: me, f: 'created', from: '', to: '' }];
    data.items.push(x);
    set('qat:lastcat', x.cat); set('qat:lastmk', x.market); set('qat:lastscreen', x.screen);
    save(); renderFilters();
    openDrawer(x.id);
    toast(tp(`Đã tạo ${keyOf(x)}`, `${keyOf(x)} 생성됨`));
  }
  function saveAndClose() { if (openId) { const x = byId(openId); if (x && readForm(x, true)) save(); } closeDrawer(); }

  /* ---------- Thông báo + hoàn tác ---------- */
  let undoBuf = null, toastT = 0;
  function toast(msg, undo) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button class="ghost" type="button" data-g="undo">${T('undo')}</button>` : ''}`;
    el.hidden = false; clearTimeout(toastT);
    toastT = setTimeout(() => { el.hidden = true; undoBuf = null; }, undo ? 10000 : 2500);
  }
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
  function exportJSON() { if (saveT) flush(); download(`vi-qa-tracker-${todayKey()}.json`, JSON.stringify({ app: 'vi-qa-tracker', version: 2, exported: new Date().toISOString(), ...data }, null, 2), 'application/json'); }
  function exportCSV() {
    const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const head = ['Key', 'Loại', 'Tóm tắt', 'Thị trường', 'Ưu tiên', 'Mức độ', 'Trạng thái', 'Người xử lý', 'Người báo', 'Nhãn', 'Loại lỗi', 'Màn hình', 'Mã chuỗi', 'Câu Hàn gốc', 'Bản Việt lỗi', 'Bản Việt sửa', 'Mô tả', 'Các bước tái hiện', 'Thực tế', 'Mong đợi', 'OS', 'Build', 'Thiết bị', 'Ticket', 'Ghi chú', 'Ngày tạo', 'Cập nhật'];
    const rows = [...data.items].sort((a, b) => a.id - b.id).map(x => [keyOf(x), S['t_' + x.type][0], x.summary, x.market, S['p_' + x.priority][0], x.severity, S['st_' + x.status][0], x.assignee, x.reporter, x.labels.join(', '), S['c_' + x.cat][0], x.screen, x.key, x.ko, x.before, x.after, x.desc, x.steps, x.actual, x.expected, x.os, x.build, x.device, x.ticket, x.note, x.created ? fmt(x.created) : '', fmt(x.updated || x.created)]);
    download(`vi-qa-tracker-${todayKey()}.csv`, '\uFEFF' + [head, ...rows].map(r => r.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  $('#impf').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result);
        if (!d || d.app !== 'vi-qa-tracker' || !Array.isArray(d.items)) throw new Error('format');
        const ids = new Map(data.items.map(x => [x.id, x]));
        let added = 0, upd = 0, removed = 0;
        // File nhập theo lô (batch): gỡ issue cũ của lô này mà chị chưa đụng vào và không còn trong file mới
        if (d.batch) {
          const keep = new Set(d.items.map(x => x && x.created));
          const untouched = x => (x.updated || x.created) === x.created;
          const oldOfBatch = x => x.batch === d.batch || (!x.batch && /^\[Nguồn:/.test(x.note || ''));
          const before = data.items.length;
          data.items = data.items.filter(x => !(oldOfBatch(x) && untouched(x) && !keep.has(x.created)));
          removed = before - data.items.length;
          ids.clear(); data.items.forEach(x => ids.set(x.id, x));
        }
        // Nhận ra issue đã có theo thời điểm tạo (created), không theo số
        const byCreated = new Map(data.items.map(x => [x.created, x]));
        let next = Math.max(data.nextId, d.nextId || 0, ...data.items.map(x => x.id + 1), ...d.items.map(x => (x && x.id || 0) + 1), 1);
        d.items.forEach(x => {
          if (!x || !x.id) return;
          const same = x.created && byCreated.get(x.created);
          if (same) {
            if ((x.updated || x.created || 0) > (same.updated || same.created || 0)) { Object.assign(same, upgrade(x), { id: same.id }); upd++; }
            return;
          }
          if (ids.has(x.id)) x.id = next++;
          upgrade(x); ids.set(x.id, x); byCreated.set(x.created, x); added++;
        });
        data.items = [...ids.values()];
        data.nextId = Math.max(next, ...data.items.map(x => x.id + 1));
        save(); renderFilters(); render();
        $('#bmsg').textContent = tp(`Đã nhập: ${added} issue mới, ${upd} cập nhật${removed ? `, gỡ ${removed} issue cũ không còn trong file` : ''}.`, `가져오기: 신규 ${added}건, 업데이트 ${upd}건${removed ? `, 이전 항목 ${removed}건 제거` : ''}`);
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
  document.addEventListener('click', e => {
    const card = e.target.closest('#view .card, #view tbody tr[data-id]');
    if (card && !e.target.closest('[data-g]')) { openDrawer(+card.dataset.id); return; }
    const a = e.target.closest('#drawer [data-act]');
    if (a && openId) {
      const x = byId(openId); readForm(x, true);
      const act = a.dataset.act;
      if (act === 'selffix') setStatus(x, 'fixed', 'admin');
      else if (act === 'report') setStatus(x, 'reported');
      else if (act === 'waiting') setStatus(x, 'waiting');
      else if (act === 'devfixed') setStatus(x, 'fixed', 'dev');
      else if (act === 'checked') setStatus(x, 'checked');
      else if (act === 'reopen') setStatus(x, 'new');
      save(); draft = x; renderDrawer(); return;
    }
    const b = e.target.closest('[data-g]'); if (!b) return;
    const g = b.dataset.g, v = b.dataset.v;
    const reset = () => { Object.keys(F).forEach(k => { F[k] = ''; }); $('#q').value = ''; };
    if (g === 'view') { view = v; set('qat:view', view); render(); }
    else if (g === 'lang') { lang = v; set('qat:lang', lang); applyStatic(); render(); if (draft) renderDrawer(); }
    else if (g === 'theme') { theme = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto'; set('qat:theme', theme); applyTheme(); }
    else if (g === 'create') openDrawer(null);
    else if (g === 'quick') { F.quick = F.quick === v ? '' : v; render(); }
    else if (g === 'unstatus') { F.status = ''; render(); }
    else if (g === 'clearf') { reset(); renderFilters(); render(); }
    else if (g === 'sort') { sort = sort.k === v ? { k: v, dir: -sort.dir } : { k: v, dir: v === 'updated' || v === 'key' ? -1 : 1 }; renderList(); }
    else if (g === 'kpi') { reset(); if (v !== 'all') F.quick = v; view = 'list'; renderFilters(); render(); }
    else if (g === 'dstatus') { reset(); F.status = v; view = 'list'; renderFilters(); render(); }
    else if (g === 'dpri') { reset(); F.pri = v; F.quick = 'open'; view = 'list'; renderFilters(); render(); }
    else if (g === 'dmk') { reset(); F.mk = v; F.quick = 'open'; view = 'list'; renderFilters(); render(); }
    else if (g === 'dcat') { reset(); F.cat = v; F.quick = 'open'; view = 'list'; renderFilters(); render(); }
    else if (g === 'copysum') copy(summaryKo(), b);
    else if (g === 'dclose') saveAndClose();
    else if (g === 'dsave') createFromDraft();
    else if (g === 'dcopy') { const x = byId(openId); if (x) copy(keyOf(x) + ' ' + x.summary, b); }
    else if (g === 'acttab') { const x = byId(openId); if (x) { readForm(x, true); actTab = v; draft = x; renderDrawer(); } }
    else if (g === 'addcmt') addComment();
    else if (g === 'ddel') {
      if (!delArmed) { delArmed = true; renderDrawer(); setTimeout(() => { if (delArmed && openId) { delArmed = false; renderDrawer(); } }, 4000); return; }
      const x = byId(openId); data.items = data.items.filter(i => i.id !== openId); undoBuf = x; save();
      closeDrawer(); toast(tp(`Đã xóa ${keyOf(x)}`, `${keyOf(x)} 삭제됨`), true);
    }
    else if (g === 'undo') { if (undoBuf) { data.items.push(undoBuf); undoBuf = null; save(); render(); } $('#toast').hidden = true; }
    else if (g === 'export') { exportJSON(); $('#bmsg').textContent = tp('Đã xuất file JSON.', 'JSON을 내보냈습니다.'); }
    else if (g === 'csv') exportCSV();
  });
  function addComment() {
    const ta = $('#cmt'), x = byId(openId); if (!ta || !x) return;
    const text = ta.value.trim().normalize('NFC'); if (!text) return;
    readForm(x, true);
    x.comments.push({ t: Date.now(), by: me, text }); x.updated = Date.now();
    save(); draft = x; renderDrawer();
  }
  $('#scrim').addEventListener('click', saveAndClose);
  // Issue đã có: lưu ngay khi đổi một trường (giống công cụ quản lý issue)
  $('#drawer').addEventListener('change', e => {
    if (!openId || !e.target.name) return;
    const x = byId(openId);
    if (readForm(x, true)) { save(); if (e.target.name === 'status') { draft = x; renderDrawer(); } }
  });
  document.addEventListener('keydown', e => {
    const ae = document.activeElement || {};
    const typing = /INPUT|TEXTAREA|SELECT/.test(ae.tagName || '');
    const drawerOpen = !$('#drawer').hidden;
    if (e.key === 'Escape' && drawerOpen) saveAndClose();
    else if ((e.key === 'c' || e.key === 'C') && !typing && !drawerOpen && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openDrawer(null); }
    else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && drawerOpen) { e.preventDefault(); if (ae.id === 'cmt') addComment(); else if (!openId) createFromDraft(); }
    else if (e.key === 'Enter' && ae.matches && ae.matches('#view tbody tr[data-id]')) openDrawer(+ae.dataset.id);
  });
  $('#q').addEventListener('input', e => { F.q = e.target.value.trim().toLowerCase().normalize('NFC'); render(); });
  [['#f_type', 'type'], ['#f_mk', 'mk'], ['#f_pri', 'pri'], ['#f_cat', 'cat'], ['#f_as', 'as']].forEach(([s, k]) => $(s).addEventListener('change', e => { F[k] = e.target.value; render(); }));
  $('#s_key').addEventListener('change', e => { projKey = e.target.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'VNQA'; e.target.value = projKey; set('qat:pkey', projKey); render(); });
  $('#s_me').addEventListener('change', e => { me = e.target.value.trim() || 'Leo'; set('qat:me', me); render(); });

  // Kéo thả thẻ giữa các cột của board để đổi trạng thái
  let dragId = null;
  $('#view').addEventListener('dragstart', e => { const c = e.target.closest('.card'); if (!c) return; dragId = +c.dataset.id; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragId)); });
  $('#view').addEventListener('dragend', e => { const c = e.target.closest('.card'); if (c) c.classList.remove('dragging'); document.querySelectorAll('.col.over').forEach(c2 => c2.classList.remove('over')); });
  $('#view').addEventListener('dragover', e => { const col = e.target.closest('.col'); if (!col || dragId == null) return; e.preventDefault(); document.querySelectorAll('.col.over').forEach(c => { if (c !== col) c.classList.remove('over'); }); col.classList.add('over'); });
  $('#view').addEventListener('drop', e => {
    const col = e.target.closest('.col'); if (!col || dragId == null) return; e.preventDefault();
    const x = byId(dragId); dragId = null;
    if (x && x.status !== col.dataset.st) { setStatus(x, col.dataset.st); save(); toast(tp(`${keyOf(x)} → ${S['st_' + x.status][0]}`, `${keyOf(x)} → ${S['st_' + x.status][1]}`)); }
    render();
  });

  // Mở 2 tab cùng lúc: tab kia lưu thì tab này cập nhật
  window.addEventListener('storage', e => { if (e.key === KEY && $('#drawer').hidden) { data = load(); renderFilters(); render(); } });
  // Cập nhật nhắc "kiểm tra lại" mỗi phút
  setInterval(() => { if ($('#drawer').hidden && data.items.some(x => x.status === 'fixed')) render(); }, 60000);

  applyStatic();
  $('#sync').textContent = tp(`Dữ liệu lưu trên trình duyệt này · ${data.items.length} issue`, `이 브라우저에 저장됨 · 이슈 ${data.items.length}건`);
  render();
  // Mở thẳng issue từ đường link #VNQA-12
  const m = /^#([A-Z0-9]+)-(\d+)$/.exec(location.hash);
  if (m && byId(+m[2])) openDrawer(+m[2]);
})();
