const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4208, strictPort: true } });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => { if (!localStorage.getItem('hisabiq-theme')) localStorage.setItem('hisabiq-theme', 'light'); });
    const page = await context.newPage();
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.method() !== 'GET') requests.push(request.url()); });
    const go = async path => { await page.goto('http://127.0.0.1:4208/#' + path); };
    const language = async value => {
      await page.getByRole('combobox', { name: /Language|ভাষা/ }).click();
      await page.getByRole('option', { name: value, exact: true }).click();
    };
    await go('/login');
    await page.getByRole('heading', { name: 'Sign in', exact: true }).waitFor({ timeout: 8000 });
    await language('English');
    const phone = page.getByLabel('Mobile number', { exact: true });
    const password = page.getByLabel('Password', { exact: true });
    assert.equal(await phone.inputValue(), '');
    assert.equal(await password.inputValue(), '');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert.equal(await phone.getAttribute('aria-invalid'), 'true');
    assert.equal(await phone.evaluate(el => el === document.activeElement), true);
    await phone.fill('123');
    await password.fill('NotARealPassword!123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert.equal(await phone.getAttribute('aria-invalid'), 'true');
    await phone.fill('০১৭১১-০০০২৪৫');
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    assert.equal(await password.getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Hide password', exact: true }).click();
    assert.equal(await password.getAttribute('type'), 'password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'No sign-in request was sent' }).waitFor();
    assert.equal(await phone.inputValue(), '01711000245');
    assert.equal(await password.inputValue(), '');
    assert.match(page.url(), /#\/login$/);

    await page.getByRole('link', { name: 'Forgot password?', exact: true }).click();
    await page.getByRole('heading', { name: 'Recover password', exact: true }).waitFor();
    await go('/login');
    await page.getByRole('link', { name: 'Create account', exact: true }).click();
    await page.getByRole('heading', { name: 'Create account', exact: true }).waitFor();
    await go('/login');
    const google = page.getByRole('button', { name: 'Continue with Google', exact: true });
    await google.click();
    await page.getByRole('dialog', { name: 'Continue with Google' }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await google.evaluate(el => el === document.activeElement), true);

    await page.getByRole('navigation', { name: 'Login design states' }).getByRole('link', { name: 'Quick PIN', exact: true }).click();
    const pin = page.getByLabel('Enter your 6-digit PIN', { exact: true });
    await pin.waitFor();
    await pin.fill('০০০১২৩');
    assert.equal(await pin.inputValue(), '000123');
    assert.equal(await page.locator('[data-numeric-input]').count(), 0, 'PIN must not become an arithmetic quantity');
    await pin.press('ArrowUp');
    assert.equal(await pin.inputValue(), '000123');
    await page.evaluate(() => { location.hash = '/login/pin?account=nusrat'; });
    await page.getByText('Nusrat Jahan', { exact: true }).waitFor();
    assert.equal(await pin.inputValue(), '', 'Changing the selected sample account must clear an unsubmitted PIN');
    await pin.fill('000123');
    await page.evaluate(() => { location.hash = '/login/pin?account=unknown'; });
    await page.getByText('Rahim Ahmed', { exact: true }).waitFor();
    assert.equal(await pin.inputValue(), '', 'Falling back from an unknown sample account must clear the previous PIN');
    await pin.fill('123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    assert.equal(await pin.getAttribute('aria-invalid'), 'true');
    await pin.fill('000123');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'No sign-in request was sent' }).waitFor();
    assert.equal(await pin.inputValue(), '');
    await page.getByRole('link', { name: 'Switch account', exact: true }).click();
    await page.getByRole('link', { name: /Nusrat Jahan/ }).click();
    await page.getByText('Nusrat Jahan', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Enter your 6-digit PIN', { exact: true }).inputValue(), '');
    await page.getByRole('link', { name: 'Use password or Google', exact: true }).click();
    assert.equal(await page.getByLabel('Password', { exact: true }).inputValue(), '');
    await page.getByLabel('Password', { exact: true }).fill('NotARealPassword!123');
    await page.getByRole('navigation', { name: 'Login design states' }).getByRole('link', { name: 'Quick PIN', exact: true }).click();
    await page.getByLabel('Enter your 6-digit PIN', { exact: true }).fill('000123');
    await page.getByRole('link', { name: 'Use password or Google', exact: true }).click();
    assert.equal(await page.getByLabel('Password', { exact: true }).inputValue(), '', 'Leaving an unsubmitted form must clear its secret');

    const storage = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]));
    assert.ok(!storage.includes('NotARealPassword!123') && !storage.includes('000123'), 'Secrets must stay out of browser storage');
    assert.deepEqual(requests, [], 'Preview controls must not send auth or OTP requests');

    const screenshotDir = process.env.AUTH_SCREENSHOT_DIR;
    if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });
    const capture = async name => {
      if (!screenshotDir) return;
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: screenshotDir + '/' + name + '.png', fullPage: true });
    };
    const accessible = async () => {
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector('.auth-preview'), {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      })).violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) })));
      assert.deepEqual(violations, [], 'Authentication preview must meet automated WCAG AA checks');
    };
    for (const theme of ['light', 'dark']) {
      await page.evaluate(theme => { localStorage.setItem('hisabiq-theme', theme); location.reload(); }, theme);
      await page.waitForLoadState('domcontentloaded');
      for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 900, 1024], ['mobile', 390, 844], ['small', 320, 740]]) {
        await page.setViewportSize({ width, height });
        for (const [option, heading] of [['English', 'Sign in'], ['বাংলা', 'সাইন ইন'], ['English + বাংলা', 'Sign in']]) {
          await go('/login');
          await language(option);
          await page.getByRole('heading', { name: heading, exact: true }).waitFor();
          for (const [route, englishTitle, banglaTitle] of [['/login', 'Sign in', 'সাইন ইন'], ['/login/pin', 'Welcome back', 'আবার স্বাগতম'], ['/login/accounts', 'Choose account', 'অ্যাকাউন্ট বাছুন'], ['/signup', 'Create account', 'অ্যাকাউন্ট খুলুন'], ['/recovery', 'Recover password', 'পাসওয়ার্ড পুনরুদ্ধার']]) {
            const state = route.split('/').pop();
            await go(route);
            await page.getByRole('heading', { name: option === 'বাংলা' ? banglaTitle : englishTitle, exact: true }).waitFor();
            assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
            assert.equal(await page.getByRole('combobox', { name: /Language|ভাষা/ }).count(), 1);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${state}/${theme}/${name}/${option}: horizontal overflow`);
            if (width <= 390 && state !== 'accounts') {
              const button = await page.locator('form button[type="submit"]').boundingBox();
              assert.ok(button && button.height >= 44, 'Mobile primary action must remain touch-sized');
            }
            if (option === 'English + বাংলা' && ['desktop', 'mobile'].includes(name)) {
              await accessible();
              if (screenshotDir) {
                await page.evaluate(() => document.fonts.ready);
                await page.screenshot({ path: `${screenshotDir}/${name}-${state || 'login'}-${theme}.png`, fullPage: true });
              }
            }
          }
        }
      }
    }
    await language('English');
    await go('/login');
    await page.reload();
    await page.getByRole('heading', { name: 'Sign in', exact: true }).waitFor();
    for (const state of ['pin', 'accounts']) {
      await go('/login/' + state);
      await page.getByRole('heading', { name: state === 'pin' ? 'Welcome back' : 'Choose account', exact: true }).waitFor();
      await accessible();
      if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/${state}-dark.png`, fullPage: true });
    }
    const privateContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      await privateContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw Error('Storage blocked'); } }));
      const privatePage = await privateContext.newPage();
      const privateErrors = [];
      privatePage.on('pageerror', error => privateErrors.push(error.message));
      await privatePage.goto('http://127.0.0.1:4208/#/login');
      await privatePage.getByRole('heading', { name: 'Sign in', exact: true }).waitFor();
      await privatePage.getByRole('combobox', { name: 'Language', exact: true }).tap();
      await privatePage.getByRole('option', { name: 'বাংলা', exact: true }).tap();
      await privatePage.getByRole('heading', { name: 'সাইন ইন', exact: true }).waitFor();
      assert.deepEqual(privateErrors, [], 'Public login and language selection must work with blocked storage');
    } finally { await privateContext.close(); }
    await language('English');
    await go('/signup');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    assert.equal(await page.getByLabel('Your name').getAttribute('aria-invalid'), 'true');
    await page.getByLabel('Your name').fill('Test Merchant');
    await page.getByLabel('Mobile number').fill('01711000245');
    await page.getByLabel('Password', { exact: true }).fill('DemoPassword123');
    await page.getByLabel('Confirm password').fill('DemoPassword123');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('heading', { name: 'Verify mobile number' }).waitFor();
    await capture('signup-verification');
    assert.ok((await page.getByText(/no SMS was sent/i).count()) > 0);
    await page.getByLabel('6-digit verification code').fill('000123');
    assert.equal(await page.locator('[data-numeric-input]').count(), 0);
    await page.getByRole('button', { name: 'Continue preview' }).click();
    await capture('signup-business');
    await page.getByLabel('Business / shop name').fill('Test Shop');
    await page.getByRole('button', { name: 'Finish UI preview' }).click();
    assert.ok((await page.getByText(/No account or business was created/i).count()) > 0);
    await capture('signup-complete');
    await go('/recovery');
    await page.getByLabel('Mobile number').fill('01711000245');
    await page.getByRole('button', { name: 'Review recovery methods' }).click();
    assert.equal(await page.getByRole('radio', { name: /Gmail OTP/ }).isChecked(), true);
    await capture('recovery-methods');
    await page.getByRole('radio', { name: /SMS OTP/ }).check();
    await page.getByLabel('6-digit verification code').fill('123456');
    await page.getByRole('button', { name: 'Continue preview' }).click();
    await capture('recovery-new-password');
    await page.getByLabel('Password', { exact: true }).fill('NewPassword123');
    await page.getByLabel('Confirm password').fill('NewPassword123');
    await page.getByRole('button', { name: 'Finish UI preview' }).click();
    assert.ok((await page.getByText(/password was not changed/i).count()) > 0);
    await capture('recovery-complete');
    assert.deepEqual(requests, [], 'Signup and recovery previews must not send network writes');

    await go('/app/dashboard');
    await page.getByRole('heading', { name: /Welcome,|Dashboard/ }).first().waitFor();
    assert.deepEqual(errors, []);
    console.log('Login preview passed: validation, password visibility, focused dialogs, PIN leading zeros/no steppers, account changes clear secrets, storage/network boundaries, blocked-storage touch input, 120 state/viewport/language/theme combinations, automated WCAG AA checks and existing ERP entry.');
  } finally {
    await browser?.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
