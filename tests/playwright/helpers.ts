import { Page, expect } from '@playwright/test';

export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');
  // найдем поля максимально толерантно
  const userSel = ['#username', 'input[name="username"]', 'input[placeholder*="логин" i]', 'input[type="text"]'];
  const passSel = ['#password', 'input[name="password"]', 'input[placeholder*="парол" i]', 'input[type="password"]'];
  let userFound = false, passFound = false;

  for (const s of userSel) { const el = await page.$(s); if (el) { await page.fill(s, username); userFound = true; break; } }
  if (!userFound) {
    // fallback - первый текстовый инпут
    const first = await page.$('input[type="text"]');
    if (first) { await first.fill(username); userFound = true; }
  }
  for (const s of passSel) { const el = await page.$(s); if (el) { await page.fill(s, password); passFound = true; break; } }
  if (!passFound) {
    const first = await page.$('input[type="password"]');
    if (first) { await first.fill(password); passFound = true; }
  }
  // кнопка входа
  const btn = await page.$('button:has-text("Войти"), button[type="submit"]') || await page.$('button');
  if (btn) await btn.click(); else await page.keyboard.press('Enter');

  // ждём редирект на /app
  await page.waitForURL('**/app', { timeout: 10000 });
  await expect(page.locator('text=Мои чаты')).toBeVisible({ timeout: 5000 });
}

export async function selectChatOrFirst(page: Page, labelPreferred: string) {
  // попробуем найти чат по тексту
  const preferred = page.locator('#chats >> text=' + labelPreferred);
  if (await preferred.count()) {
    await preferred.first().click();
  } else {
    // fallback - первый чат
    await page.locator('#chats button').first().click();
  }
}