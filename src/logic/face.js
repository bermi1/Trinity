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

// The one face in a video frame or image: its descriptor, box and how sure the detector is.
export async function readFace(el) {
  const f = await loadFace();
  const r = await f.detectSingleFace(el, new f.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })).withFaceLandmarks(true).withFaceDescriptor();
  return r ? { d: Array.from(r.descriptor), score: r.detection.score, box: r.detection.box } : null;
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
