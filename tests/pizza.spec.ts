import { test, expect } from 'playwright-test-coverage';
import type { Page } from '@playwright/test';

const token = 'test-token';

//users represents potential
const users = {
  diner: { id: '2', name: 'Pizza Diner', email: 'd@jwt.com', roles: [{ role: 'diner' }] },
  admin: { id: '1', name: 'Admin User', email: 'admin@jwt.test', roles: [{ role: 'admin' }] },
  franchisee: { id: '3', name: 'Fran Chisee', email: 'franchise@jwt.test', roles: [{ role: 'franchisee', objectId: '10' }] },
};

const adminUsers = [
  { id: '101', name: 'Kai Chen', email: 'kai@jwt.com', roles: [{ role: 'diner' }] },
  { id: '102', name: 'Buddy', email: 'buddy@jwt.com', roles: [{ role: 'admin' }] },
  { id: '103', name: 'Sam', email: 'sam@jwt.com', roles: [{ role: 'diner' }] },
  { id: '104', name: 'Riley', email: 'riley@jwt.com', roles: [{ role: 'franchisee' }] },
  { id: '105', name: 'Diner One', email: 'diner1@jwt.com', roles: [{ role: 'diner' }] },
  { id: '106', name: 'Diner Two', email: 'diner2@jwt.com', roles: [{ role: 'diner' }] },
  { id: '107', name: 'Diner Three', email: 'diner3@jwt.com', roles: [{ role: 'diner' }] },
  { id: '108', name: 'Diner Four', email: 'diner4@jwt.com', roles: [{ role: 'diner' }] },
  { id: '109', name: 'Diner Five', email: 'diner5@jwt.com', roles: [{ role: 'diner' }] },
  { id: '110', name: 'Diner Six', email: 'diner6@jwt.com', roles: [{ role: 'diner' }] },
  { id: '111', name: 'Luca Doe', email: 'luca@jwt.com', roles: [{ role: 'diner' }] },
  { id: '112', name: 'Mia Doe', email: 'mia@jwt.com', roles: [{ role: 'diner' }] },
];

const menuRes = [
  { id: '1', title: 'Veggie', image: 'pizza1.png', price: 0.0038, description: 'A garden of delight' },
  { id: '2', title: 'Pepperoni', image: 'pizza2.png', price: 0.0042, description: 'Spicy treat' },
  { id: '3', title: 'Margarita', image: 'pizza3.png', price: 0.0042, description: 'Essential classic' },
];

const franchise = {
  id: '10',
  name: 'JWT Provo',
  admins: [{ email: 'franchise@jwt.test', name: 'Fran Chisee' }],
  stores: [{ id: '20', name: 'Downtown', totalRevenue: 12.5 }],
};

const order = {
  id: 'order-1',
  franchiseId: franchise.id,
  storeId: franchise.stores[0].id,
  date: '2026-09-30T12:00:00.000Z',
  items: [{ menuId: '1', description: 'Veggie', price: 0.0038 }],
};

