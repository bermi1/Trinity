import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const ds = () => [Array.from({ length: 128 }, () => 0.1)];
const staff = () => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role: 'staff' }); return a; };

describe('my check-in (own face, own device)', () => {
  it('a staff member saves their own face only with consent', () => {
    const a = staff(), me = a.me().k;
    expect(a.saveFace(me, ds(), false)).toMatch(/agree/);
    expect((a.state.faces || []).length).toBe(0);
    expect(a.saveFace(me, ds(), true)).toBe('');
    expect(a.state.faces).toEqual([expect.objectContaining({ k: me, consent: true, by: me })]);
    expect(a.myCheckinVals(a.state).CHK).toMatchObject({ hasFace: true, status: 'out', me: { k: me } });
  });

  it('cannot save or remove someone else’s face', () => {
    const a = staff();
    expect(a.saveFace('RT', ds(), true)).toMatch(/registers their own face/);
    a.setState({ faces: [{ k: 'RT', ds: ds() }] });
    expect(a.removeFace('RT')).toBe('Not allowed');
    expect(a.state.faces.length).toBe(1);
  });

  it('removes their own face', () => {
    const a = staff(), C = () => a.myCheckinVals(a.state).CHK;
    C().saveMyFace(ds(), true);
    expect(C().removeMyFace()).toBe('');
    expect(C().hasFace).toBe(false);
  });

  it('self-clocks only when verified by face, and marks the record face-self', () => {
    const a = staff(), me = a.me().k;
    expect(a.clock(me, '')).toHaveProperty('error');
    expect(a.clock(me, '', { face: false })).toHaveProperty('error');
    expect(a.clock('RT', '', { face: true, live: true })).toHaveProperty('error');
    // A face match alone is not enough: the liveness challenge must have passed too.
    expect(a.clock(me, 'data:x', { face: true })).toEqual({ error: expect.stringMatching(/really you/) });
    expect(a.state.attendance.length).toBe(0);
    expect(a.clock(me, 'data:x', { face: true, live: true })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf(me)).toMatchObject({ k: me, how: 'face-self', inPhoto: 'data:x', live: true });
    expect(a.myCheckinVals(a.state).CHK.status).toBe('in');
    expect(a.myCheckinVals(a.state).CHK.clockMe('')).toHaveProperty('error');
    expect(a.myCheckinVals(a.state).CHK.clockMe('', { live: true })).toMatchObject({ kind: 'out' });
    expect(a.attendanceOf(me)).toMatchObject({ howOut: 'face-self', liveOut: true });
    expect(a.myCheckinVals(a.state).CHK.status).toBe('left');
  });

  it('nobody checks in for someone else: reception only checks in a face the camera recognised', () => {
    const a = staff(); a.setState({ role: 'reception' });
    // No tapping a name: without a face match, nothing happens.
    expect(a.clock('GM', '')).toHaveProperty('error');
    expect(a.attendanceOf('GM')).toBeNull();
    // Reception cannot register someone's face either.
    expect(a.saveFace('GM', ds(), true)).toMatch(/registers their own face/);
    // The camera recognised GM's own registered face.
    expect(a.clock('GM', '', { face: true })).toHaveProperty('error');
    expect(a.clock('GM', '', { face: true, live: true })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf('GM')).toMatchObject({ how: 'face-kiosk', live: true });
    // Management or the GM can remove a face so the person registers again.
    a.setState({ role: 'gm', faces: [{ k: 'GM', ds: ds() }] });
    expect(a.removeFace('GM')).toBe('');
    expect(a.attendanceVals(a.state).ATT).not.toBeNull();
    a.setState({ role: 'staff' });
    expect(a.attendanceVals(a.state).ATT).toBeNull();
  });

  it('every role except the store gets My check-in after its home item, and may open it', () => {
    const a = staff();
    Object.keys(a.ROLES).forEach(r => {
      const first = a.navGroups(r)[0][1].map(i => i[0]);
      if (r === 'store') expect(first).not.toContain('checkin');
      else expect(first[1]).toBe('checkin');
      expect(a.allowedPage(r, 'checkin')).toBe('checkin');
    });
  });
});
