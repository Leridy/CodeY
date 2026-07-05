/**
 * Layout Types Tests
 *
 * Validates BREAKPOINTS constants and DEFAULT_PANEL_CONFIG values.
 */

import { describe, it, expect } from 'vitest';
import { BREAKPOINTS, DEFAULT_PANEL_CONFIG } from '../layout';

describe('BREAKPOINTS', () => {
  it('should define mobile breakpoint at 768', () => {
    expect(BREAKPOINTS.mobile).toBe(768);
  });

  it('should define tablet breakpoint at 1024', () => {
    expect(BREAKPOINTS.tablet).toBe(1024);
  });

  it('should define desktop breakpoint at 1280', () => {
    expect(BREAKPOINTS.desktop).toBe(1280);
  });

  it('should have mobile < tablet < desktop ordering', () => {
    expect(BREAKPOINTS.mobile).toBeLessThan(BREAKPOINTS.tablet);
    expect(BREAKPOINTS.tablet).toBeLessThan(BREAKPOINTS.desktop);
  });
});

describe('DEFAULT_PANEL_CONFIG', () => {
  it('should have explorerWidth with min/default/max', () => {
    expect(DEFAULT_PANEL_CONFIG.explorerWidth.min).toBe(200);
    expect(DEFAULT_PANEL_CONFIG.explorerWidth.default).toBe(260);
    expect(DEFAULT_PANEL_CONFIG.explorerWidth.max).toBe(400);
  });

  it('should have detailsWidth with min/default/max', () => {
    expect(DEFAULT_PANEL_CONFIG.detailsWidth.min).toBe(240);
    expect(DEFAULT_PANEL_CONFIG.detailsWidth.default).toBe(320);
    expect(DEFAULT_PANEL_CONFIG.detailsWidth.max).toBe(480);
  });

  it('should have terminalHeight with min/default/max', () => {
    expect(DEFAULT_PANEL_CONFIG.terminalHeight.min).toBe(120);
    expect(DEFAULT_PANEL_CONFIG.terminalHeight.default).toBe(240);
    expect(DEFAULT_PANEL_CONFIG.terminalHeight.max).toBe(480);
  });

  it('should have collapsible set to true', () => {
    expect(DEFAULT_PANEL_CONFIG.collapsible).toBe(true);
  });

  it('should have min <= default <= max for all dimensions', () => {
    const dims = [
      DEFAULT_PANEL_CONFIG.explorerWidth,
      DEFAULT_PANEL_CONFIG.detailsWidth,
      DEFAULT_PANEL_CONFIG.terminalHeight,
    ];
    for (const dim of dims) {
      expect(dim.min).toBeLessThanOrEqual(dim.default);
      expect(dim.default).toBeLessThanOrEqual(dim.max);
    }
  });
});
