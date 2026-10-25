import { describe, expect, it } from 'vitest';

import { fallbackRoute } from './router';

describe('fallbackRoute (local keyword routing)', () => {
  it('routes coding prompts to the coding shield', () => {
    expect(fallbackRoute('please debug this python function').targetWorkspace).toBe('coding');
    expect(fallbackRoute('refactor my react component').targetWorkspace).toBe('coding');
    expect(fallbackRoute('score my project').targetWorkspace).toBe('coding');
  });

  it('routes health prompts to the health shield', () => {
    expect(fallbackRoute('I have a fever and a headache').targetWorkspace).toBe('health');
    expect(fallbackRoute('interpret my blood test report').targetWorkspace).toBe('health');
  });

  it('routes student prompts to the student shield', () => {
    expect(fallbackRoute('help me with my math homework').targetWorkspace).toBe('student-shield');
    expect(fallbackRoute('explain this physics exam question').targetWorkspace).toBe('student-shield');
  });

  it('routes market prompts to the market shield', () => {
    expect(fallbackRoute('what is the bitcoin price today').targetWorkspace).toBe('market');
    expect(fallbackRoute('nasdaq share price').targetWorkspace).toBe('market');
  });

  it('falls back to general chat with lower confidence', () => {
    const route = fallbackRoute('tell me a fun fact');
    expect(route.targetWorkspace).toBe('general');
    expect(route.confidence).toBeLessThan(0.85);
    expect(route.cleanedPrompt).toBe('tell me a fun fact');
  });

  it('never throws and always returns a cleaned prompt', () => {
    expect(fallbackRoute('').cleanedPrompt).toBe('');
    expect(fallbackRoute('???').targetWorkspace).toBe('general');
  });
});
