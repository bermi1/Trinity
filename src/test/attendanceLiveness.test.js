import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';
import { livenessCheck, makeChallenge, yawOf, LIVE_MS } from '../logic/face';
import { haversine, whereIs } from '../logic/attendance';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };
const box = (x = 200) => ({ x, y: 120, width: 160, height: 160 });
// Readings every 150 ms with the given head turns (0.5 = looking straight).
const seq = (yaws, step = 150, bx = () => box()) => yaws.map((yaw, i) => ({ t: i * step, yaw, box: bx(i) }));

describe('liveness challenge (pure logic)', () => {
  it('a still photo fails: the head turn never changes', () => {
    const photo = seq(Array.from({ length: 45 }, (_, i) => 0.5 + (i % 2 ? 0.01 : -0.01)));
    const r = livenessCheck(photo, ['left', 'right']);
    expect(r).toMatchObject({ ok: false, step: 0, fail: 'timeout' });
    // ...even when the photo is moved around in front of the camera (the nose stays between the cheeks).
    const moved = seq(Array.from({ length: 45 }, () => 0.52), 150, i => box(150 + i * 4));
    expect(livenessCheck(moved, ['right', 'left']).ok).toBe(false);
  });

  it('turning the head as asked, then looking straight, passes', () => {
    const left = seq([0.5, 0.5, 0.51, 0.56, 0.63, 0.66, 0.6, 0.5, 0.42, 0.35, 0.33, 0.4, 0.48, 0.5]);
    expect(livenessCheck(left, ['left', 'right'])).toMatchObject({ ok: true, step: 2, fail: '' });
    // Progress while it runs: first turn done, now the other way.
    expect(livenessCheck(left.slice(0, 6), ['left', 'right'])).toMatchObject({ ok: false, step: 1, need: 'right', fail: '' });
    // Then the head must come back to the centre.
    expect(livenessCheck(left.slice(0, 11), ['left', 'right'])).toMatchObject({ ok: false, step: 2, need: 'centre' });
  });

  it('the wrong order (a recorded video) does not pass', () => {
    const rightFirst = seq([0.5, 0.5, 0.5, 0.38, 0.34, 0.45, 0.5]);
    expect(livenessCheck(rightFirst, ['left', 'right'])).toMatchObject({ ok: false, step: 0 });
  });

  it('too slow fails, and a face that jumps (a picture swapped in) fails', () => {
    const slow = seq([0.5, 0.5, 0.5, 0.65, 0.65, 0.35, 0.5], 1200);
    expect(livenessCheck(slow, ['left', 'right'])).toMatchObject({ ok: false, fail: 'timeout' });
    expect(slow[slow.length - 1].t).toBeGreaterThan(LIVE_MS);
    const jump = seq([0.5, 0.5, 0.5, 0.65, 0.35, 0.5], 150, i => box(i === 3 ? 500 : 200));
    expect(livenessCheck(jump, ['left', 'right'])).toMatchObject({ ok: false, fail: 'jump' });
  });

  it('missing frames are skipped; no readings yet is still running', () => {
    expect(livenessCheck([], ['left', 'right'])).toMatchObject({ ok: false, step: 0, need: 'left', fail: '' });
    const r = seq([0.5, 0.5, 0.5, 0.65, 0.34, 0.5]); r.splice(2, 0, null);
    expect(livenessCheck(r, ['left', 'right']).ok).toBe(true);
  });

  it('random challenge order and head turn from face points', () => {
    expect(makeChallenge(() => 0.1)).toEqual(['left', 'right']);
    expect(makeChallenge(() => 0.9)).toEqual(['right', 'left']);
    const pts = Array.from({ length: 68 }, () => ({ x: 0, y: 0 }));
    pts[0] = { x: 100, y: 0 }; pts[16] = { x: 200, y: 0 }; pts[30] = { x: 150, y: 0 };
    expect(yawOf(pts)).toBeCloseTo(0.5);
    pts[30] = { x: 170, y: 0 };
    expect(yawOf(pts)).toBeCloseTo(0.7);
    expect(yawOf([])).toBeNull();
  });
});

