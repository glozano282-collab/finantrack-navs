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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

async function run() {
  const results = {
    updatedAt: new Date().toISOString(),
    funds: {}
  };

  for (const isin of ISINS) {
    const isinClean = isin.trim().toUpperCase();
    try {
      const url = `https://api.finect.com/v1/fund/${isinClean}`;
      const data = await fetchJson(url);

      if (data && data.price) {
        results.funds[isinClean] = {
          nav: Number(data.price),
          date: data.date || new Date().toISOString().slice(0, 10),
          currency: data.currency || 'EUR'
        };
        console.log(`✅ [${isinClean}] NAV: ${data.price} EUR`);
      } else {
        console.log(`⚠️ [${isinClean}] No se obtuvo precio directo.`);
      }
    } catch (err) {
      console.error(`❌ Error consultando ${isinClean}:`, err.message);
    }
  }

  fs.writeFileSync('navs.json', JSON.stringify(results, null, 2));
  console.log('📁 Archivo navs.json generado e ISINs actualizados con éxito.');
}

run();