// Face recognition for staff check-in, run entirely in the browser (no photos leave the device).
// Each person is stored as up to five face descriptors: 128 numbers that describe the face, not an image.
const MODELS = '/face-models';
let api = null, loading = null;

export function loadFace() {
  if (api) return Promise.resolve(api);
  if (!loading) loading = (async () => {
    const f = await import('@vladmandic/face-api');
    try { await f.tf.setBackend('webgl'); } catch (e) { /* falls back to the CPU */ }
    await f.tf.ready();
    await Promise.all([f.nets.tinyFaceDetector.loadFromUri(MODELS), f.nets.faceLandmark68TinyNet.loadFromUri(MODELS), f.nets.faceRecognitionNet.loadFromUri(MODELS)]);
    api = f; return f;
  })().catch(e => { loading = null; throw e; });
  return loading;
}

const boxOf = b => ({ x: b.x, y: b.y, width: b.width, height: b.height });

// The one face in a video frame or image: its descriptor, box, head turn and how sure the detector is.
export async function readFace(el) {
  const f = await loadFace();
  const r = await f.detectSingleFace(el, new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptor();
  return r ? { d: Array.from(r.descriptor), score: r.detection.score, box: boxOf(r.detection.box), yaw: yawOf(r.landmarks.positions) } : null;
}

// A quicker read for the liveness challenge: only where the face is and which way it is turned.
export async function readPose(el) {
  const f = await loadFace();
  const r = await f.detectSingleFace(el, new f.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 })).withFaceLandmarks(true);
  return r ? { box: boxOf(r.detection.box), yaw: yawOf(r.landmarks.positions), score: r.detection.score } : null;
}

export const pack = d => d.map(x => Math.round(x * 1e4) / 1e4);
export const distance = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return Math.sqrt(s); };

// The closest registered person, if close enough. 0.45 is strict: it prefers "not recognised" over a wrong name.
export const MATCH = 0.45;
export function bestMatch(d, faces, limit = MATCH) {
  let best = null, second = Infinity;
  (faces || []).forEach(p => {
    const v = Math.min(...(p.ds || []).map(x => distance(d, x)));
    if (!best || v < best.v) { if (best) second = Math.min(second, best.v); best = { k: p.k, v }; } else second = Math.min(second, v);
  });
  // Two people almost equally close: don't guess.
  if (!best || best.v >= limit || second - best.v < 0.06) return null;
  return best;
}

// ── Liveness: is a real person in front of the camera, not a photo or a screen? ──
// The person is asked to turn their head one way, then the other (random order), then look straight
// again, within a few seconds. A photo held up to the camera cannot do that: when a flat picture is
// moved or tilted, the nose stays at the same place between the cheeks, so its head turn never changes.

// Head turn from the 68 face points (the raw camera frame, not the mirrored preview): where the nose
// tip (30) sits between the two sides of the jaw (0 and 16). About 0.5 looking straight; it goes up
// when the person turns to THEIR left and down when they turn to their right.
export function yawOf(pts) {
  if (!pts || pts.length < 31) return null;
  const l = pts[0].x, r = pts[16].x, n = pts[30].x;
  if (!(r - l > 1)) return null;
  return (n - l) / (r - l);
}

export const LIVE_MS = 6000;   // the whole challenge must be done within this time
export const TURN = 0.1;       // how far the head must turn from where it started (on the 0..1 scale above)
export const STEPS = { left: 'Turn your head to your left', right: 'Turn your head to your right', centre: 'Now look straight at the camera' };

// A random order of the two turns, so a recorded video does not know what is coming.
export function makeChallenge(rand = Math.random) { return rand() < 0.5 ? ['left', 'right'] : ['right', 'left']; }

// Decides whether a sequence of readings ({ t: ms, yaw, box } or null when no face was seen) satisfies
// the challenge. Returns { ok, step, need, fail }: step = how many turns are done, need = what to ask
// for now ('left' | 'right' | 'centre'), fail = why it can no longer pass ('' while it still can).
//  · the start is where the head was in the first readings (its "straight");
//  · each turn counts once the head moved TURN past the start in that direction;
//  · the head must then come back near the start (the final frame is matched against the face again);
//  · the face must not jump or change size suddenly between frames (a picture swapped in front of it);
//  · everything within LIVE_MS of the first reading.
export function livenessCheck(readings, challenge, o = {}) {
  const limit = o.ms || LIVE_MS, turn = o.turn || TURN;
  const steps = challenge || ['left', 'right'];
  const seen = (readings || []).filter(r => r && typeof r.yaw === 'number' && isFinite(r.yaw));
  const res = (step, fail, ok) => ({ ok: !!ok, step, need: step < steps.length ? steps[step] : 'centre', fail: fail || '' });
  if (!seen.length) return res(0, '');
  for (let i = 1; i < seen.length; i++) {
    const a = seen[i - 1].box, b = seen[i].box;
    if (!a || !b) continue;
    const w = (a.width + b.width) / 2, dx = (a.x + a.width / 2) - (b.x + b.width / 2), dy = (a.y + a.height / 2) - (b.y + b.height / 2);
    if (Math.hypot(dx, dy) > 0.6 * w || Math.max(a.width / b.width, b.width / a.width) > 1.6) return res(0, 'jump');
  }
  const base = seen.slice(0, 3).map(r => r.yaw).sort((x, y) => x - y)[Math.min(1, seen.slice(0, 3).length - 1)];
  let step = 0, back = false;
  const t0 = seen[0].t || 0;
  for (const r of seen) {
    if ((r.t || 0) - t0 > limit) break;
    const d = r.yaw - base;
    if (step < steps.length) { if ((steps[step] === 'left' ? d : -d) >= turn) step++; }
    else if (Math.abs(d) <= turn / 2) { back = true; break; }
  }
  const span = seen[seen.length - 1].t - seen[0].t;
  if (back) return res(step, '', true);
  if (span > limit) return res(step, 'timeout');
  return res(step, '');
}

// Runs the challenge on a live <video>: reads the head turn several times a second until it passes,
// fails or runs out of time. onStep(state) is told the progress (for the big instruction on screen).
export async function runLiveness(el, { challenge = makeChallenge(), ms = LIVE_MS, onStep = () => {}, alive = () => true } = {}) {
  const readings = [], t0 = Date.now();
  let st = livenessCheck(readings, challenge, { ms });
  onStep(Object.assign({ challenge }, st));
  while (alive() && Date.now() - t0 <= ms + 400) {
    const r = el && el.videoWidth ? await readPose(el) : null;
    readings.push(r ? Object.assign({ t: Date.now() - t0 }, r) : null);
    st = livenessCheck(readings, challenge, { ms });
    onStep(Object.assign({ challenge }, st));
    if (st.ok || st.fail) break;
    await new Promise(res => setTimeout(res, 60));
  }
  if (!st.ok && !st.fail) st = Object.assign({}, st, { fail: 'timeout' });
  return Object.assign({ challenge, readings: readings.length }, st);
}