describe('office location (geofence)', () => {
  const office = { name: 'Office', lat: -6.7924, lng: 39.2083, r: 150 };
  const north = m => ({ lat: office.lat + m / 111195, lng: office.lng });

  it('haversine distance in metres', () => {
    expect(haversine(office, office)).toBe(0);
    expect(haversine(office, north(1000))).toBeGreaterThan(995);
    expect(haversine(office, north(1000))).toBeLessThan(1005);
  });

  it('inside, outside, GPS accuracy and vague fixes', () => {
    expect(whereIs(Object.assign(north(80), { acc: 20 }), [office])).toMatchObject({ inside: true, site: 'Office', dist: 80, acc: 20 });
    expect(whereIs(Object.assign(north(400), { acc: 30 }), [office])).toMatchObject({ inside: false, dist: 400 });
    // 220 m away, ±100 m: could be inside, so it counts.
    expect(whereIs(Object.assign(north(220), { acc: 100 }), [office]).inside).toBe(true);
    // Too vague: refused even if the middle is on the office.
    expect(whereIs(Object.assign(north(0), { acc: 1500 }), [office])).toMatchObject({ inside: false, vague: true });
    // The nearest of several sites.
    const wh = { name: 'Warehouse', lat: -6.85, lng: 39.25, r: 300 };
    expect(whereIs({ lat: -6.8501, lng: 39.2501, acc: 10 }, [office, wh])).toMatchObject({ inside: true, site: 'Warehouse' });
    expect(whereIs(null, [office])).toMatchObject({ known: false, inside: false });
  });
});