//Mocking the backend all in one function is far easier to keep track of, and far more scalable. 
//initialUser isn't a full user; it's moreso saying "I want to make this call as if I were an Admin/Diner/Franchisee/LoggedOutUser"
async function mockBackend(page: Page, initialUser: (typeof users)[keyof typeof users] | null = null) {
  let userDirectory = adminUsers.map((user) => ({ ...user, roles: [...user.roles] }));
  const userListRequests: string[] = [];
  const deletedUserIds: string[] = [];
  
  //Determine whether we are an authenticated user or not. If initialUser is blank, authenticatedUser will also be blank.
  //Authenticated user is persisted forever, since mockBackend itself never returns; it's routing functions return, but mockBackend doesn't ever leave the stack; it is always listening.
  let authenticatedUser = initialUser;
  await page.addInitScript(
    (authToken) => {
      if (authToken) localStorage.setItem('token', authToken);
    },
    initialUser ? token : '',
  );

  //Trivial routing case. Just a version test.
  await page.route('**/version.json', (route) => route.fulfill({ json: { version: 'test' } }));

  //The bulk of the logic: when /api is called
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const { pathname, searchParams } = new URL(request.url());
    const method = request.method();
    const body = request.postData() ? (request.postDataJSON() as { email?: string }) : null;

    //Logging out requires the most complex interaction. 
    //If we do Delete, then set authenticatedUser to null and return empty JSON.
    if (pathname.endsWith('/api/auth')) {
      if (method === 'DELETE') {
        authenticatedUser = null;
        return route.fulfill({ json: {} });
      }
      //If we are not an authenticatedUser, mock an unauthenticated response.
      if (body?.email === 'bad@jwt.test') return route.fulfill({ status: 401, json: { message: 'invalid credentials' } });
      //If the method is 'POST' choose to use users.diner 
      //If the email matches the admin email, choose to use users.admin
      //If the email matches the franchisee eamil, choose to use users.franchisee
      //If all else fails, choose to use users.diner
      const user = method === 'POST' ? users.diner : body?.email === users.admin.email ? users.admin : body?.email === users.franchisee.email ? users.franchisee : users.diner;
      //Set authenticatedUser to the chosen user.
      authenticatedUser = user;
      //Return our chosen user and authToken.
      return route.fulfill({ json: { user, token } });
    }

    if (pathname.endsWith('/api/user/me')) return route.fulfill({ json: authenticatedUser });
    if (pathname === '/api/user' && method === 'GET') {
      userListRequests.push(request.url());
      const pageNumber = Number(searchParams.get('page') ?? 1);
      const limit = Number(searchParams.get('limit') ?? 10);
      const nameFilter = (searchParams.get('name') ?? '*').replace(/\*/g, '').toLowerCase();
      const filteredUsers = userDirectory.filter((user) => user.name.toLowerCase().includes(nameFilter));
      const start = (pageNumber - 1) * limit;
      return route.fulfill({
        json: {
          users: filteredUsers.slice(start, start + limit),
          more: start + limit < filteredUsers.length,
        },
      });
    }
    if (pathname.startsWith('/api/user/') && method === 'DELETE') {
      const userId = pathname.split('/').at(-1)!;
      deletedUserIds.push(userId);
      userDirectory = userDirectory.filter((user) => user.id !== userId);
      return route.fulfill({ json: {} });
    }
    if (pathname.endsWith('/api/order/menu')) return route.fulfill({ json: menuRes });
    if (pathname.endsWith('/api/order/verify')) return route.fulfill({ json: { message: 'valid', payload: { id: order.id } } });
    if (pathname.endsWith('/api/order') && method === 'POST') return route.fulfill({ json: { order, jwt: 'signed-test-jwt' } });
    if (pathname.endsWith('/api/order')) return route.fulfill({ json: { id: 'history-1', dinerId: '2', orders: [order] } });
    if (pathname.endsWith('/api/docs')) return route.fulfill({ json: { endpoints: [{ requiresAuth: true, method: 'GET', path: '/api/test', description: 'Test endpoint', example: '{}', response: { ok: true } }] } });
    if (pathname.endsWith('/api/franchise') && method === 'POST') return route.fulfill({ json: franchise });
    if (pathname.includes('/api/franchise/') && pathname.endsWith('/store') && method === 'POST') return route.fulfill({ json: franchise.stores[0] });
    if (pathname.includes('/api/franchise/') && pathname.includes('/store/') && method === 'DELETE') return route.fulfill({ json: {} });
    if (pathname.endsWith('/api/franchise/10') && method === 'DELETE') return route.fulfill({ json: {} });
    if (pathname.endsWith('/api/franchise/3')) return route.fulfill({ json: [franchise] });
    if (pathname.endsWith('/api/franchise/10')) return route.fulfill({ json: [franchise] });
    if (pathname.endsWith('/api/franchise') || pathname.includes('/api/franchise?')) {
      return route.fulfill({ json: { franchises: [franchise], more: Number(searchParams.get('page') ?? 0) < 1 } });
    }

    return route.fulfill({ json: {} });
  });

  return { userListRequests, deletedUserIds };
}

