/** Istanbul NYC — coverage for Coding Shield (needs tests) */
export default {
  all: true,
  include: ['backend/lib/**/*.js', 'project/src/**/*.{ts,tsx}'],
  exclude: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/node_modules/**',
    '**/dist/**',
    'coding-shield/**',
  ],
  reporter: ['text', 'json', 'lcov'],
  'report-dir': 'coding-shield/reports/coverage',
  tempDir: 'coding-shield/reports/.nyc_output',
  checkCoverage: false,
};
