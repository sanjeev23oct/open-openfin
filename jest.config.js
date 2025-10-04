module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@desktop-interop/rvm$': '<rootDir>/packages/rvm/src',
    '^@desktop-interop/runtime$': '<rootDir>/packages/runtime/src',
    '^@desktop-interop/sdk$': '<rootDir>/packages/sdk/src',
    '^@desktop-interop/fdc3$': '<rootDir>/packages/fdc3/src',
    '^@desktop-interop/provider$': '<rootDir>/packages/provider/src'
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!packages/**/*.spec.ts',
    '!packages/**/*.test.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
