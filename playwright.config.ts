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
  timeout: 30 * 1000,
  
  // Configurações globais
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    // Base URL da aplicação (detecta porta automaticamente)
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',
    
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
    url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
