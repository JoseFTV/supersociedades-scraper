import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    console.log("Launching browser for HTML dump...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto('https://www.supersociedades.gov.co/web/procedimientos-mercantiles/jurisprudencia-mercantiles', { waitUntil: 'networkidle0', timeout: 60000 });
    
    const html = await page.content();
    fs.writeFileSync('page_dump.html', html);
    console.log("Saved page_dump.html");
    await browser.close();
})();
