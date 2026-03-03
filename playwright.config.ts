import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para BarberIA
 * 
 * Features:
 * - Testes E2E para todas as features
 * - Screenshots e vídeos de falhas
 * - Parallel execution
 * - Retry automático
 */
export default defineConfig({
  testDir: './e2e',

  // Timeout por teste (30 segundos)
  timeout: 120000,

  // Configurações globais
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  expect: {
    timeout: 20000,
  },

  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    // Base URL da aplicação (detecta porta automaticamente)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Screenshot em falhas
    screenshot: 'only-on-failure',

    // Vídeo em falhas
    video: 'retain-on-failure',

    // Trace em falhas
    trace: 'on-first-retry',
  },

  // Configuração de projetos (browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Dev server (inicia automaticamente antes dos testes)
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