async function login(page: Page, email: string, password = 'password') {
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test('public pages and both API documentation sets render', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/');
  await expect(page).toHaveTitle('JWT Pizza');
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();

  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'The secret sauce' })).toBeVisible();
  await page.goto('/history');
  await expect(page.getByText('It all started in Mama Ricci\'s kitchen.')).toBeVisible();
  await page.goto('/franchise-dashboard');
  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
  await page.goto('/docs');
  await expect(page.getByText('/api/test')).toBeVisible();
  await page.goto('/docs/factory');
  await expect(page.getByText('Test endpoint')).toBeVisible();
  await page.goto('/missing-page');
  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('diner can browse, pay, verify an order, and view order history', async ({ page }) => {
  await mockBackend(page);
  await login(page, users.diner.email);
  await page.goto('/menu');
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
  await page.getByRole('combobox').selectOption(franchise.stores[0].id);
  await page.getByRole('button', { name: /Veggie/ }).click();
  await page.getByRole('button', { name: /Pepperoni/ }).click();
  await expect(page.locator('form')).toContainText('Selected pizzas: 2');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.getByRole('button', { name: 'Pay now' }).click();
  await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();
  await expect(page.getByText('signed-test-jwt')).toBeVisible();
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page.getByRole('heading', { name: /JWT Pizza - valid/ })).toBeVisible();

  await page.goto('/diner-dashboard');
  await expect(page.getByText('order-1')).toBeVisible();
  await expect(page.getByText('Franchisee on', { exact: false })).toHaveCount(0);
});

test('admin can filter, paginate, create, and close franchises and stores', async ({ page }) => {
  await mockBackend(page);
  await login(page, users.admin.email);
  await page.goto('/admin-dashboard');
  await expect(page.getByText('JWT Provo')).toBeVisible();

  await page.getByPlaceholder('Filter franchises').fill('Provo');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('button', { name: '»' }).click();
  await page.getByRole('button', { name: '«' }).click();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByPlaceholder('franchise name').fill('New Franchise');
  await page.getByPlaceholder('franchisee admin email').fill('owner@jwt.test');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('JWT Provo')).toBeVisible();

  const rows = page.locator('table').nth(1).locator('tbody');
  await rows.first().getByRole('button', { name: 'Close' }).first().click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: "Admin User's kitchen" })).toBeVisible();
  await rows.first().getByRole('button', { name: 'Close' }).nth(1).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: "Admin User's kitchen" })).toBeVisible();
});

