const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function testSite() {
  console.log('Starting next dev server...');
  const nextProcess = spawn('npm', ['run', 'dev'], { cwd: __dirname });
  
  // Wait for server to be ready
  await new Promise(resolve => {
    nextProcess.stdout.on('data', data => {
      const output = data.toString();
      console.log('Next output:', output.trim());
      if (output.includes('Ready in') || output.includes('started server on') || output.includes('Local:')) {
        resolve();
      }
    });
  });

  console.log('Server is ready. Launching puppeteer...');
  
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));

  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('Page loaded. Checking for spin circle...');
  const html = await page.content();
  if (html.includes('animate-spin')) {
    console.log('FOUND animate-spin on the page!');
  } else {
    console.log('NO animate-spin found.');
  }

  const spinnerInfo = await page.evaluate(() => {
    const spinner = document.querySelector('.animate-spin');
    if (spinner) {
      return { found: true, parentHTML: spinner.parentElement.outerHTML };
    }
    return { found: false };
  });

  console.log('Spinner info:', spinnerInfo);

  // Take a screenshot
  await page.screenshot({ path: 'screenshot.png' });
  
  console.log('Cleaning up...');
  await browser.close();
  nextProcess.kill('SIGINT');
  process.exit(0);
}

testSite().catch(err => {
  console.error(err);
  process.exit(1);
});
