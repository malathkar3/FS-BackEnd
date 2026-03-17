const cheerio = require('cheerio');

const extractTables = (html) => {
  const $ = cheerio.load(html);
  const tables = [];

  $('table').each((i, table) => {
    const rows = [];
    $(table).find('tr').each((j, tr) => {
      const cells = [];
      $(tr).find('td').each((k, td) => {
        cells.push($(td).text().trim());
      });
      if (cells.length > 0) {
        rows.push(cells);
      }
    });
    if (rows.length > 0) {
      tables.push(rows);
    }
  });

  return tables;
};

module.exports = { extractTables };
