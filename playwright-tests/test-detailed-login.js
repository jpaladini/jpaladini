import { chromium } from 'playwright';

async function testDetailedLogin() {
  console.log('🔍 Testing detailed login flow with enhanced debugging...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enhanced console and error tracking
  const consoleMessages = [];
  const pageErrors = [];
  const networkRequests = [];
  
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}]: ${msg.text()}`);
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`[PAGE ERROR]:`, error.message);
  });
  
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      console.log(`[AUTH REQUEST]: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('auth')) {
      console.log(`[AUTH RESPONSE]: ${response.status()} ${response.url()}`);
    }
    
    if (response.status() >= 300 && response.status() < 400) {
      console.log(`[REDIRECT]: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to: https://creative-brigadeiros-dfdd2b.netlify.app');
    
    await page.goto('https://creative-brigadeiros-dfdd2b.netlify.app', { 
      waitUntil: 'networkidle' 
    });
    
    console.log('📄 Page loaded. Checking for JavaScript errors...');
    
    // Wait for any initial JS to load
    await page.waitForTimeout(2000);
    
    // Check if there are any immediate console errors
    if (pageErrors.length > 0) {
      console.log('❌ JavaScript errors detected:');
      pageErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log('📝 Filling in credentials and submitting...');
    await page.fill('input[type="email"]', 'xployt@gmail.com');
    await page.fill('input[type="password"]', 'xployt1234');
    
    // Click submit and watch for network activity
    console.log('🔐 Submitting login form...');
    await page.click('button:has-text("Sign In")');
    
    // Wait and watch for auth-related network requests
    console.log('⏳ Monitoring authentication requests...');
    await page.waitForTimeout(5000);
    
    // Check final state
    console.log('🔍 Final analysis:');
    console.log(`   Current URL: ${page.url()}`);
    console.log(`   Page title: ${await page.title()}`);
    console.log(`   JavaScript errors: ${pageErrors.length}`);
    console.log(`   Console messages: ${consoleMessages.length}`);
    
    // Check if we can find any session/auth state
    const hasSessionCookie = await page.evaluate(() => {
      return document.cookie.includes('sb-') || document.cookie.includes('supabase');
    });
    console.log(`   Has Supabase cookies: ${hasSessionCookie}`);
    
    // Check local storage for session data
    const hasSessionData = await page.evaluate(() => {
      try {
        const keys = Object.keys(localStorage);
        return keys.some(key => key.includes('supabase') || key.includes('sb-'));
      } catch (e) {
        return false;
      }
    });
    console.log(`   Has session in localStorage: ${hasSessionData}`);
    
    // Take final screenshot
    await page.screenshot({ path: '/Users/jp/Documents/jpaladini/playwright-tests/detailed-login-debug.png' });
    console.log('📸 Debug screenshot saved: detailed-login-debug.png');
    
  } catch (error) {
    console.log('❌ Error during detailed login test:', error.message);
  }
  
  await browser.close();
}

testDetailedLogin();
