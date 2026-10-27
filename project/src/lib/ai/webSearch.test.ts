import { describe, expect, it } from 'vitest';

import { formatContextBlock, formatDirectAnswer, needsWebSearch, type WebResultItem } from './webSearch';

describe('needsWebSearch', () => {
  it('skips chitchat and creative/code tasks', () => {
    expect(needsWebSearch('hi')).toBe(false);
    expect(needsWebSearch('thanks!')).toBe(false);
    expect(needsWebSearch('write me a poem about the sea')).toBe(false);
    expect(needsWebSearch('debug this function')).toBe(false);
  });

  it('skips the coding and translate workspaces', () => {
    expect(needsWebSearch('latest news about AI', 'coding')).toBe(false);
    expect(needsWebSearch('latest news about AI', 'translate')).toBe(false);
  });

  it('wants live context for news-y and time-sensitive questions', () => {
    expect(needsWebSearch('what is the latest news about AI today?')).toBe(true);
    expect(needsWebSearch('bitcoin price now')).toBe(true);
    expect(needsWebSearch('who won the match last night?')).toBe(true);
  });

  it('ignores very short messages', () => {
    expect(needsWebSearch('hi?')).toBe(false);
  });
});

const RESULTS: WebResultItem[] = [
  { title: 'Example one', url: 'https://example.com/1', snippet: 'First snippet', publisher: 'Example', date: '2026-10-26T12:00:00Z' },
  { title: 'Example two', url: 'https://example.com/2', snippet: 'Second snippet', detail: 'Extra detail' },
];

describe('formatContextBlock', () => {
  it('numbers results and includes snippet, detail, date and URL', () => {
    const block = formatContextBlock(RESULTS);
    expect(block).toContain('[1] Example one');
    expect(block).toContain('[2] Example two');
    expect(block).toContain('First snippet');
    expect(block).toContain('Extra detail');
    expect(block).toContain('URL: https://example.com/1');
  });

  it('is empty for no results', () => {
    expect(formatContextBlock([])).toBe('');
  });
});

describe('formatDirectAnswer', () => {
  it('builds a markdown list with publisher and date', () => {
    const answer = formatDirectAnswer(RESULTS, 'test query');
    expect(answer).toContain('**Live results:** test query');
    expect(answer).toContain('[Example one](https://example.com/1)');
    expect(answer).toContain('Example · 26 Oct');
    expect(answer).toContain('Second snippet');
  });

  it('returns null when there is nothing to show', () => {
    expect(formatDirectAnswer([], 'q')).toBeNull();
  });
});
