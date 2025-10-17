import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

const ADMIN_USER = process.env.ADMIN_USER || 'admin1';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

test('login as admin -> app page', async ({ page }) => {
  await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
  await expect(page.getByText('Мои чаты')).toBeVisible();
});