describe('clock() with liveness and the office location', () => {
  const office = { name: 'Office', lat: -6.7924, lng: 39.2083, r: 150 };
  const at = (m, acc = 15) => ({ lat: office.lat + m / 111195, lng: office.lng, acc });

  it('Management sets the office sites; staff cannot', () => {
    const s = app('staff');
    expect(s.saveSite(null, office)).toMatch(/Management or the GM/);
    const c = app('ceo');
    expect(c.saveSite(null, { name: 'Office', lat: 'x', lng: '39', r: 150 })).toMatch(/latitude/);
    expect(c.saveSite(null, { name: 'Office', lat: '-6.7924', lng: '39.2083', r: '' })).toBe('');
    expect(c.state.company.sites).toEqual([{ name: 'Office', lat: -6.7924, lng: 39.2083, r: 150 }]);
    expect(c.todayVals(c.state).CO.sites.sites).toHaveLength(1);
    c.siteVals().add({ name: 'Warehouse', lat: -6.85, lng: 39.25, r: 300 });
    expect(c.officeSites().map(x => x.name)).toEqual(['Office', 'Warehouse']);
    c.siteVals().sites[1].remove();
    expect(c.officeSites()).toHaveLength(1);
    const g = app('gm');
    expect(g.attendanceVals(g.state).ATT.SITES).toMatchObject({ can: true });
    expect(app('reception').attendanceVals(app('reception').state).ATT.SITES).toBeNull();
  });

  it('own phone: refused without live, without location, outside or too vague; allowed inside', () => {
    const a = app('staff'), me = a.me().k;
    a.setCompany({ sites: [office] });
    expect(a.clock(me, '', { face: true, loc: at(10) })).toEqual({ error: expect.stringMatching(/really you/) });
    expect(a.clock(me, '', { face: true, live: true })).toEqual({ error: expect.stringMatching(/location/) });
    expect(a.clock(me, '', { face: true, live: true, loc: at(2000) })).toEqual({ error: expect.stringMatching(/2.0 km from Office/) });
    expect(a.clock(me, '', { face: true, live: true, loc: at(0, 1500) })).toEqual({ error: expect.stringMatching(/too vague.*GPS/) });
    expect(a.attendanceOf(me)).toBeNull();
    expect(a.clock(me, 'data:p', { face: true, live: true, loc: at(60, 25) })).toMatchObject({ kind: 'in', site: 'Office', away: false });
    expect(a.attendanceOf(me)).toMatchObject({ how: 'face-self', live: true, site: 'Office', dist: 60, acc: 25, away: false, inPhoto: 'data:p' });
    // Check-out from home is refused too.
    expect(a.clock(me, '', { face: true, live: true, loc: at(5000) })).toHaveProperty('error');
    expect(a.clock(me, '', { face: true, live: true, loc: at(20) })).toMatchObject({ kind: 'out' });
    expect(a.attendanceOf(me)).toMatchObject({ liveOut: true, outSite: 'Office', outAway: false });
  });

  it('field staff may check in away: allowed, recorded as away and flagged for the GM', () => {
    const g = app('gm');
    g.setCompany({ sites: [office] });
    const staffK = app('staff').me().k;
    expect(app('staff').setAwayOk(staffK, true)).toBe('Not allowed');
    expect(g.setAwayOk(staffK, true)).toBe('');
    const a = app('staff'); a.setState({ company: g.state.company });
    const r = a.clock(staffK, '', { face: true, live: true, loc: at(3000, 40) });
    expect(r).toMatchObject({ kind: 'in', away: true });
    expect(a.attendanceOf(staffK)).toMatchObject({ away: true, site: '', dist: 3000, acc: 40, live: true });
    expect(a.attendanceOf(staffK).lat).toBeCloseTo(at(3000).lat, 4);
    a.setState({ role: 'gm' });
    const A = a.attendanceVals(a.state).ATT, e = A.feed.find(x => x.k === staffK);
    expect(e).toMatchObject({ how: 'Own phone', live: true, away: true, place: expect.stringMatching(/^away · -6\.76/), map: expect.stringMatching(/google\.com\/maps\?q=/) });
    expect(A.people.find(p => p.k === staffK)).toMatchObject({ away: true, mayAway: true });
    expect(A.counts.away).toBe(1);
  });

  it('no office set: allowed anywhere, place recorded when known', () => {
    const a = app('staff'), me = a.me().k;
    expect(a.clock(me, '', { face: true, live: true, loc: at(9000) })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf(me)).toMatchObject({ site: '', dist: null, away: false, live: true });
    expect(a.attendanceOf(me).lat).toBeCloseTo(at(9000).lat, 4);
    const b = app('staff');
    expect(b.clock(me, '', { face: true, live: true })).toMatchObject({ kind: 'in' });
    expect(b.attendanceOf(me)).toMatchObject({ lat: null, lng: null });
  });

  it('reception: needs face and live, no geofence, records the kiosk site when known', () => {
    const a = app('reception');
    a.setCompany({ sites: [office] });
    expect(a.clock('GM', '', { face: true })).toHaveProperty('error');
    expect(a.clock('GM', '', { face: true, live: true })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf('GM')).toMatchObject({ how: 'face-kiosk', live: true, site: '', away: false });
    const b = app('reception'); b.setCompany({ sites: [office] });
    expect(b.clock('GM', '', { face: true, live: true, loc: at(30) })).toMatchObject({ kind: 'in', site: 'Office' });
    b.setState({ role: 'gm' });
    expect(b.attendanceVals(b.state).ATT.feed[0]).toMatchObject({ how: 'Reception', live: true, place: 'Office · 30 m' });
  });
});

describe('head-turn check switch', () => {
  it('Management can switch it off; then face + location is enough, and the record says not live', async () => {
    const { default: TrinityApp } = await import('../logic/TrinityApp');
    const a = new TrinityApp(); a.confirm = () => true; a.setState({ role: 'staff', company: {} });
    const me = a.me().k;
    expect(a.liveOn()).toBe(true);
    expect(a.clock(me, '', { face: true })).toHaveProperty('error');
    expect(a.setLiveOn(false)).toMatch(/Only Management/);
    a.setState({ role: 'ceo' }); expect(a.setLiveOn(false)).toBe(''); a.setState({ role: 'staff' });
    expect(a.liveOn()).toBe(false);
    expect(a.clock(me, '', { face: true })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf(me).live).toBe(false);
  });
});
