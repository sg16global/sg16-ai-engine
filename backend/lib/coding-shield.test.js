import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aggregateShieldScore } from '../../coding-shield/lib/score.mjs';
import { detectLanguage, resolveLanguage } from '../../coding-shield/lib/language.mjs';
import { detectPackages } from '../../coding-shield/lib/packages.mjs';

const ok = (tool, extra = {}) => ({ tool, ok: true, summary: 'ok', errorCount: 0, ...extra });

describe('Coding Shield score', () => {
  it('does not give free points for categories no tool checked', () => {
    const report = aggregateShieldScore([ok('acorn-esprima'), ok('eslint'), { tool: 'gitleaks', ok: true, leakCount: 0 }]);
    assert.equal(report.categories.dependencies.score, null);
    assert.equal(report.categories.coverage.score, null);
    assert.equal(report.score, 100);
  });

  it('caps code with a security problem at C', () => {
    const report = aggregateShieldScore([
      ok('acorn-esprima'),
      ok('eslint'),
      { tool: 'semgrep', ok: false, summary: '1 finding(s)', findingCount: 1, findings: [{ line: 4, message: 'SQL', severity: 'error' }] },
    ]);
    assert.ok(report.score <= 69, `score ${report.score}`);
    assert.equal(report.issues[0].line, 4);
    assert.equal(report.issues[0].category, 'security');
  });

  it('gives code that does not parse an F', () => {
    const report = aggregateShieldScore([
      { tool: 'python-syntax', ok: false, summary: 'syntax error', errorCount: 1, messages: [{ line: 5, message: 'Syntax error' }] },
      { tool: 'gitleaks', ok: true, leakCount: 0 },
    ]);
    assert.equal(report.grade, 'F');
  });

  it('ignores skipped tools and marks the report limited', () => {
    const report = aggregateShieldScore([ok('python-syntax'), { tool: 'eslint', ok: true, summary: 'skipped', skipped: true }]);
    assert.equal(report.limited, true);
    assert.equal(report.categories.quality.score, null);
  });
});

describe('Coding Shield language detection', () => {
  it('reads ES-module JavaScript as JavaScript, not Python', () => {
    assert.equal(detectLanguage("import express from 'express';\nconst app = express();\n"), 'javascript');
  });

  it('detects Python and TypeScript', () => {
    assert.equal(detectLanguage('import os\n\ndef run(cmd):\n    os.system(cmd)\n'), 'python');
    assert.equal(detectLanguage('interface User {\n  id: number;\n}\nexport const a = 1;\n'), 'typescript');
  });

  it('prefers an explicit language name', () => {
    assert.equal(resolveLanguage('Python', 'const a = 1;'), 'python');
    assert.equal(resolveLanguage('auto', 'const a = 1;'), 'javascript');
  });
});

describe('Coding Shield packages', () => {
  it('lists npm packages, skipping relative paths and Node built-ins', () => {
    const deps = detectPackages(
      "import express from 'express';\nimport { a } from './a.js';\nimport fs from 'node:fs';\nimport path from 'path';\nconst { z } = require('zod/v4');\nimport x from '@scope/pkg/sub';\n",
      'javascript',
    );
    assert.deepEqual(deps.packages, ['express', '@scope/pkg', 'zod']);
    assert.equal(deps.installCommand, 'npm install express @scope/pkg zod');
  });

  it('lists pip packages with their install names, skipping the standard library', () => {
    const deps = detectPackages('import os, json\nimport requests\nfrom bs4 import BeautifulSoup\nimport cv2 as cv\n', 'python');
    assert.deepEqual(deps.packages, ['beautifulsoup4', 'requests', 'opencv-python']);
    assert.equal(deps.installCommand, 'pip install beautifulsoup4 requests opencv-python');
  });

  it('returns no command when nothing needs installing', () => {
    assert.equal(detectPackages('const a = 1;', 'javascript').installCommand, null);
  });
});
