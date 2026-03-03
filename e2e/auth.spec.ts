import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {

  test('deve fazer login com sucesso', async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/');

    // Aguardar carregamento
    await page.waitForLoadState('domcontentloaded');

    // Verificar se está na página de login (deve ter título BarberIA)
    await expect(page.locator('text=BarberIA')).toBeVisible();

    // Preencher formulário
    await page.fill('input[type="email"]', 'teste@exemplo.com');
    await page.fill('input[type="password"]', 'senha123');

    // Clicar no botão de login (texto "Entrar")
    await page.click('button:has-text("Entrar")');

    // Aguardar navegação ou mensagem de erro
    await page.waitForTimeout(2000);

    // Teste passa verificando o direcionamento real
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.fill('input[type="email"]', 'invalido@exemplo.com');
    await page.fill('input[type="password"]', 'senhaerrada');

    await page.click('button:has-text("Entrar")');

    // Aguardar resposta do Firebase
    await page.waitForTimeout(3000);

    // Verificar mensagem de erro precisa
    await expect(page.locator('text=/erro|inválid|incorrect|wrong/i').first()).toBeVisible();
  });

  test('deve navegar para página de registro', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Clicar na tab de Cadastro
    await page.click('button:has-text("Cadastro")');

    // Mudar de tab ativa a animação. Vamos aguardar e verificar um dos planos na vitrine.
    await page.waitForTimeout(1000);
    const planoPremium = page.locator('text=/premium|básico/i').first();
    await expect(planoPremium).toBeVisible({ timeout: 5000 });
  });

  test('deve ter botão de continuar com Google', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verificar botão Google
    await expect(page.locator('button:has-text("Continuar com Google")')).toBeVisible();
  });
});
