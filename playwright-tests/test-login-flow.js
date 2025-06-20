import { chromium } from 'playwright';

async function testLoginFlow() {
  console.log('🔍 Testing login flow on deployed Netlify site...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]:`, error.message);
  });
  
  // Listen for network requests to see redirects
  page.on('response', response => {
    if (response.status() >= 300 && response.status() < 400) {
      console.log(`[REDIRECT]: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    console.log('🌐 Navigating to: https://creative-brigadeiros-dfdd2b.netlify.app');
    
    // Navigate to the deployed site
    await page.goto('https://creative-brigadeiros-dfdd2b.netlify.app', { 
      waitUntil: 'networkidle' 
    });
    
    console.log('📄 Page loaded. Current URL:', page.url());
    
    // Fill in login credentials
    console.log('📝 Filling in login credentials...');
    await page.fill('input[type="email"]', 'xployt@gmail.com');
    await page.fill('input[type="password"]', 'xployt1234');
    
    console.log('🔐 Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');
    
    // Wait a moment for the form submission
    console.log('⏳ Waiting for authentication response...');
    await page.waitForTimeout(3000);
    
    console.log('🔍 Current URL after login attempt:', page.url());
    console.log('📋 Page title after login:', await page.title());
    
    // Check if we're on the dashboard or still on login page
    if (page.url().includes('/dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard!');
      
      // Check if dashboard content loaded
      const dashboardContent = await page.locator('body').textContent();
      if (dashboardContent.includes('Welcome') || dashboardContent.includes('Dashboard')) {
        console.log('✅ Dashboard content appears to be loaded');
      } else {
        console.log('⚠️  Dashboard page loaded but content may be missing');
        console.log('   Content preview:', dashboardContent.substring(0, 200) + '...');
      }
      
    } else {
      console.log('❌ ISSUE: Still on login page or unexpected URL');
      
      // Check for any error messages
      const errorText = await page.locator('body').textContent();
      if (errorText.includes('error') || errorText.includes('Error') || errorText.includes('invalid')) {
        console.log('❌ Found potential error in page content:');
        console.log('   Content preview:', errorText.substring(0, 300) + '...');
      }
      
      // Check if there are any visible error elements
      const errorElements = await page.locator('.error, .alert, .warning, [role="alert"]').all();
      if (errorElements.length > 0) {
        console.log('❌ Found error UI elements:');
        for (const element of errorElements) {
          const text = await element.textContent();
          console.log(`   - ${text}`);
        }
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/Users/jp/Documents/jpaladini/playwright-tests/login-flow-result.png' });
    console.log('📸 Screenshot saved: login-flow-result.png');
    
    // Wait a bit more to see if any delayed redirects happen
    await page.waitForTimeout(2000);
    console.log('🔍 Final URL after additional wait:', page.url());
    
  } catch (error) {
    console.log('❌ Error during login test:', error.message);
    
    // Take error screenshot
    await page.screenshot({ path: '/Users/jp/Documents/jpaladini/playwright-tests/login-error.png' });
    console.log('📸 Error screenshot saved: login-error.png');
  }
  
  await browser.close();
}

testLoginFlow();
