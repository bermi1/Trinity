import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

const app = role => { const a = new TrinityApp(); a.confirm = () => true; a.setState({ role }); return a; };

describe('who manages staff accounts', () => {
  it('Management and the GM get Users & access; other portals do not', () => {
    for (const role of ['ceo', 'gm']) {
      const a = app(role);
      expect(a.canManageStaff()).toBe(true);
      expect(a.navFor(role).map(i => i[0])).toContain('users');
    }
    for (const role of ['staff', 'operations', 'finance', 'pa']) {
      const a = app(role);
      expect(a.canManageStaff()).toBe(false);
      expect(a.navFor(role).map(i => i[0])).not.toContain('users');
    }
  });

  it('deleting an account also takes the person off the staff list', async () => {
    const a = app('gm');
    a.state.db = true;
    const k = a.state.staff[0].k;
    const { supabase } = await import('../lib/supabase');
    const real = supabase && supabase.rpc;
    if (supabase) supabase.rpc = async () => ({ error: null });
    a.loadUsers = async () => {};
    a.setState({ faces: [{ k, ds: [[0]] }] });
    try {
      if (supabase) {
        await a.deleteUser({ user_id: 'u1', email: 'x@trinitymark.co.tz', person_key: k, full_name: 'X' });
        expect(a.state.staff.some(p => p.k === k)).toBe(false);
        expect(a.state.faces).toEqual([]);
      }
    } finally { if (supabase) supabase.rpc = real; }
  });
});
