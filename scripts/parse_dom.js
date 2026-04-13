const fs = require('fs');
const cheerio = require('cheerio');

try {
  const html = fs.readFileSync('page_dump.html', 'utf8');
  const $ = cheerio.load(html);
  
  console.log('--- Pagination HTML ---');
  console.log($('.pagination').html());
} catch (err) {
  console.error(err);
}
