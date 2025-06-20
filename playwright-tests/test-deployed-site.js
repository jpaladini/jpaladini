import { chromium } from 'playwright';

async function testDeployedSite() {
  console.log('🔍 Testing deployed Netlify site...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}]:`, msg.text());
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]:`, error.message);
  });
  
  try {
    console.log('🌐 Navigating to: https://creative-brigadeiros-dfdd2b.netlify.app');
    
    // Navigate to the deployed site
    await page.goto('https://creative-brigadeiros-dfdd2b.netlify.app', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    console.log('📄 Page loaded. Current URL:', page.url());
    console.log('📋 Page title:', await page.title());
    
    // Check if there are any visible error messages
    const errorElements = await page.locator('text=/error|Error|ERROR/i').all();
    if (errorElements.length > 0) {
      console.log('❌ Found error elements on page:');
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`   - ${text}`);
      }
    }
    
    // Check if the page content loaded properly
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes('Cannot') || bodyText.includes('404') || bodyText.includes('500')) {
      console.log('❌ Page appears to have error content');
      console.log('   Body preview:', bodyText.substring(0, 200) + '...');
    }
    
    // Wait a moment to see if any redirects happen
    await page.waitForTimeout(2000);
    
    console.log('🔍 Final URL after wait:', page.url());
    
    // Take a screenshot for debugging
    await page.screenshot({ path: '/Users/jp/Documents/jpaladini/playwright-tests/deployed-site-error.png' });
    console.log('📸 Screenshot saved: deployed-site-error.png');
    
  } catch (error) {
    console.log('❌ Error during navigation:', error.message);
  }
  
  await browser.close();
}

testDeployedSite();
