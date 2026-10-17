import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { solveMath } from '../src/mathCore.js';

const result = (q) => solveMath(q)?.result;

describe('arithmetic', () => {
  it('evaluates expressions exactly', () => {
    assert.equal(result('What is 12*(3+4)^2?'), '588');
    assert.equal(result('0.1 + 0.2'), '3/10 (≈ 0.3)');
    assert.equal(result('15% of 240'), '36');
    assert.equal(result('5 x 3'), '15');
    assert.equal(result('2 to the power of 10'), '1024');
    assert.equal(result('10!'), '3628800');
    assert.equal(result('12 / 7'), '12/7 (≈ 1.71428571429)');
  });
  it('reports division by zero instead of Infinity', () => {
    assert.match(result('1/0'), /^undefined/);
  });
});

describe('equations', () => {
  it('solves linear and quadratic equations', () => {
    assert.equal(result('solve 2x + 3 = 11'), 'x = 4');
    assert.equal(result('solve for x: 3x - 7 = 2'), 'x = 3');
    assert.equal(result('x^2 - 5x + 6 = 0'), 'x = 2 or x = 3');
    assert.equal(result('x^2 = 4x - 4'), 'x = 2 (double root)');
    assert.equal(result('x^2 + 1 = 0'), 'x = -i or x = i');
    assert.equal(result('x + 1 = x + 2'), 'no solution');
  });
  it('solves linear systems', () => {
    assert.equal(result('solve 2x + y = 5, x - y = 1'), 'x = 2, y = 1');
    assert.equal(result('x + y + z = 6; 2y + 5z = -4; 2x + 5y - z = 27'), 'x = 5, y = 3, z = -2');
    assert.match(result('x + y = 2, 2x + 2y = 4'), /no unique solution/);
  });
  it('does not treat non-polynomial equations as quadratic', () => {
    assert.equal(solveMath('sin(x) = 0.5'), null);
  });
});

describe('matrices and vectors', () => {
  it('computes matrix operations', () => {
    assert.equal(result('determinant of [[1,2],[3,4]]'), '-2');
    assert.equal(result('inverse of [[4,7],[2,6]]'), '[[0.6, -0.7], [-0.2, 0.4]]');
    assert.equal(result('rank of [[1,2],[2,4]]'), '1');
    assert.equal(result('transpose [[1,2,3],[4,5,6]]'), '[[1, 4], [2, 5], [3, 6]]');
    assert.equal(result('multiply [[1,2],[3,4]] and [[5,6],[7,8]]'), '[[19, 22], [43, 50]]');
    assert.equal(result('eigenvalues of [[2,0],[0,3]]'), '[2, 3]');
  });
  it('computes vector operations', () => {
    assert.equal(result('dot product of [1,2,3] and [4,5,6]'), '32');
    assert.equal(result('cross product of [1,0,0] and [0,1,0]'), '[0, 0, 1]');
    assert.equal(result('magnitude of [3,4]'), '5');
    assert.equal(result('angle between [1,0] and [0,1]'), '90');
    assert.equal(result('unit vector of [3,4]'), '[0.6, 0.8]');
  });
  it('rejects oversized matrices', () => {
    const row = `[${Array(13).fill(1).join(',')}]`;
    const big = `[${Array(13).fill(row).join(',')}]`;
    assert.equal(solveMath(`determinant of ${big}`), null);
  });
});

describe('calculus and algebra', () => {
  it('differentiates and simplifies', () => {
    assert.equal(result('derivative of x^2 * sin(x)'), '2 * x * sin(x) + x ^ 2 * cos(x)');
    assert.equal(result('simplify 2x + 3x - x'), '4 * x');
  });
});

describe('leaves normal text to the language model', () => {
  const sentences = [
    'what is love?',
    'hello how are you',
    'what is the capital of France',
    'write a poem about 2 cats',
    'I have 3 apples and 2 = good',
    'my score = 5 points',
  ];
  for (const q of sentences) {
    it(q, () => assert.equal(solveMath(q), null));
  }
  it('blocks dangerous expression functions', () => {
    assert.equal(solveMath('import({}, {})'), null);
    assert.equal(solveMath('evaluate("1+1")'), null);
    assert.equal(solveMath('createUnit("foo")'), null);
  });
});
