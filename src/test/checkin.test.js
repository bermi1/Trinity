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
    expect(a.saveFace('RT', ds(), true)).toMatch(/reception or by Management/);
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
    expect(a.clock('RT', '', { face: true })).toHaveProperty('error');
    expect(a.state.attendance.length).toBe(0);
    expect(a.clock(me, 'data:x', { face: true })).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf(me)).toMatchObject({ k: me, how: 'face-self', inPhoto: 'data:x' });
    expect(a.myCheckinVals(a.state).CHK.status).toBe('in');
    expect(a.myCheckinVals(a.state).CHK.clockMe('')).toMatchObject({ kind: 'out' });
    expect(a.attendanceOf(me)).toMatchObject({ howOut: 'face-self' });
    expect(a.myCheckinVals(a.state).CHK.status).toBe('left');
  });

  it('the reception kiosk still clocks anyone, without the face-self mark', () => {
    const a = staff(); a.setState({ role: 'reception' });
    expect(a.clock('GM', '')).toMatchObject({ kind: 'in' });
    expect(a.attendanceOf('GM').how).toBeUndefined();
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
