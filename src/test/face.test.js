import { describe, it, expect } from 'vitest';
import { bestMatch, distance, pack } from '../logic/face';

const v = (x, n = 128) => Array.from({ length: n }, (_, i) => (i === 0 ? x : 0));
describe('face matching', () => {
  const faces = [{ k: 'FM', ds: [v(0)] }, { k: 'JE', ds: [v(1)] }];
  it('measures the distance between two descriptors', () => { expect(distance(v(0), v(0.3))).toBeCloseTo(0.3); });
  it('picks the registered person who is close enough', () => { expect(bestMatch(v(0.1), faces)).toMatchObject({ k: 'FM' }); });
  it('says no when nobody is close enough', () => { expect(bestMatch(v(0.5), faces)).toBeNull(); });
  it('does not guess between two equally close people', () => { expect(bestMatch(v(0.5), [{ k: 'A', ds: [v(0.3)] }, { k: 'B', ds: [v(0.72)] }], 0.5)).toBeNull(); });
  it('stores numbers rounded to 4 places', () => { expect(pack([0.123456, -0.98765])).toEqual([0.1235, -0.9876]); });
});
