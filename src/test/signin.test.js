import { describe, it, expect } from 'vitest';
import TrinityApp from '../logic/TrinityApp';

describe('first-name sign-in', () => {
  const app = Object.create(TrinityApp.prototype);
  it('turns a first name into the office email', () => {
    expect(app.signInEmail('Faith')).toBe('faith@trinitymark.co.tz');
    expect(app.signInEmail("  M'baraka ")).toBe('mbaraka@trinitymark.co.tz');
  });
  it('keeps a full email as typed (lower case)', () => {
    expect(app.signInEmail('Faith.Daffa@Gmail.com')).toBe('faith.daffa@gmail.com');
  });
});