test('only admins can see the admin dashboard navigation link', async ({ page }) => {
  await mockBackend(page);
  await login(page, users.diner.email);
  await expect(page.getByRole('link', { name: 'Admin' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Logout' }).click();
  await login(page, users.admin.email);
  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
});

test('admin can list users with their names, emails, and roles across pages', async ({ page }) => {
  const backend = await mockBackend(page);
  await login(page, users.admin.email);
  await page.goto('/admin-dashboard');

  const usersTable = page.getByRole('table', { name: 'Users' });
  await expect(usersTable).toBeVisible();
  await expect(page.getByRole('heading', { name: "Admin User's kitchen" })).toBeVisible();
  const kaiRow = usersTable.getByRole('row').filter({ hasText: 'Kai Chen' });
  await expect(kaiRow.getByRole('cell')).toHaveText(['Kai Chen', 'kai@jwt.com', 'diner', ' Delete']);
  await expect(usersTable.getByRole('row').filter({ hasText: 'Luca Doe' })).toHaveCount(0);

  const firstRequest = new URL(backend.userListRequests[0]);
  expect(firstRequest.pathname).toBe('/api/user');
  expect(firstRequest.searchParams.get('page')).toBe('1');
  expect(firstRequest.searchParams.get('limit')).toBe('10');
  expect(firstRequest.searchParams.get('name')).toBe('*');

  await expect(usersTable.getByRole('button', { name: 'Prev' })).toBeDisabled();
  await expect(usersTable.getByRole('button', { name: 'Next' })).toBeEnabled();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(usersTable.getByRole('row').filter({ hasText: 'Luca Doe' })).toBeVisible();
  await expect(usersTable.getByRole('row').filter({ hasText: 'Kai Chen' })).toHaveCount(0);
  expect(new URL(backend.userListRequests[1]).searchParams.get('page')).toBe('2');
  await expect(usersTable.getByRole('button', { name: 'Prev' })).toBeEnabled();
  await page.getByRole('button', { name: 'Prev' }).click();
  await expect(usersTable.getByRole('row').filter({ hasText: 'Kai Chen' })).toBeVisible();
  expect(new URL(backend.userListRequests[2]).searchParams.get('page')).toBe('1');
});

test('admin can filter users by name', async ({ page }) => {
  const backend = await mockBackend(page);
  await login(page, users.admin.email);
  await page.goto('/admin-dashboard');
  const usersTable = page.getByRole('table', { name: 'Users' });
  await expect(usersTable).toBeVisible();

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(usersTable.getByRole('row').filter({ hasText: 'Luca Doe' })).toBeVisible();
  await page.getByPlaceholder('Name').fill('Kai');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(usersTable.getByRole('row').filter({ hasText: 'Kai Chen' })).toBeVisible();
  await expect(usersTable.getByRole('row').filter({ hasText: 'Buddy' })).toHaveCount(0);
  const searchRequest = new URL(backend.userListRequests.at(-1)!);
  expect(searchRequest.searchParams.get('page')).toBe('1');
  expect(searchRequest.searchParams.get('name')).toBe('*Kai*');
});

test('admin can delete a user from the list', async ({ page }) => {
  const backend = await mockBackend(page);
  await login(page, users.admin.email);
  await page.goto('/admin-dashboard');
  const usersTable = page.getByRole('table', { name: 'Users' });
  await expect(usersTable).toBeVisible();

  const kaiRow = usersTable.getByRole('row').filter({ hasText: 'Kai Chen' });
  await expect(kaiRow).toBeVisible();
  page.once('dialog', (dialog) => dialog.dismiss());
  await kaiRow.getByRole('button', { name: 'Delete Kai Chen' }).click();
  await expect(kaiRow).toBeVisible();
  expect(backend.deletedUserIds).toEqual([]);

  page.once('dialog', (dialog) => dialog.accept());
  await kaiRow.getByRole('button', { name: 'Delete Kai Chen' }).click();

  await expect(kaiRow).toHaveCount(0);
  expect(backend.deletedUserIds).toEqual(['101']);
});

test('franchisee can manage a store and see the franchise dashboard', async ({ page }) => {
  await mockBackend(page);
  await login(page, users.franchisee.email);
  await page.goto('/franchise-dashboard');
  await expect(page.getByRole('heading', { name: 'JWT Provo' })).toBeVisible();
  await page.getByRole('button', { name: 'Create store' }).click();
  await page.getByPlaceholder('store name').fill('Campus');
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('heading', { name: 'JWT Provo' })).toBeVisible();
});

test('registration, failed login, and logout are handled', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/register');
  await page.getByPlaceholder('Full name').fill('New Diner');
  await page.getByPlaceholder('Email address').fill('new@jwt.test');
  await page.getByPlaceholder('Password').fill('password');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'PD' })).toBeVisible();

  await page.getByRole('link', { name: 'Logout' }).click();
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
  await page.goto('/login');
  await page.getByPlaceholder('Email address').fill('bad@jwt.test');
  await page.getByPlaceholder('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText(/invalid credentials/)).toBeVisible();
});

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});