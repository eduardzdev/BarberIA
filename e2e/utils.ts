import { Page, expect } from '@playwright/test';

export async function loginForTests(page: Page) {
    const TIMEOUT = 20000;

    // Se já estiver logado (dashboard visível), apenas retorna
    if (page.url().includes('dashboard')) {
        const isDashboardVisible = await page.locator('text=/Dashboard/i').first().isVisible();
        if (isDashboardVisible) return;
    }

    // Navega limpo para login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Preenche credenciais (usando variáveis de ambiente ou fallback de teste)
    await page.fill('input[type="email"]', 'teste@exemplo.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button:has-text("Entrar")');

    // Aguarda Dashboard com timeout estendido para o Firebase Auth processar
    await page.waitForURL(/.*dashboard.*/, { timeout: TIMEOUT });
    await expect(page.locator('text=/Dashboard/i').first()).toBeVisible({ timeout: TIMEOUT });

    // Garante que existe ao menos um serviço para os testes de agendamento não falharem
    await ensureMinimumData(page);
}

/**
 * Verifica se a conta possui dados básicos (Serviços) e cria se necessário.
 * Isso evita que testes de agendamento falhem por falta de opções no checkbox.
 */
async function ensureMinimumData(page: Page) {
    // Vamos para a página de serviços verificar se há algum
    await navigateTo(page, '#/settings-services');

    // Se aparecer "Nenhum serviço cadastrado", criamos um rápido
    const noServices = await page.locator('text=/Nenhum serviço cadastrado/i').isVisible();

    if (noServices) {
        console.log('🌱 Semeando dados iniciais: Criando primeiro serviço...');
        await page.click('button:has-text("Novo Serviço")');
        await page.fill('input[placeholder*="Corte"]', 'Corte de Teste E2E');
        await page.selectOption('select', { label: 'Cabelo (Cortado)' });
        await page.fill('input[name="duration"]', '30');
        await page.fill('input[placeholder="0.00"]', '50');
        await page.click('button:has-text("Salvar")');
        await page.waitForTimeout(1000);
    }

    // Volta para o Dashboard para limpar o estado visual
    await navigateTo(page, '#/dashboard');
}

/**
 * Aguarda a página estar pronta (sem skeletons de carregamento)
 */
export async function waitForPageReady(page: Page) {
    // Aguarda desaparecer skeletons comuns
    const skeleton = page.locator('.animate-pulse, .bg-slate-800\\/50.animate-pulse');
    try {
        await skeleton.first().waitFor({ state: 'hidden', timeout: 15000 });
    } catch (e) {
        // Se der timeout, talvez não tenha skeleton ou a página já carregou
    }
    // Aguarda um pequeno respiro para o React montar tudo
    await page.waitForTimeout(500);
}

export async function navigateTo(page: Page, path: string) {
    // Remove # ou / iniciais para padronizar
    const cleanPath = path.replace(/^[#/]+/, '');
    const targetUrl = `/${cleanPath}`;

    console.log(`🚀 Navigating to ${targetUrl}...`);

    await page.goto(targetUrl);

    // Aguarda o carregamento básico e a URL correta
    await page.waitForLoadState('domcontentloaded');

    // Pequeno delay para o Router processar
    await page.waitForTimeout(500);

    // Aguarda desaparecer loaders
    await waitForPageReady(page);

    // Garante que o conteúdo principal da página está visível
    const main = page.locator('main').first();
    try {
        await main.waitFor({ state: 'visible', timeout: 10000 });
    } catch (e) {
        console.warn('⚠️ Main element not found or not visible, continuing anyway...');
    }

    // Pequeno respiro extra para animações de entrada
    await page.waitForTimeout(500);
}
