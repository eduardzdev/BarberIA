import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const { baseURL } = config.projects[0].use;
    const browser = await chromium.launch();
    const page = await browser.newPage();

    console.log(`Logando para testes em ${baseURL}`);
    await page.goto(baseURL!);

    // Realiza login com o usuário teste fixo
    await page.fill('input[type="email"]', 'teste@exemplo.com');
    await page.fill('input[type="password"]', 'senha123');
    await page.click('button:has-text("Entrar")');

    // Aguarda carregar o auth state via rede
    await page.waitForURL(/.*dashboard.*/, { timeout: 15000 });

    console.log('Autenticação global com sucesso. Salvando StorageState...');
    // Salva o auth context e Firebase IndexDB para os testes futuros usarem de forma isolada e rápida
    await page.context().storageState({ path: 'e2e/storageState.json' });

    await browser.close();
}

export default globalSetup;
