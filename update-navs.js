const fs = require('fs');
const https = require('https');

// Lista de ISINs que deseas monitorear
const ISINS = [
  'IE00B03HD191', // Vanguard Global Stock
  'IE00B42W3S00', // Vanguard Global Small-Cap
  'IE000QAZP7L2', // iShares Emerging Markets
  'ES0165265002', // MyInvestor Nasdaq 100
  'LU0996182563'  // Fidelity MSCI World
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
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
    try {
      const url = `https://api.finect.com/v1/fund/${isin}`;
      const data = await fetchJson(url);

      if (data && data.price) {
        results.funds[isin] = {
          nav: Number(data.price),
          date: data.date || new Date().toISOString().slice(0, 10),
          currency: data.currency || 'EUR'
        };
        console.log(`✅ [${isin}] NAV: ${data.price} EUR`);
      } else {
        console.log(`⚠️ [${isin}] No se obtuvo precio directo.`);
      }
    } catch (err) {
      console.error(`❌ Error consultando ${isin}:`, err.message);
    }
  }

  fs.writeFileSync('navs.json', JSON.stringify(results, null, 2));
  console.log('📁 Archivo navs.json generado con éxito.');
}

run();
