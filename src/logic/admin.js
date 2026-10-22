// Account administration (administrators only) and the one-tap demo removal.
// All checks run in the database: these call protected functions (supabase/migrations).
// Mixed into TrinityApp, so `this` is the app.
import { supabase } from '../lib/supabase';

// Value a collection starts with once demo data is gone: [] for lists, {} for maps, 0 / '' / false otherwise.
export const emptyLike = v => (Array.isArray(v) ? [] : v && typeof v === 'object' ? {} : typeof v === 'number' ? 0 : typeof v === 'string' ? '' : false);

const PALETTE = ['#6D3CC2', '#2B1459', '#4C78D0', '#B49A5A', '#2E9B63', '#C2476F', '#8A6414', '#5A2FA8', '#3E7C8C', '#9A4FB8', '#4F6B3A', '#B0663A', '#C27A2E'];
export const colorFor = key => PALETTE[[...String(key)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

const rpcError = err => (err && (err.message || err.details)) || 'Something went wrong';

export const adminMethods = {
  isAdmin() { return !!(this.account && this.account.isAdmin); },

  // Names and colours for everyone with an account, so new staff show properly across the app.
  setPeople(rows) {
    this.people = {};
    for (const p of rows || []) {
      const k = (p.person_key || '').toUpperCase();
      if (k) this.people[k] = [p.full_name || k, (this.PPL[k] || [])[1] || colorFor(k)];
    }
  },

  async loadUsers() {
    if (!this.state.db || !this.isAdmin()) return;
    this.setState({ usersBusy: true });
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) { this.setState({ usersBusy: false }); this.toast(rpcError(error)); return; }
    this.setState({ users: data, usersBusy: false });
    this.setPeople(data);
  },

  async createUser(f) {
    const { error } = await supabase.rpc('admin_create_user', {
      p_email: f.email, p_password: f.password, p_full_name: f.name, p_role: f.role, p_title: f.title || '', p_person_key: f.k || '', p_is_admin: !!f.admin
    });
    if (error) return rpcError(error);
    const k = (f.k || '').trim().toUpperCase();
    // Field staff appear on the staff list with daily reports and floats.
    if (k && !this.state.staff.some(p => p.k === k)) {
      this.setState(x => ({ staff: [...x.staff, { k, role: f.title || this.ROLES[f.role].label, dept: this.ROLES[f.role].label, rep: false, fl: 0 }] }));
    }
    this.toast('Account created · ' + f.email);
    this.log('user', 'purple', 'Account created · ' + f.name, this.ROLES[f.role].label + ' portal');
    await this.loadUsers();
    return null;
  },

  async updateUser(u, changes) {
    const next = Object.assign({ full_name: u.full_name, role: u.role, title: u.title, person_key: u.person_key, is_admin: u.is_admin }, changes);
    const { error } = await supabase.rpc('admin_update_user', { p_user: u.user_id, p_full_name: next.full_name, p_role: next.role, p_title: next.title || '', p_person_key: next.person_key || '', p_is_admin: next.is_admin });
    if (error) { this.toast(rpcError(error)); return; }
    this.toast('Saved · ' + u.email);
    await this.loadUsers();
  },

  async resetPassword(u, password) {
    const { error } = await supabase.rpc('admin_set_password', { p_user: u.user_id, p_password: password });
    if (error) return rpcError(error);
    this.toast('New password set for ' + u.email);
    return null;
  },

  async deleteUser(u) {
    if (!this.confirm('Delete the account ' + u.email + '? They will no longer be able to sign in.')) return;
    const { error } = await supabase.rpc('admin_delete_user', { p_user: u.user_id });
    if (error) { this.toast(rpcError(error)); return; }
    this.toast('Account deleted · ' + u.email);
    await this.loadUsers();
  },

  // One tap: removes demo accounts and every demo record, leaving an empty company workspace.
  async removeDemo() {
    if (!this.confirm('Remove all demo accounts and demo data? Projects, stock, requests and everything else from the demo are deleted. Real accounts stay. This cannot be undone.')) return;
    const { data, error } = await supabase.rpc('admin_remove_demo');
    if (error) { this.toast(rpcError(error)); return; }
    const seed = this.seed(), empty = {};
    Object.keys(seed).forEach(k => { empty[k] = emptyLike(seed[k]); });
    this.applyRemote(empty);
    this.setState({ workspaceLive: true });
    this.toast('Demo removed · ' + data.users_removed + ' accounts and ' + data.records_removed + ' records deleted');
    await this.loadUsers();
  }
};
