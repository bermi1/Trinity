// Staff attendance: people check in when they arrive and check out when they leave. Only the person
// themselves can check in or out: always by their own face, matched against the face they registered
// themselves (on My check-in, or in front of the reception camera). Nobody checks in for someone else.
// One record per person per day: { id, k, date, in, out, inPhoto, outPhoto, how, live, site, dist, acc, lat, lng, away }
// (and for the check-out: howOut, liveOut, outSite, outDist, outAcc, outLat, outLng, outAway).
// Every face check-in passes a liveness challenge first (turn the head, see face.js), so a photo or a
// video of a colleague does not work; on their own phone, people must also be at an office site
// (company.sites), unless Management/the GM allowed them to check in away (company.awayOk, field staff).
import { dayKey } from './seed';

export const LATE_AFTER = '08:30';
export const SITE_R = 150;        // default office radius, metres
export const MAX_ACC = 1000;      // a GPS fix vaguer than this is refused

// Distance in metres between two { lat, lng } points (haversine).
export function haversine(a, b) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
const okLoc = l => !!l && isFinite(+l.lat) && isFinite(+l.lng) && Math.abs(+l.lat) <= 90 && Math.abs(+l.lng) <= 180;
// Where a phone is ({ lat, lng, acc } in metres) compared with the office sites ({ name, lat, lng, r }):
// the nearest site, how far, and whether that counts as inside. The GPS error is given the benefit of
// the doubt (inside if distance - accuracy <= radius), but a fix vaguer than MAX_ACC is not used.
export function whereIs(loc, sites) {
  if (!okLoc(loc)) return { known: false, inside: false, vague: false, site: null, dist: null, acc: null };
  const acc = Math.max(0, Math.round(+loc.acc || 0));
  const list = (sites || []).filter(okLoc);
  let near = null;
  list.forEach(s => { const d = haversine({ lat: +loc.lat, lng: +loc.lng }, { lat: +s.lat, lng: +s.lng }); if (!near || d - (s.r || SITE_R) < near.d - (near.s.r || SITE_R)) near = { s, d }; });
  const vague = acc > MAX_ACC, dist = near ? Math.round(near.d) : null;
  return { known: true, vague, acc, site: near ? near.s.name || 'Office' : null, r: near ? near.s.r || SITE_R : null, dist,
    inside: !!near && !vague && near.d - acc <= (near.s.r || SITE_R), lat: +(+loc.lat).toFixed(5), lng: +(+loc.lng).toFixed(5) };
}
const fmtM = m => (m >= 1000 ? (m / 1000).toFixed(1) + ' km' : m + ' m');
export const mapLink = (lat, lng) => 'https://www.google.com/maps?q=' + lat + ',' + lng;

