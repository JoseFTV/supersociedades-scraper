import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const URL = 'https://www.supersociedades.gov.co/web/procedimientos-mercantiles/jurisprudencia-mercantiles';
const TARGET_COUNT = 200;

async function scrapeCases() {
  console.log(`Launching browser to extract ${TARGET_COUNT} cases...`);
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
  
  const extractedCases = new Map<string, any>();
  let currentPage = 1;
  let emptyPagesCounter = 0;

  while (extractedCases.size < TARGET_COUNT) {
    console.log(`Parsing page ${currentPage}... (Currently have ${extractedCases.size} cases)`);
    // Wait for content to stabilize
    await new Promise(r => setTimeout(r, 3000));
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Extract links
    let foundOnPage = 0;
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      // Filter for jurisprudence links, avoiding duplicates by href
      if (href && (href.toLowerCase().includes('.pdf') || text.toLowerCase().includes('auto') || text.toLowerCase().includes('sentencia'))) {
        const fullUrl = href.startsWith('http') ? href : `https://www.supersociedades.gov.co${href}`;
        if (!extractedCases.has(fullUrl) && extractedCases.size < TARGET_COUNT) {
          extractedCases.set(fullUrl, { title: text, url: fullUrl });
          foundOnPage++;
        }
      }
    });

    console.log(`Found ${foundOnPage} new cases on page ${currentPage}.`);

    if (foundOnPage === 0) {
      emptyPagesCounter++;
      if (emptyPagesCounter >= 2) {
        console.log("No new cases found for 2 consecutive pages. Assuming we've reached the end of the available dataset.");
        break;
      }
    } else {
      emptyPagesCounter = 0; // reset
    }

    if (extractedCases.size >= TARGET_COUNT) {
      break;
    }

    // Attempt to navigate to the next page
    // Liferay and similar portals often use 'a.icon-angle-right', '.lfr-pagination-buttons li:last-child a', 
    // or standard text like 'Siguiente', 'Next', '>'
    console.log(`Attempting to navigate next by invoking the global siguiente() function...`);
    
    const clickSuccess = await page.evaluate(() => {
      // @ts-ignore
      if (typeof window.siguiente === 'function') {
         // @ts-ignore
         window.siguiente();
         return true;
      }
      return false;
    });

    if (clickSuccess) {
      console.log(`Clicked next... waiting 4 seconds for Liferay AJAX...`);
      // Wait for content to stabilize
      await new Promise(r => setTimeout(r, 4000));
      currentPage++;
    } else {
      console.log('No "Siguiente" button found. Stopping extraction.');
      break;
    }
  }

  const finalCases = Array.from(extractedCases.values());
  console.log(`\nExtraction complete. Successfully retrieved ${finalCases.length} case documents.`);
  
  const outputDir = path.join(process.cwd(), 'script_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outPath = path.join(outputDir, 'scraped_200_cases.json');
  fs.writeFileSync(outPath, JSON.stringify(finalCases, null, 2));
  
  console.log(`Saved 200 cases to ${outPath}`);

  await browser.close();
}

scrapeCases().catch(err => {
  console.error("Scraping failed:", err);
  process.exit(1);
});
