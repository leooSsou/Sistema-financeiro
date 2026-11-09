import { describe, it, expect } from 'vitest';
import { isNewerVersion } from '../src/services/updateService';

describe('UpdateService - Version comparison', () => {
  it('correctly detects newer versions', () => {
    expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('v1.1.0', '1.0.0')).toBe(true);
    expect(isNewerVersion('v2.0.0', 'v1.9.9')).toBe(true);
    expect(isNewerVersion('1.0.10', '1.0.9')).toBe(true);
  });

  it('correctly detects same or older versions', () => {
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('v1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('1.0.0', '1.0.1')).toBe(false);
    expect(isNewerVersion('v0.9.5', '1.0.0')).toBe(false);
  });
});