export const attendanceMethods = {
  canSeeAttendance() { return ['ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  canRunKiosk() { return ['reception', 'ceo', 'gm', 'pa'].includes(this.state.role || 'ceo'); },
  // Each person registers their own face (with consent): up to five descriptors, numbers only. Nobody
  // registers a face for someone else, so nobody can check in as someone else. Management and the GM may
  // remove a person's face (for example when it no longer matches), so the person registers again.
  canRegisterFaces() { return false; },
  canResetFaces() { return ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
  saveFace(k, descriptors, consent) {
    const own = !!k && k === this.me().k;
    if (!own) return 'Each person registers their own face, signed in to their own account';
    if (!consent) return own ? 'Tick the box to agree to face check-in first' : 'Confirm the person has agreed to face check-in';
    if (!descriptors || !descriptors.length) return 'No face captured';
    const rec = { k, ds: descriptors.slice(0, 5), at: dayKey(0), by: this.me().k, consent: true };
    this.setState(x => ({ faces: [...(x.faces || []).filter(f => f.k !== k), rec] }));
    this.log('user', 'purple', 'Face registered · ' + this.av(k).n, own ? 'Registered and agreed by ' + this.me().n + ' on their own device' : 'Consent recorded by ' + this.me().n);
    this.toast(own ? 'Your face is registered' : 'Face registered · ' + this.av(k).first);
    return '';
  },
  removeFace(k) {
    if (!(k && k === this.me().k) && !this.canResetFaces()) return 'Not allowed';
    this.setState(x => ({ faces: (x.faces || []).filter(f => f.k !== k) }));
    this.toast('Face removed · ' + this.av(k).first);
    return '';
  },
  // Office sites and who may check in away: Management and the GM set them.
  canSetSites() { return this.isAdmin() || ['ceo', 'gm'].includes(this.state.role || 'ceo'); },
  officeSites() { return ((this.state.company || {}).sites || []).filter(okLoc); },
  mayBeAway(k) { return !!((this.state.company || {}).awayOk || {})[k]; },
  saveSite(i, site) {
    if (!this.canSetSites()) return 'Only Management or the GM set the office location';
    const name = String((site && site.name) || '').trim().slice(0, 60) || 'Office', lat = +(site && site.lat), lng = +(site && site.lng), r = Math.round(+(site && site.r) || SITE_R);
    if (!okLoc({ lat, lng }) || (site.lat === '' || site.lng === '')) return 'Enter a valid latitude and longitude';
    if (r < 20 || r > 5000) return 'Radius: between 20 and 5000 metres';
    const list = ((this.state.company || {}).sites || []).slice(), rec = { name, lat: +lat.toFixed(6), lng: +lng.toFixed(6), r };
    if (i == null || i < 0 || i >= list.length) list.push(rec); else list[i] = rec;
    this.setCompany({ sites: list });
    this.toast('Office location saved · ' + name + ' (' + r + ' m)');
    return '';
  },
  removeSite(i) {
    if (!this.canSetSites()) return 'Not allowed';
    const list = ((this.state.company || {}).sites || []).filter((x, j) => j !== i);
    this.setCompany({ sites: list });
    this.toast(list.length ? 'Office location removed' : 'No office location: check-in works from anywhere');
    return '';
  },
  setAwayOk(k, on) {
    if (!this.canSetSites()) return 'Not allowed';
    this.setCompany({ awayOk: Object.assign({}, (this.state.company || {}).awayOk || {}, { [k]: !!on }) });
    this.toast(this.av(k).first + (on ? ' may check in away from the office' : ' checks in at the office only'));
    return '';
  },
  attendanceOf(k, date) { return (this.state.attendance || []).find(a => a.k === k && a.date === (date || dayKey(0))) || null; },
  // Check in or out, only after a face matched that person's own registered face (opts.face) AND the
  // liveness challenge passed (opts.live):
  //  · on their own device (My check-in), signed in as themselves: how 'face-self'; when office sites
  //    are set, opts.loc ({ lat, lng, acc }) must be within one, unless the person may check in away;
  //  · on the reception screen, recognised by the camera: how 'face-kiosk' (opts.loc optional).
  // There is no way to tap someone's name and check them in.
  // The head-turn (liveness) step is on unless Management switched it off in Company setup / Staff attendance.
  liveOn() { return ((this.state.company || {}).liveCheck) !== false; },
  setLiveOn(on) {
    if (!this.canSetSites()) return 'Only Management or the GM changes this';
    this.setCompany({ liveCheck: !!on });
    this.toast(on ? 'Head-turn check on' : 'Head-turn check off · face match and location still apply');
    this.log('clock', on ? 'green' : 'amber', 'Check-in head-turn check ' + (on ? 'on' : 'off'), 'By ' + this.me().n);
    return '';
  },
  clock(k, photo, opts) {
    const o = opts || {}, face = o.face === true, live = o.live === true || !this.liveOn(), self = !!k && k === this.me().k && face, kiosk = face && !self && this.canRunKiosk();
    if (!face) return { error: 'Check in with your own face: My check-in on your phone, or the camera at reception' };
    if (!self && !kiosk) return { error: 'You can only check yourself in' };
    if (!live) return { error: 'Could not confirm it’s really you. Try again in good light.' };
    if (!(this.state.staff || []).some(p => p.k === k) && !Object.values(this.ROLES).some(r => r.k === k) && !(this.people || {})[k]) return { error: 'Not on the staff list' };
    const sites = this.officeSites(), w = whereIs(o.loc, sites);
    let away = false;
    if (self && sites.length) {
      if (!w.known) return { error: 'Turn on location: checking in on your phone needs to know you are at the office' };
      if (w.vague) return { error: 'Your location is too vague (±' + fmtM(w.acc) + '), go outside / turn on GPS' };
      if (!w.inside) {
        if (!this.mayBeAway(k)) return { error: 'You are ' + fmtM(w.dist) + ' from ' + w.site + '. Check in when you are at the office (within ' + w.r + ' m), or at reception' };
        away = true;
      }
    }
    const place = w.known ? { site: w.inside ? w.site : '', dist: w.dist, acc: w.acc, lat: w.lat, lng: w.lng } : { site: '', dist: null, acc: null, lat: null, lng: null };
    const date = dayKey(0), time = this.now(), cur = this.attendanceOf(k, date), name = this.av(k).n;
    if (cur && cur.out) return { error: name + ' already checked out today at ' + cur.out };
    if (!cur) {
      const rec = Object.assign({ id: 'AT' + date.replace(/-/g, '') + k, k, date, in: time, out: '', inPhoto: photo || '', outPhoto: '', how: self ? 'face-self' : 'face-kiosk', live: o.live === true }, place, { away });
      this.setState(x => ({ attendance: [rec, ...(x.attendance || [])].slice(0, 3000) }));
      const late = time > LATE_AFTER;
      if (late && this.ROLES.gm && this.ROLES.gm.k !== k) this.notify({ to: this.ROLES.gm.k, ic: 'clock', t: 'Late arrival · ' + name, s: 'Checked in at ' + time, go: 'team' });
      if (away && this.ROLES.gm && this.ROLES.gm.k !== k) this.notify({ to: this.ROLES.gm.k, ic: 'mapPin', t: 'Checked in away · ' + name, s: time + ' · ' + fmtM(w.dist) + ' from ' + w.site, go: 'attendance' });
      return { kind: 'in', time, name, late, away, site: place.site };
    }
    const out = { out: time, outPhoto: photo || '', howOut: self ? 'face-self' : 'face-kiosk', liveOut: true, outSite: place.site, outDist: place.dist, outAcc: place.acc, outLat: place.lat, outLng: place.lng, outAway: away };
    this.setState(x => ({ attendance: (x.attendance || []).map(a => (a.id === cur.id ? Object.assign({}, a, out) : a)) }));
    return { kind: 'out', time, name, since: cur.in, away, site: place.site };
  }
};

const mins = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
const dur = (a, b) => { const d = Math.max(0, mins(b) - mins(a)); return Math.floor(d / 60) + 'h ' + String(d % 60).padStart(2, '0') + 'm'; };

export function attendanceVals(s) {
  const kiosk = this.canRunKiosk(), see = this.canSeeAttendance();
  if (!kiosk && !see) return { ATT: null };
  const today = dayKey(0), recs = (s.attendance || []).filter(a => a.date === today);
  const people = [...new Map([...(s.staff || []).map(p => p.k), ...['ceo', 'gm'].map(r => this.ROLES[r] && this.ROLES[r].k)].filter(Boolean).map(k => [k, k])).keys()]
    .map(k => { const a = this.av(k), r = recs.find(x => x.k === k); return { k, n: a.n, first: a.first, i: a.i, c: a.c, ph: a.ph, st: !r ? 'out' : r.out ? 'left' : 'in', in: r ? r.in : '', out: r ? r.out : '', late: !!r && r.in > LATE_AFTER, hours: r ? dur(r.in, r.out || this.now()) : '', inPhoto: r ? r.inPhoto : '', outPhoto: r ? r.outPhoto : '',
      away: !!r && !!(r.away || r.outAway), mayAway: this.mayBeAway(k) }; })
    .sort((a, b) => a.n.localeCompare(b.n));
  const ev = (r, kind) => { const out = kind === 'out', how = out ? r.howOut : r.how;
    const lat = out ? r.outLat : r.lat, lng = out ? r.outLng : r.lng, site = out ? r.outSite : r.site, away = !!(out ? r.outAway : r.away), dist = out ? r.outDist : r.dist, acc = out ? r.outAcc : r.acc;
    const has = lat != null && lng != null && lat !== '' && lng !== '';
    return { k: r.k, t: out ? r.out : r.in, kind, photo: out ? r.outPhoto : r.inPhoto, how: how === 'face-kiosk' ? 'Reception' : how === 'face-self' ? 'Own phone' : '', live: !!(out ? r.liveOut : r.live), away,
      place: site ? site + (dist != null ? ' · ' + fmtM(dist) : '') : has ? (away ? 'away · ' : '') + lat + ',' + lng : '', acc: acc != null ? acc : null, map: has ? mapLink(lat, lng) : '' }; };
  const feed = recs.flatMap(r => [ev(r, 'in'), ...(r.out ? [ev(r, 'out')] : [])])
    .sort((a, b) => b.t.localeCompare(a.t)).map(e => Object.assign(e, { n: this.av(e.k).n, late: e.kind === 'in' && e.t > LATE_AFTER }));
  return { ATT: { liveOn: this.liveOn(), kiosk, see, today, people, feed, lateAfter: LATE_AFTER,
    counts: { in: people.filter(p => p.st === 'in').length, left: people.filter(p => p.st === 'left').length, out: people.filter(p => p.st === 'out').length, late: people.filter(p => p.late).length, away: people.filter(p => p.away).length },
    clock: (k, photo, o) => this.clock(k, photo, Object.assign({}, o || {}, { face: true })),
    SITES: see && this.canSetSites() ? this.siteVals() : null,
    faces: (s.faces || []).filter(f => people.some(p => p.k === f.k)), canFaces: this.canResetFaces(),
    saveFace: (k, ds, consent) => this.saveFace(k, ds, consent), removeFace: k => this.removeFace(k),
    statusOf: k => { const p = people.find(x => x.k === k); return p ? p.st : 'out'; }, sinceOf: k => { const p = people.find(x => x.k === k); return p ? p.in : ''; } } };
}

// My check-in: every signed-in person registers their own face and checks themselves in and out with it.
export function myCheckinVals(s) {
  const me = this.me(), k = me && me.k;
  if (!k) return { CHK: null };
  const a = this.av(k), r = (s.attendance || []).find(x => x.k === k && x.date === dayKey(0)) || null;
  const myFace = (s.faces || []).find(f => f.k === k) || null;
  return { CHK: { liveOn: this.liveOn(), me: { k, n: a.n, first: a.first, i: a.i, c: a.c }, hasFace: !!myFace, myFace,
    status: !r ? 'out' : r.out ? 'left' : 'in', in: r ? r.in : '', out: r ? r.out : '', late: !!r && r.in > LATE_AFTER, lateAfter: LATE_AFTER,
    saveMyFace: (ds, consent) => this.saveFace(k, ds, consent), removeMyFace: () => this.removeFace(k),
    sites: this.officeSites().map(x => ({ name: x.name, r: x.r || SITE_R })), mayAway: this.mayBeAway(k),
    where: loc => whereIs(loc, this.officeSites()),
    clockMe: (photo, o) => this.clock(k, photo, Object.assign({}, o || {}, { face: true })) } };
}

// Office locations (for Company setup and the Staff attendance page): the sites, and who may check in away.
export function siteVals() {
  const s = this.state, list = ((s.company || {}).sites || []);
  const keys = [...new Set([...(s.staff || []).map(p => p.k), ...['ceo', 'gm'].map(r => this.ROLES[r] && this.ROLES[r].k)].filter(Boolean))];
  return { can: this.canSetSites(), defR: SITE_R, liveOn: this.liveOn(), setLive: on => this.setLiveOn(on),
    sites: list.map((x, i) => ({ i, name: x.name, lat: x.lat, lng: x.lng, r: x.r || SITE_R, map: mapLink(x.lat, x.lng), remove: () => this.removeSite(i), save: v => this.saveSite(i, v) })),
    add: v => this.saveSite(null, v),
    people: keys.map(k => ({ k, n: this.av(k).n, away: this.mayBeAway(k), set: on => this.setAwayOk(k, on) })).sort((a, b) => a.n.localeCompare(b.n)) };
}
attendanceMethods.siteVals = siteVals;

// The phone's position, once: { lat, lng, acc } or { error }. Never throws.
export function getLocation(timeout = 15000, maxAge = 0) {
  return new Promise(res => {
    const g = typeof navigator !== 'undefined' && navigator.geolocation;
    if (!g) { res({ error: 'This device cannot tell its location' }); return; }
    try {
      g.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) }),
        e => res({ error: e && e.code === 1 ? 'Location is blocked: allow location for this site in your browser settings' : 'Could not get your location · ' + ((e && e.message) || 'try again') }),
        { enableHighAccuracy: true, timeout, maximumAge: maxAge });
    } catch (e) { res({ error: 'Could not get your location' }); }
  });
}
