import { test, expect } from '@playwright/test';
import { loginForTests, navigateTo } from './utils';

test.describe('Agenda', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // 60s
    await loginForTests(page);
    await navigateTo(page, 'agenda');
  });

  test('deve exibir visualização da agenda', async ({ page }) => {
    // Verificar título exato
    await expect(page.locator('text=/agenda/i').first()).toBeVisible();
  });

  test('deve alternar entre visualizações (dia/semana/mês)', async ({ page }) => {
    // Assegurar que os botões estão visíveis e declarados
    const calendarBtn = page.getByTestId('view-calendar');
    const kanbanBtn = page.getByTestId('view-kanban');
    const timelineBtn = page.getByTestId('view-timeline');

    await expect(calendarBtn).toBeVisible({ timeout: 10000 });
    await expect(kanbanBtn).toBeVisible();
    await expect(timelineBtn).toBeVisible();

    // Alternar para Kanban
    await kanbanBtn.click();
    // A visualização Kanban tem colunas com data-status
    await page.locator('[data-status]').first().waitFor({ state: 'visible', timeout: 15000 });
    await expect(page.locator('[data-status]').first()).toBeVisible();

    // Alternar para Timeline
    await timelineBtn.click();
    // A timeline por padrão mostra horários disponíveis (pode demorar a carregar store)
    const timelineIndicator = page.locator('text=/Linha do Tempo/i');
    await timelineIndicator.waitFor({ state: 'visible', timeout: 15000 });
    await expect(timelineIndicator).toBeVisible();

    // Alternar para Calendário
    await calendarBtn.click();
    const calendarIndicator = page.locator('text=/Próximos 7 Dias/i');
    await calendarIndicator.waitFor({ state: 'visible', timeout: 15000 });
    await expect(calendarIndicator).toBeVisible();
  });

  test('deve navegar entre datas', async ({ page }) => {
    const prevBtn = page.getByTestId('prev-day');
    const todayBtn = page.getByTestId('today-btn');
    const nextBtn = page.getByTestId('next-day');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    await prevBtn.click();
    await page.waitForTimeout(500);

    await nextBtn.click();
    await page.waitForTimeout(500);

    await todayBtn.click();
    await page.waitForTimeout(500);

    // O texto deve ser "Hoje" se for a data atual
    await expect(todayBtn).toHaveText(/Hoje/i);
  });

  test('deve abrir modal de novo agendamento ao clicar em horário do calendário', async ({ page }) => {
    // Assegurar visão de Timeline (onde tem horários disponíveis)
    const dayBtn = page.locator('button:has-text("Timeline")').first();
    await dayBtn.click();

    // Localiza uma célula clicável de horário no calendário
    const timeSlots = page.locator('button:has-text("Horário disponível")');

    // Garante que o calendário renderizou as células
    await expect(timeSlots.first()).toBeVisible({ timeout: 10000 });

    // Clica no primeiro horário disponível
    await timeSlots.first().click();

    // Modal de agendamento DEVE abrir
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 4000 });
  });
});
