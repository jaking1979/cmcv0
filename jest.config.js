/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/unit/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock server-only module — safe to skip in unit tests
    '^server-only$': '<rootDir>/tests/__mocks__/server-only.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
      },
      diagnostics: false,
    }],
  },
  // Suppress noisy console output during tests
  silent: false,
}

module.exports = config
