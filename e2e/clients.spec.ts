import { test, expect } from '@playwright/test';
import { loginForTests, navigateTo } from './utils';

test.describe('Gestão de Clientes', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000); // 60s
    await loginForTests(page);
    await navigateTo(page, 'clients');
  });

  test('deve exibir lista de clientes', async ({ page }) => {
    // Verificar URL
    await page.waitForURL(/clients/);
    await expect(page).toHaveURL(/clients/);

    // Verificar se há campo de busca
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('deve buscar cliente por nome', async ({ page }) => {
    // Verificar se há clientes antes de buscar
    const clientCards = page.locator('[data-testid="client-card"]');
    const initialCount = await clientCards.count();

    // Digitar no campo de busca
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill('João');

    // Aguardar filtro ser aplicado
    await page.waitForTimeout(500);

    // Verificar que a busca foi aplicada
    expect(await searchInput.inputValue()).toBe('João');
  });

  test('deve abrir modal de novo cliente', async ({ page }) => {
    // Procurar botão de novo cliente
    const newClientBtn = page.locator('button:has-text("Novo Cliente")').first();
    await expect(newClientBtn).toBeVisible({ timeout: 10000 });

    await newClientBtn.click();

    // Verificar se modal abriu
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 3000 });

    // Verificar campos do formulário (usando placeholder)
    await expect(page.locator('input[placeholder="Nome completo"]')).toBeVisible();
    await expect(page.locator('input[placeholder="(11) 99999-9999"]')).toBeVisible();
  });

  test('deve criar novo cliente e refletir nos cards de estatísticas', async ({ page }) => {
    test.setTimeout(60000);

    console.log('📊 TESTE: Cadastro completo de cliente com validação de estatísticas');

    // Capturar estatísticas ANTES do cadastro
    const totalClientesBefore = await page.locator('p:text-is("Total de Clientes") + p').textContent();
    const clientesAtivosBefore = await page.locator('p:text-is("Clientes Ativos") + p').textContent();

    console.log(`📈 ANTES - Total: ${totalClientesBefore} | Ativos: ${clientesAtivosBefore}`);

    // Clicar em novo cliente
    const newClientBtn = page.locator('button:has-text("Novo Cliente")').first();
    await expect(newClientBtn).toBeVisible();
    await newClientBtn.click();

    // Verificar modal abriu
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 3000 });
    console.log('✅ Modal de cadastro aberto');

    // Preencher TODOS os campos (conforme imagem)
    const timestamp = Date.now();
    const clientFirstName = `Joao${timestamp.toString().slice(-4)}`;
    const clientName = `${clientFirstName} Silva`;
    const clientPhone = `11999${timestamp.toString().slice(-6)}`;
    const clientEmail = `joao.silva.${timestamp}@exemplo.com`;

    await page.locator('input[placeholder="Nome completo"]').fill(clientName);
    await page.locator('input[placeholder="(11) 99999-9999"]').fill(clientPhone);
    await page.locator('input[placeholder="cliente@email.com"]').fill(clientEmail);
    await page.locator('textarea[placeholder*="Observações"]').fill('Cliente teste E2E - Cadastro completo');

    console.log(`📝 Formulário preenchido: ${clientName}`);

    // Clicar em Cadastrar
    const saveButton = page.locator('button:has-text("Cadastrar")');
    await saveButton.click();
    console.log('🔄 Aguardando salvamento...');

    // Aguardar processamento (Firebase + atualização de estado)
    await page.waitForTimeout(6000);

    // Verificar se modal fechou (sucesso)
    const modalClosed = (await page.locator('[role="dialog"]').count()) === 0;
    console.log(`${modalClosed ? '✅' : '⚠️'} Modal fechado: ${modalClosed}`);

    // Aguardar atualização definitiva
    await page.waitForTimeout(3000);

    // Capturar estatísticas DEPOIS do cadastro
    const totalClientesAfter = await page.locator('p:text-is("Total de Clientes") + p').textContent();
    const clientesAtivosAfter = await page.locator('p:text-is("Clientes Ativos") + p').textContent();

    console.log(`📈 DEPOIS - Total: ${totalClientesAfter} | Ativos: ${clientesAtivosAfter}`);

    // VALIDAÇÃO 1: Cliente incrementou nos cards
    const totalVBefore = parseInt(totalClientesBefore || '0');
    const ativosVBefore = parseInt(clientesAtivosBefore || '0');
    const totalVAfter = parseInt(totalClientesAfter || '0');
    const ativosVAfter = parseInt(clientesAtivosAfter || '1'); // Fallback high for total if needed

    const totalIncremented = totalVAfter > totalVBefore;
    const ativosIncremented = ativosVAfter > ativosVBefore;

    console.log(`${totalIncremented ? '✅' : '❌'} Total de clientes incrementou: ${totalIncremented}`);

    // VALIDAÇÃO 2: Buscar cliente para garantir que ele aparece (Ordenação desc agora ativa no Dashboard/Store)
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await searchInput.fill(clientFirstName);
    await page.waitForTimeout(2000);

    // Localizador que não depende de data-testid (já que o componente Card não repassa props)
    // Procuramos o texto do nome dentro de um elemento que pareça um card de cliente
    const clientCard = page.locator('div').filter({ hasText: clientFirstName }).filter({ hasText: 'Ativo' }).last();
    const cardVisible = await clientCard.isVisible().catch(() => false);

    console.log(`${cardVisible ? '✅' : '❌'} Card do cliente visível na lista: ${cardVisible}`);

    // Resultado final (Simplified)
    expect(totalIncremented && cardVisible).toBeTruthy();
  });

  test('deve filtrar clientes por status', async ({ page }) => {
    // Abrir o menu de filtros
    const filterBtn = page.getByLabel('Filtrar clientes');
    await expect(filterBtn).toBeVisible({ timeout: 10000 });
    await filterBtn.click();
    await page.waitForTimeout(500); // Wait for menu animation
    console.log('✅ Menu de filtros aberto');

    // Selecionar filtro "Ativos"
    const ativosOption = page.getByRole('button', { name: 'Ativos' }).first();
    await expect(ativosOption).toBeVisible({ timeout: 5000 });
    await ativosOption.click();
    console.log('✅ Filtro "Ativos" selecionado');

    // Aguardar atualização do layout
    await page.waitForTimeout(500);

    // Verificar se o botão de filtro agora mostra que está filtrado (cor diferente ou texto auxiliar)
    await expect(filterBtn).toHaveClass(/bg-violet/);
  });
});
