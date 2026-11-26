// Company and department targets for the year, with weekly results keyed in by the GM or Management.
// The year's target is spread over the weeks that are left: a short week carries its gap forward
// onto the remaining weeks, a strong week lowers what is still needed. Speed = earned ÷ where we
// should be by today.

export const TARGET_DEPTS = [['clientservice', 'Client Service'], ['creative', 'Creative'], ['operations', 'Operations'], ['production', 'Printing']];

// ISO weeks: weeks start on Monday; week 1 holds the year's first Thursday.
export function isoWeek(d = new Date()) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const y = x.getUTCFullYear(), start = new Date(Date.UTC(y, 0, 1));
  return { year: y, week: Math.ceil(((x - start) / 864e5 + 1) / 7) };
}
export function weeksInYear(y) {
  const jan1 = new Date(Date.UTC(y, 0, 1)).getUTCDay(), leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return jan1 === 4 || (leap && jan1 === 3) ? 53 : 52;
}
export const weekKey = (y, w) => y + '-W' + String(w).padStart(2, '0');
// Monday of an ISO week, and the month its Thursday falls in (the week's month).
function weekMonday(y, w) { const jan4 = new Date(Date.UTC(y, 0, 4)); const d = (jan4.getUTCDay() || 7) - 1; const m = new Date(jan4); m.setUTCDate(jan4.getUTCDate() - d + (w - 1) * 7); return m; }
export function weekMonth(y, w) { const t = weekMonday(y, w); t.setUTCDate(t.getUTCDate() + 3); return t.getUTCMonth() + 1; }
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const short = d => d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
export function weekLabel(y, w) { const m = weekMonday(y, w), s = new Date(m); s.setUTCDate(m.getUTCDate() + 6); return short(m) + ' – ' + short(s); }

