import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';
import { seed } from '../logic/seed';
import { emptyLike } from '../logic/admin';

const PAGES = ['dashboard', 'briefing', 'projects', 'project', 'tasks', 'requests', 'finance', 'store', 'procurement', 'crm', 'staff', 'notifications', 'field', 'staffportal', 'financeportal', 'reception', 'storekeeper', 'rooms', 'proposals', 'production', 'logistics', 'documents', 'reports', 'calendar', 'settings', 'ceomobile', 'requisitions', 'movements', 'job', 'printshop'];

// After "Remove demo" every collection is empty; no screen may crash.
describe('empty workspace (demo removed)', () => {
  for (const role of ['ceo', 'staff', 'finance', 'reception', 'store', 'production']) {
    it(role, () => {
      const empty = {};
      Object.keys(seed()).forEach(k => { empty[k] = emptyLike(seed()[k]); });
      localStorage.setItem('tm360data', JSON.stringify(empty));
      const errors = [];
      for (const page of PAGES) {
        localStorage.setItem('tm360', JSON.stringify({ auth: true, role, page, projectId: 'PRJ-0231', jobId: 'JOB-0313' }));
        const orig = console.error; console.error = (...a) => errors.push(page + ': ' + String(a[0]).slice(0, 160));
        try {
          const { unmount, container } = render(<App />);
          if (!container.querySelector('main')) errors.push(page + ': no main');
          const bad = (container.textContent.match(/NaN|undefined|Infinity|\[object Object\]/g) || []);
          if (bad.length) errors.push(page + ': shows ' + [...new Set(bad)].join(', '));
          unmount();
        } catch (e) { errors.push(page + ': ' + e.message); }
        finally { console.error = orig; }
      }
      expect(errors).toEqual([]);
    });
  }
});
