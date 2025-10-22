/**
 * Jest Configuration for Issue #79 - Admin Portal Security Tests
 * 100% Coverage Campaign Configuration
 */

module.exports = {
  displayName: 'Issue #79 - Admin Portal Security',
  rootDir: '../..',
  testMatch: [
    '<rootDir>/tests/issue-79/**/*.test.{js,ts,tsx}',
    '<rootDir>/apps/admin-frontend/src/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/apps/backend/src/auth/__tests__/**/*.test.{ts}'
  ],
  collectCoverageFrom: [
    'apps/admin-frontend/src/**/*.{ts,tsx}',
    'apps/backend/src/auth/**/*.{ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.config.{js,ts}',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/.next/**'
  ],
  coverageDirectory: '<rootDir>/coverage/issue-79',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/issue-79/test-setup.js'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/apps/admin-frontend/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: '<rootDir>/apps/admin-frontend/tsconfig.json'
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 30000,
  maxWorkers: 4,
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: '<rootDir>/coverage/issue-79/html-report',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Issue #79 - Admin Portal Security Test Report',
      includeFailureMsg: true,
      includeCoverageReport: true
    }]
  ]
};