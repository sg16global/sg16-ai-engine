import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractLocation, newsTopic } from './webFetcher.js';

describe('newsTopic', () => {
  it('treats general news questions as top headlines', () => {
    for (const q of [
      'What is the news today?',
      "What's the latest news",
      'Latest headlines',
      'Give me today’s top stories',
      'Any breaking news right now?',
      'world news',
    ]) {
      assert.equal(newsTopic(q), '', q);
    }
  });

  it('keeps the subject of a topical news question', () => {
    assert.equal(newsTopic('Latest tech headlines'), 'tech');
    assert.equal(newsTopic('What is the news about Tesla today?'), 'tesla');
    assert.equal(newsTopic('Malaysia news today'), 'malaysia');
  });
});

describe('extractLocation', () => {
  it('finds the city in a weather question', () => {
    assert.equal(extractLocation('Weather in London today?'), 'London');
    assert.equal(extractLocation("What's the weather like in Kuala Lumpur"), 'Kuala Lumpur');
    assert.equal(extractLocation('weather Dhaka'), 'Dhaka');
  });

  it('returns nothing when no place is named', () => {
    assert.equal(extractLocation('Weather forecast today'), '');
    assert.equal(extractLocation('What is the weather for today?'), '');
    assert.equal(extractLocation('weather right now'), '');
  });
});
