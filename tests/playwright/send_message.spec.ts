import { test, expect } from '@playwright/test';
import { loginViaUI, selectChatOrFirst } from './helpers';

const ADMIN_USER = process.env.ADMIN_USER || 'admin1';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

test('send message to a group chat', async ({ page }) => {
  await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
  await selectChatOrFirst(page, 'Руководство');

  const uniq = 'auto-msg-' + Date.now();
  await page.fill('#text', uniq);
  await page.click('button:has-text("Отправить")');
  await expect(page.locator('#messages >> text=' + uniq)).toBeVisible();
});