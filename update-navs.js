const fs = require('fs');
const https = require('https');

// Lista completa de ISINs para consultar automáticamente
const ISINS = [
  // Mediolanum
  'IE0004878413',
  'IE0004621052',
  'IE0004462408',
  'IE00BJYLJ823',
  'ES0165127038',
  'IE00BVL88501',
  'IE0004490672',
  'IE00B1P83S40',
  'IE00B1P83V78',
  // MyInvestor
  'IE00B03HD191',
  'IE000ZYRH0Q7',
  'IE00B42W3S00',
  'IE000QAZP7L2',
  'IE00BYX5MX67',
  'LU0996182563',
  'LU1737652824',
  'ES0165265002',
  'ES0165242001',
  'ES0156572002',
  'FR0000447823',
  'LU0996175948',
  // Bankinter
  'ES0114105036',
  'ES0125621039',
  'ES0114104039',
  'ES0114764030',
  'ES0114821004',
  'ES0115155030',
  'ES0114805031',
  'ES0164586010',
  'ES0114794037',
  'ES0114838032',
  // Revolut / ETFs
  'IE00B4L5Y983',
  'IE00B3XXRP09',
  'IE00B3RBWM25',
  'IE00B5BMR087',
  'IE00B1XFN338',
  'IE00BLNMYC90',
  'IE00AZVL3K0',
  'IE000H9J0QX4',
  'IE00B4ND3602',
  'IE0002RUHW32'
];

function fetchText(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

// 1. Obtener precio oficial desde Financial Times
async function getPriceFromFT(isin) {
  try {
    const url = `https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}:EUR`;
    const html = await fetchText(url);
    if (!html) return null;

    const match = html.match(/Price\s*\([A-Z]{3}\)[^<]*<span[^>]*class="mod-ui-data-list__value"[^>]*>([\d\.,]+)<\/span>/i)
               || html.match(/class="mod-ui-data-list__value">([\d\.,]+)<\/span>/i)
               || html.match(/data-val="([\d\.,]+)"/i);

    if (match && match[1]) {
      const cleanVal = match[1].replace(/,/g, '');
      const num = parseFloat(cleanVal);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {}
  return null;
}

// 2. Respaldo desde Finect API / Web
async function getPriceFromFinect(isin) {
  try {
    const apiUrl = `https://api.finect.com/v1/fund/${isin}`;
    const rawJson = await fetchText(apiUrl);
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed && parsed.price) return Number(parsed.price);
      } catch (e) {}
    }

    const webUrl = `https://www.finect.com/fondos-inversion?query=${isin}`;
    const html = await fetchText(webUrl);
    if (html) {
      const match = html.match(/([\d]+[,\.][\d]+)\s*€/);
      if (match && match[1]) {
        const cleanVal = match[1].replace(/\./g, '').replace(',', '.');
        const num = parseFloat(cleanVal);
        if (!isNaN(num) && num > 0) return num;
      }
    }
  } catch (e) {}
  return null;
}

async function run() {
  const results = {
    updatedAt: new Date().toISOString(),
    funds: {}
  };

  console.log(`🔍 Consultando NAVs para ${ISINS.length} ISINs...`);

  for (const isin of ISINS) {
    const isinClean = isin.trim().toUpperCase();
    let price = await getPriceFromFT(isinClean);

    if (!price) {
      price = await getPriceFromFinect(isinClean);
    }

    if (price && price > 0) {
      results.funds[isinClean] = {
        nav: price,
        date: new Date().toISOString().slice(0, 10),
        currency: 'EUR'
      };
      console.log(`✅ [${isinClean}] NAV: ${price} EUR`);
    } else {
      console.log(`⚠️ [${isinClean}] No se pudo obtener precio.`);
    }
  }

  fs.writeFileSync('navs.json', JSON.stringify(results, null, 2));
  console.log(`📁 Archivo navs.json actualizado correctamente con ${Object.keys(results.funds).length} fondos.`);
}

run();