// TZS in a compact form: 2.4B, 45.2M, 850K.
export function tzs(v) {
  const a = Math.abs(v || 0), s = v < 0 ? '−' : '';
  if (a >= 1e9) return s + 'TZS ' + (a / 1e9).toFixed(a >= 1e10 ? 1 : 2).replace(/\.?0+$/, '') + 'B';
  if (a >= 1e6) return s + 'TZS ' + (a / 1e6).toFixed(a >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'M';
  if (a >= 1e3) return s + 'TZS ' + Math.round(a / 1e3) + 'K';
  return s + 'TZS ' + Math.round(a);
}

// The rolling plan for one target (company, a department or projects), given what each week brought in.
export function plan(total, perWeek, year, W, cur, dayFrac) {
  const before = k => { let a = 0; for (let i = 1; i < k; i++) a += perWeek(i) || 0; return a; };
  const weekTarget = k => Math.max(0, (total - before(k)) / (W - k + 1));
  const earned = before(cur + 1);
  const expected = total * dayFrac;
  const pace = expected > 0 ? Math.round(earned / expected * 100) : 0;
  return { total, earned, expected, pace, weekTarget, before, base: total / W };
}

export const targetMethods = {
  targetFor(year) { return (this.state.targets || []).find(t => t.year === year) || null; },
  canSetTargets() { return ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
  // Client Service sees targets but does not record them.
  canRecordWeek() { return this.isTop() && (this.state.role || 'ceo') !== 'clientservice'; },
  saveTargets(f) {
    if (!this.canSetTargets()) return 'Only Management or the General Manager sets the targets';
    const year = +f.year, revenue = Math.round(+f.revenue || 0);
    if (!revenue) return 'Enter the company target for the year';
    const depts = {}; TARGET_DEPTS.forEach(([k]) => { const v = Math.round(+(f.depts || {})[k] || 0); if (v) depts[k] = v; });
    const sum = Object.values(depts).reduce((a, b) => a + b, 0);
    if (sum > revenue) return 'Department targets add up to more than the company target';
    const old = this.targetFor(year) || { id: 'T' + year, year, weeks: {} };
    const t = Object.assign({}, old, { revenue, projects: Math.round(+f.projects || 0), depts, setBy: this.me().k, setAt: new Date().toISOString().slice(0, 10) });
    this.setState(x => ({ targets: [...(x.targets || []).filter(y => y.year !== year), t] }));
    this.log('target', 'purple', 'Targets set for ' + year, tzs(revenue));
    this.toast('Targets saved · ' + year + ' · ' + tzs(revenue));
    return '';
  },
  // The Client Service Manager (or Management) gives each team member their targets for the year.
  canSetTeamTargets() { const r = this.state.role || 'ceo'; return r === 'ceo' || r === 'gm' || (r === 'clientservice' && this.isManagerOf('clientservice')); },
  saveTeamTargets(year, map) {
    if (!this.canSetTeamTargets()) return 'The Client Service Manager sets the team’s targets';
    const t = this.targetFor(year);
    if (!t) return 'Management sets the year’s targets first';
    const people = {};
    Object.keys(map || {}).forEach(k => { const m = map[k] || {}; const v = { revenue: Math.round(+m.revenue || 0), projects: Math.round(+m.projects || 0), clients: Math.round(+m.clients || 0), proposals: Math.round(+m.proposals || 0) }; if (v.revenue || v.projects || v.clients || v.proposals) people[k] = v; });
    const sum = Object.values(people).reduce((a, b) => a + b.revenue, 0), dept = (t.depts || {}).clientservice || 0;
    if (dept && sum > dept) return 'The team’s revenue targets add up to more than the Client Service target (' + tzs(dept) + ')';
    this.setState(x => ({ targets: (x.targets || []).map(y => y.year === year ? Object.assign({}, y, { people }) : y) }));
    Object.keys(people).filter(k => k !== this.me().k).forEach(k => this.remind(k, 'Your targets for ' + year + ' are set', 'today', 'chart', tzs(people[k].revenue) + ' · ' + people[k].projects + ' projects · ' + people[k].clients + ' clients · ' + people[k].proposals + ' proposals'));
    this.toast('Team targets saved');
    return '';
  },
  // What one person brought in this year, counted from their work in the system.
  // Won projects count towards the company goal as soon as their agreed value is in: the value lands in
  // the week the project was won (its start date), on top of what the GM records for that week.
  projectValue(p) { return (p.budget && +p.budget.value) || (+p.val || 0) * 1e6; },
  wonByWeek(year) {
    const out = { weeks: {}, list: [] };
    (this.state.projects || []).forEach(p => {
      const v = this.projectValue(p), d = p.at ? new Date(p.at) : null;
      if (!v || !d || isNaN(d) || p.st === 'lost' || p.st === 'cancelled') return;
      const w = isoWeek(d); if (w.year !== year) return;
      out.weeks[w.week] = (out.weeks[w.week] || 0) + v;
      out.list.push({ id: p.id, name: p.name || p.id, client: p.client || '', v, at: p.at, week: w.week });
    });
    out.list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return out;
  },
  personResults(k, year) {
    const s = this.state, inYear = d => !d || String(d).slice(0, 4) === String(year);
    const projects = (s.projects || []).filter(p => p.cs === k && inYear(p.at));
    const revenue = projects.reduce((a, p) => a + ((p.budget && p.budget.value) || (p.val || 0) * 1e6), 0);
    const clients = (s.customers || []).filter(c => c.owner === k && inYear(c.at)).length;
    const props = new Set();
    (s.leads || []).forEach(l => { if (l.proposal && l.proposal.by === k && inYear(l.proposal.at)) props.add('L' + l.id); });
    (s.projects || []).forEach(p => { if (p.proposal && p.proposal.by === k && inYear(p.proposal.at)) props.add('P' + p.id); });
    return { revenue, projects: projects.length, clients, proposals: props.size };
  },
  recordWeek(year, week, f) {
    if (!this.canRecordWeek()) return 'The GM or Management records the week';
    const t = this.targetFor(year);
    if (!t) return 'Set the year’s targets first';
    const depts = {}; let deptSum = 0;
    TARGET_DEPTS.forEach(([k]) => { const v = Math.round(+(f.depts || {})[k] || 0); if (v) { depts[k] = v; deptSum += v; } });
    const amt = Math.round(+f.amt || 0) || deptSum;
    if (!amt && !(+f.projects)) return 'Enter what was earned or the projects completed this week';
    if (deptSum > amt) return 'The departments add up to more than the week’s total';
    const k = weekKey(year, week);
    const weeks = Object.assign({}, t.weeks || {}, { [k]: { amt, projects: Math.max(0, Math.round(+f.projects || 0)), depts, note: (f.note || '').trim(), by: this.me().k, at: new Date().toISOString().slice(0, 16).replace('T', ' ') } });
    this.setState(x => ({ targets: (x.targets || []).map(y => y.year === year ? Object.assign({}, y, { weeks }) : y) }));
    // Management hears when the GM records a week.
    if ((this.state.role || 'ceo') !== 'ceo') this.remind(this.ROLES.ceo.k, 'Week ' + week + ' results recorded', 'dashboard', 'chart', tzs(amt) + ' earned · ' + (+f.projects || 0) + ' projects completed');
    this.toast('Week ' + week + ' saved · ' + tzs(amt));
    return '';
  }
};

function personRows(year, t, dayFrac) {
  const people = t.people || {};
  const pace = (got, target) => (target ? Math.round(got / (target * (dayFrac || 1e-6)) * 100) : null);
  return this.teamOf('clientservice').map(k => {
    const a = this.av(k), tg = people[k] || {}, got = this.personResults(k, year);
    const m = (key, money) => ({ got: money ? tzs(got[key]) : got[key], target: tg[key] ? (money ? tzs(tg[key]) : tg[key]) : null, pct: tg[key] ? Math.min(100, Math.round(got[key] / tg[key] * 100)) : 0, pace: pace(got[key], tg[key]) });
    const paces = ['revenue', 'projects', 'clients', 'proposals'].map(x => pace(got[x], tg[x])).filter(x => x != null);
    const overall = paces.length ? Math.round(paces.reduce((x, y) => x + y, 0) / paces.length) : null;
    return { k, n: a.n, i: a.i, c: a.c, ph: a.ph, set: !!people[k], form: { revenue: tg.revenue || '', projects: tg.projects || '', clients: tg.clients || '', proposals: tg.proposals || '' }, revenue: m('revenue', true), projects: m('projects'), clients: m('clients'), proposals: m('proposals'), overall, status: overall == null ? '' : overall >= 100 ? 'ahead' : overall >= 90 ? 'close' : 'behind' };
  });
}

export function targetVals(s) {
  const role = s.role || 'ceo';
  // A Client Service team member sees their own targets on My work.
  const yr = isoWeek(new Date()).year, tt = this.targetFor(yr), meK = this.me().k;
  let MYT = null;
  if (tt && tt.people && tt.people[meK]) {
    const start = new Date(yr, 0, 1), end = new Date(yr + 1, 0, 1), frac = Math.min(1, Math.max(0, (new Date() - start) / (end - start)));
    MYT = personRows.call(this, yr, tt, frac).find(r => r.k === meK) || null;
    if (MYT) MYT = Object.assign({ year: yr }, MYT);
  }
  // Management and the GM run the targets; Client Service sees the company target and its own.
  if (!['ceo', 'gm', 'clientservice', 'pa'].includes(role)) return { TG: null, MYT };
  const cs = role === 'clientservice';
  const today = new Date(), { year, week: cur } = isoWeek(today), W = weeksInYear(year);
  const t = this.targetFor(year);
  const setForm = { year, revenue: t ? t.revenue : '', projects: t ? t.projects || '' : '', depts: t ? Object.assign({}, t.depts) : {} };
  const base = { year, week: cur, weeks: W, canSet: this.canSetTargets(), canRecord: this.canRecordWeek(), setForm, saveTargets: f => this.saveTargets(f), deptChoices: TARGET_DEPTS.map(([v, l]) => ({ v, l })) };
  if (!t) return { TG: Object.assign(base, { empty: true }), MYT };
  const start = new Date(year, 0, 1), end = new Date(year + 1, 0, 1);
  const dayFrac = Math.min(1, Math.max(0, (today - start) / (end - start)));
  const dayNo = Math.floor((today - start) / 864e5) + 1, daysLeft = Math.max(0, Math.ceil((end - today) / 864e5));
  const won = this.wonByWeek(year), typed = i => (t.weeks || {})[weekKey(year, i)];
  // A week's result = what the GM recorded + the agreed value of projects won that week.
  const wk = i => { const e = typed(i), w = won.weeks[i] || 0; if (!e && !w) return undefined; return Object.assign({ amt: 0, projects: 0, depts: {} }, e || {}, { amt: ((e && e.amt) || 0) + w, won: w, typed: (e && e.amt) || 0 }); };
  const co = plan(t.revenue, i => (wk(i) || {}).amt, year, W, cur, dayFrac);
  const thisWeek = wk(cur), weekTarget = co.weekTarget(cur), weekGot = thisWeek ? thisWeek.amt : 0;
  const carry = weekTarget - co.base;
  // Month: rolling over the months left, like the weeks.
  const m = today.getMonth() + 1;
  let beforeMonth = 0, monthGot = 0;
  for (let i = 1; i <= cur; i++) { const e = wk(i); if (!e) continue; const mm = weekMonth(year, i); if (mm < m) beforeMonth += e.amt; else if (mm === m) monthGot += e.amt; }
  const monthTarget = Math.max(0, (t.revenue - beforeMonth) / (12 - m + 1));
  const left = Math.max(0, t.revenue - co.earned), weeksLeft = Math.max(1, W - cur + (thisWeek ? 0 : 1));
  const projection = dayFrac > 0 ? co.earned / dayFrac : 0;
  const status = co.pace >= 100 ? 'ahead' : co.pace >= 90 ? 'close' : 'behind';
  // Last 12 weeks: what came in against what that week needed.
  const from = Math.max(1, cur - 11), bars = [];
  for (let i = from; i <= cur; i++) bars.push({ w: i, got: (wk(i) || {}).amt || 0, need: co.weekTarget(i), cur: i === cur, entered: !!wk(i) });
  const peak = Math.max(1, ...bars.map(b => Math.max(b.got, b.need)));
  const depts = TARGET_DEPTS.filter(([k]) => (t.depts || {})[k] && (!cs || k === 'clientservice')).map(([k, l]) => {
    const p = plan(t.depts[k], i => ((wk(i) || {}).depts || {})[k], year, W, cur, dayFrac);
    return { k, l, target: tzs(p.total), earned: tzs(p.earned), pct: Math.round(p.earned / p.total * 100), pace: p.pace, week: tzs(p.weekTarget(cur)), status: p.pace >= 100 ? 'ahead' : p.pace >= 90 ? 'close' : 'behind' };
  });
  let projDone = 0; for (let i = 1; i <= cur; i++) projDone += (wk(i) || {}).projects || 0;
  const projTarget = t.projects || 0, projPace = projTarget ? Math.round(projDone / (projTarget * dayFrac || 1) * 100) : 0;
  const closedInSystem = (s.projects || []).filter(p => this.flowOf(p) === 'closed' || p.st === 'done').length;
  const recent = []; for (let i = cur; i >= Math.max(1, cur - 5); i--) { const e = wk(i); recent.push({ w: i, label: weekLabel(year, i), entered: !!e, amt: e ? tzs(e.amt) : '—', projects: e ? e.projects : 0, need: tzs(co.weekTarget(i)), hit: e ? e.amt >= co.weekTarget(i) : false, by: e ? this.av(e.by).n : '' }); }
  return { TG: Object.assign(base, {
    empty: false,
    target: tzs(t.revenue), earned: tzs(co.earned), pctEarned: Math.round(co.earned / t.revenue * 100), pctTime: Math.round(dayFrac * 100),
    expected: tzs(co.expected), gap: tzs(Math.abs(co.earned - co.expected)), ahead: co.earned >= co.expected, pace: co.pace, status,
    dayNo, daysLeft, projection: tzs(projection),
    week: { n: cur, label: weekLabel(year, cur), target: tzs(weekTarget), got: thisWeek ? tzs(weekGot) : null, pct: weekTarget ? Math.min(100, Math.round(weekGot / weekTarget * 100)) : 0, carry: tzs(Math.abs(carry)), carried: carry > 0, base: tzs(co.base), hit: thisWeek ? weekGot >= weekTarget : false, over: tzs(Math.max(0, weekGot - weekTarget)) },
    month: { l: MONTHS[m - 1], target: tzs(monthTarget), got: tzs(monthGot), pct: monthTarget ? Math.min(100, Math.round(monthGot / monthTarget * 100)) : 0 },
    need: { perWeek: tzs(left / weeksLeft), weeksLeft, left: tzs(left) },
    bars: bars.map(b => Object.assign(b, { gotH: Math.round(b.got / peak * 100), needH: Math.round(b.need / peak * 100), gotT: tzs(b.got), needT: tzs(b.need) })),
    depts,
    won: { total: tzs(won.list.reduce((a, x) => a + x.v, 0)), n: won.list.length, list: won.list.slice(0, 6).map(x => ({ id: x.id, name: x.name, client: x.client, v: tzs(x.v), week: x.week })) },
    projects: { done: projDone, target: projTarget, pace: projPace, closed: closedInSystem },
    recent,
    record: (w, f) => this.recordWeek(year, w, f),
    team: personRows.call(this, year, t, dayFrac), canSetTeam: this.canSetTeamTargets(), saveTeam: map => this.saveTeamTargets(year, map),
    csTarget: (t.depts || {}).clientservice ? tzs(t.depts.clientservice) : '',
    weekChoices: [cur, cur - 1, cur - 2].filter(w => w >= 1).map(w => ({ w, l: w === cur ? 'This week' : w === cur - 1 ? 'Last week' : 'Week ' + w, sub: weekLabel(year, w), prev: wk(w) || null }))
  }), MYT };
}
