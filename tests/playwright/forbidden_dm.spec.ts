import { test, expect } from '@playwright/test';
import { loginViaUI } from './helpers';

const ADMIN_USER = process.env.ADMIN_USER || 'admin1';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const EMP1_USER = process.env.EMP1_USER || 'emp_sales_1';
const EMP1_PASS = process.env.EMP1_PASS || 'emp123';
const EMP2_USER = process.env.EMP2_USER || 'emp_sales_2';

test('employee cannot DM another employee - server returns 403', async ({ page }) => {
  // 1) как админ получим id второй жертвы (emp_sales_2)
  await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
  const emp2 = await page.evaluate(async (username) => {
    const r = await fetch('/api/users/search?q=' + encodeURIComponent(username));
    const list = await r.json();
    return list.find((u: any) => u.username === username) || null;
  }, EMP2_USER);
  expect(emp2).toBeTruthy();
  const emp2Id = emp2.id as number;

  // 2) выходим и входим как emp_sales_1
  await page.evaluate(async () => { await fetch('/api/auth/logout', { method: 'POST' }); });
  await page.context().clearCookies();
  await page.goto('/login');
  await loginViaUI(page, EMP1_USER, EMP1_PASS);

  // 3) пробуем отправить ЛС напрямую через fetch (UI не дает выбрать запрещенного адресата)
  const status = await page.evaluate(async (rid) => {
    const r = await fetch('/api/messages/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId: rid, content: 'should be forbidden ' + Date.now() }),
    });
    return r.status;
  }, emp2Id);

  expect(status).toBe(403);
});