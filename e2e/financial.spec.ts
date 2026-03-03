import { test, expect } from '@playwright/test';
import { loginForTests, navigateTo } from './utils';

test.describe('Financeiro', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(60000); // 60s
        await loginForTests(page);
        await navigateTo(page, 'financial');
    });

    test('deve exibir cards de resumo financeiro', async ({ page }) => {
        // Título e Overview existem
        await expect(page.locator('text=/Financeiro/i').first()).toBeVisible();

        // Cards existem (StatsCard titles)
        await expect(page.locator('text=Receita Mensal').first()).toBeVisible();
        await expect(page.locator('text=Receita Semanal').first()).toBeVisible();
        await expect(page.locator('text=Receita Diária').first()).toBeVisible();
        await expect(page.locator('text=Lucro Líquido').first()).toBeVisible();
    });

    test('deve abrir modal de Nova Transação', async ({ page }) => {
        // Garantir que a página carregou as transações
        await page.waitForSelector('text=Financeiro', { timeout: 10000 });
        await page.waitForTimeout(2000); // Wait for stats/skeleton flip

        // Clicar em Nova Transação
        const newTxBtn = page.getByTestId('new-transaction-btn');
        await expect(newTxBtn).toBeVisible({ timeout: 15000 });
        await newTxBtn.click({ force: true });

        // Validar abertura do modal
        const modal = page.locator('[role="dialog"]').first();
        await expect(modal).toBeVisible({ timeout: 3000 });

        // Verificar campos principais (agora usa select)
        const typeSelect = modal.locator('select').first();
        await expect(typeSelect).toBeVisible();

        const descriptionInput = modal.locator('input[placeholder*="Ex:"]').first();
        await expect(descriptionInput).toBeVisible();

        const amountInput = modal.locator('input[placeholder="0.00"]').first();
        await expect(amountInput).toBeVisible();
    });

    test('deve renderizar a tabela / lista de transações recentes', async ({ page }) => {
        // Verifica título da lista 
        await expect(page.locator('text=/Transações Recentes/i').first()).toBeVisible();

        // Caso a lista esteja vazia, ela deve exibir o texto amigável ou o item de transação
        const emptyText = page.locator('text=/Nenhuma transação registrada ainda/i');
        const transactionItem = page.locator('text=VER DETALHES').first();

        await expect(emptyText.or(transactionItem)).toBeVisible();
    });
});
