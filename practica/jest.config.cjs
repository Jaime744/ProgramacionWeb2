// Fase 5 — Configuración de Jest para tests de integración
module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.js$': 'babel-jest' },
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30_000,
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    // Estos servicios se mockean en los tests (no se debe tocar R2 ni generar PDFs reales)
    '!src/services/storage.service.js',
    '!src/services/pdf.service.js',
  ],
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  70,
      lines:      70,
      statements: 70,
    },
  },
}
