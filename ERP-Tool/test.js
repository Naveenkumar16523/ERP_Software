const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', error => {
    console.log('PAGE EXCEPTION:');
    console.log(error.message);
    console.log(error.stack);
  });
  
  console.log('Navigating to http://localhost:4173...');
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  
  await page.evaluate(() => {
    localStorage.setItem('erp_demo', 'true');
    localStorage.setItem('erp_user', JSON.stringify({
      fullName: 'CEO Admin',
      isCEO: true,
      email: 'ceo@logicore.com'
    }));
    localStorage.setItem('erp-theme', 'dark');
  });
  
  await page.reload({ waitUntil: 'networkidle0' });
  
  const modules = [
    'Dashboard', 'Finance', 'Human Resources', 'Inventory', 'Manufacturing', 
    'Procurement', 'CRM', 'Payroll', 'Fixed Assets', 'Projects', 'Supply Chain', 
    'E-Commerce', 'Analytics', 'Banking', 'Healthcare', 'Education', 'Sustainability', 
    'Marketing', 'Security', 'Mobile Preview', 'Migration Hub', 'AI Companion', 'Support Center'
  ];

  for (const mod of modules) {
    console.log(`Clicking module: ${mod}`);
    await page.evaluate((modName) => {
      const links = Array.from(document.querySelectorAll('a, button, p, span, div')).filter(el => el.textContent === modName);
      if(links.length > 0) links[0].click();
    }, mod);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('Done testing all modules.');
  await browser.close();
})();