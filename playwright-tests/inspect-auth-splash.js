import { chromium } from 'playwright';

async function inspectAuthSplash() {
  console.log('🔍 Inspecting auth splash screen on different viewport sizes...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navigating to localhost:4322');
    await page.goto('http://localhost:4322', { waitUntil: 'networkidle' });
    
    // Test different viewport sizes
    const viewports = [
      { name: 'Desktop Large', width: 1920, height: 1080 },
      { name: 'Desktop Medium', width: 1366, height: 768 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Mobile Small', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if content fits within viewport
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const viewportHeight = viewport.height;
      
      console.log(`   Body height: ${bodyHeight}px, Viewport height: ${viewportHeight}px`);
      
      if (bodyHeight > viewportHeight) {
        console.log(`   ⚠️  Content overflows by ${bodyHeight - viewportHeight}px - requires scrolling`);
      } else {
        console.log(`   ✅ Content fits within viewport`);
      }
      
      // Take screenshot for this viewport
      await page.screenshot({ 
        path: `/Users/jp/Documents/jpaladini/playwright-tests/auth-splash-${viewport.name.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: false  // Only capture viewport, not full page
      });
      
      // Check specific elements and their sizes
      const authContainer = await page.locator('.min-h-screen, .h-screen, .h-full').first();
      if (await authContainer.count() > 0) {
        const containerBox = await authContainer.boundingBox();
        if (containerBox) {
          console.log(`   Auth container height: ${containerBox.height}px`);
        }
      }
      
      console.log('');
    }
    
    // Reset to desktop view and get detailed element analysis
    await page.setViewportSize({ width: 1366, height: 768 });
    console.log('🔍 Analyzing auth splash elements...');
    
    // Check the main container classes
    const mainContainer = await page.locator('body > div, body > main, .min-h-screen').first();
    if (await mainContainer.count() > 0) {
      const classes = await mainContainer.getAttribute('class');
      console.log(`   Main container classes: ${classes}`);
    }
    
    // Check if there are min-h-screen classes that might be causing height issues
    const minHeightElements = await page.locator('.min-h-screen').all();
    console.log(`   Found ${minHeightElements.length} elements with min-h-screen class`);
    
    // Check the logo/image sizes
    const logoElements = await page.locator('img').all();
    for (let i = 0; i < logoElements.length; i++) {
      const logo = logoElements[i];
      const box = await logo.boundingBox();
      if (box) {
        const src = await logo.getAttribute('src');
        console.log(`   Image ${i + 1} (${src}): ${box.width}x${box.height}px`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error during inspection:', error.message);
  }
  
  await browser.close();
}

inspectAuthSplash();
