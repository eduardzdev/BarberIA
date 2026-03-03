import { test, expect } from '@playwright/test';
import { loginForTests } from './utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginForTests(page);
  });

  test('deve exibir cards de estatísticas', async ({ page }) => {
    const agendamentosCard = page.locator('text=Agendamentos').first();
    const receitaCard = page.locator('text=Receita').first();
    await expect(agendamentosCard).toBeVisible({ timeout: 10000 });
    await expect(receitaCard).toBeVisible({ timeout: 10000 });
  });

  test('deve exibir seção de próximos agendamentos', async ({ page }) => {
    const appointmentsSectionTitle = page.locator('text=/Próximos|Agendamentos/i').first();
    await expect(appointmentsSectionTitle).toBeVisible();
  });

  test('deve abrir modal de novo agendamento a partir do dashboard', async ({ page }) => {
    const newAppointmentBtn = page.locator('button:has-text("Novo Agendamento")').first();
    await expect(newAppointmentBtn).toBeVisible();
    await newAppointmentBtn.click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('deve navegar entre as seções usando menu de navegação', async ({ page }) => {
    // Tentar clicar em Clientes (abrindo menu se necessário)
    const menuBtn = page.getByTestId('menu-button');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(500);
    }

    const clientsLink = page.locator('[data-testid*="-link-clientes"]').first();
    await expect(clientsLink).toBeVisible({ timeout: 10000 });
    await clientsLink.click();

    // Verificar se URL mudou
    await page.waitForURL(/.*clients.*/, { timeout: 10000 });

    // Verificar título da página
    const clientsTitle = page.locator('h1').filter({ hasText: /Clientes/i }).first();
    await expect(clientsTitle).toBeVisible();
  });
});
