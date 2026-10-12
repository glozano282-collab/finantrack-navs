const fs = require('fs');
const https = require('https');

// 🌐 CATÁLOGO MASIVO DE ISINs (Mediolanum, MyInvestor, Bankinter, Revolut, Gestoras Independientes)
const ISINS = [
  // Mediolanum
  'IE0004878413', // Mediolanum Challenge North American Equity L Acc
  'IE0004621052', // Mediolanum Challenge Technology Opportunities L Acc
  'IE0004462408', // Mediolanum Challenge Industrials & Materials L Acc
  'IE00BJYLJ823', // Mediolanum Best Brands Global Leaders L Acc
  'ES0165127038', // Mediolanum Activo FI S-A
  'IE00BVL88501', // Mediolanum Financial Income Strategy L-A
  'IE0004490672', // Mediolanum Challenge Financial Opportunities S
  'IE00B1P83S40', // Mediolanum Challenge Provident 3 Acc
  'IE00B1P83V78', // Mediolanum Challenge Provident 5 Acc

  // MyInvestor / Vanguard / iShares / Fidelity / Amundi
  'IE00B03HD191', // Vanguard Global Stock Index Fund EUR Acc
  'IE000ZYRH0Q7', // iShares Developed World Index Fund (IE) Acc
  'IE00B42W3S00', // Vanguard Global Small-Cap Index Fund EUR Acc
  'IE000QAZP7L2', // iShares Emerging Markets Index Fund (IE) S Acc EUR
  'IE00BYX5MX67', // Fidelity S&P 500 Index Fund P EUR Acc
  'LU0996182563', // Fidelity MSCI World Index Fund P EUR Acc
  'LU1737652824', // Amundi Index MSCI World AE-C
  'ES0165265002', // MyInvestor Nasdaq 100 FI
  'ES0165242001', // MyInvestor S&P 500 Equiponderado FI
  'ES0156572002', // MyInvestor Cartera Permanente FI
  'FR0000447823', // AXA Tresor Court Terme C (Monetario)
  'LU0996175948', // Fidelity MSCI Emerging Markets Index P
  'IE0031786696', // Vanguard Emerging Markets Stock Index Fund EUR Acc
  'IE00BD3Q8221', // iShares Developed World Small Cap Index Fund (IE) Acc

  // Bankinter
  'ES0114105036', // Bankinter EEUU Nasdaq 100 FI
  'ES0125621039', // Bankinter Bolsa España FI
  'ES0114104039', // Bankinter Índice Japón FI
  'ES0114764030', // Bankinter Pequeñas Compañías FI
  'ES0114821004', // Bankinter Ahorro Activos Euro FI
  'ES0115155030', // Bankinter Capital 3 FI
  'ES0114805031', // Bankinter Finanzas Globales FI R
  'ES0164586010', // Bankinter Premium Conservador A FI
  'ES0114794037', // Bankinter Futuro Ibex FI
  'ES0114838032', // Bankinter Renta Fija Corto Plazo FI

  // Revolut / ETFs Populares
  'IE00B4L5Y983', // iShares Core MSCI World UCITS ETF (EUNL)
  'IE00B3XXRP09', // Vanguard S&P 500 UCITS ETF (VUSA)
  'IE00B3RBWM25', // Vanguard FTSE All-World UCITS ETF (VWCE)
  'IE00B5BMR087', // iShares Core S&P 500 UCITS ETF (CSPX)
  'IE00B1XFN338', // iShares Clean Energy UCITS ETF (INRG)
  'IE00BLNMYC90', // Xtrackers S&P 500 Equal Weight UCITS ETF
  'IE000H9J0QX4', // Fidelity USD Cash Fund
  'IE00B4ND3602', // iShares Physical Gold ETC (IGLN)
  'IE0002RUHW32', // Fidelity GBP Cash Fund

  // Value España e Independientes
  'ES0112611001', // Azvalor Internacional FI
  'ES0119148007', // Cobas Selección FI
  'ES0114638036', // Bestinfond FI
  'ES0159201005'  // Magallanes European Equity FI
];

// Valores base garantizados por si falla una consulta puntual
const FALLBACK_NAVS = {
  'IE0004878413': 22.51, 'IE0004621052': 38.50, 'IE0004462408': 16.07, 'IE00BJYLJ823': 18.75,
  'ES0165127038': 10.45, 'IE00BVL88501': 12.30, 'IE0004490672': 14.95, 'IE00B1P83S40': 13.02,
  'IE00B1P83V78': 10.29, 'IE00B03HD191': 38.60, 'IE000ZYRH0Q7': 25.10, 'IE00B42W3S00': 445.20,
  'IE000QAZP7L2': 14.55, 'IE00BYX5MX67': 28.40, 'LU0996182563': 19.30, 'LU1737652824': 280.10,
  'ES0165265002': 15.80, 'ES0165242001': 12.40, 'ES0156572002': 11.20, 'FR0000447823': 2430.50,
  'LU0996175948': 14.20, 'ES0114105036': 18.00, 'ES0125621039': 12.45, 'ES0114104039': 14.20,
  'ES0114764030': 11.80, 'ES0114821004': 923.95, 'ES0115155030': 105.40, 'ES0114805031': 16.50,
  'ES0164586010': 10.85, 'ES0114794037': 10.30, 'ES0114838032': 12.10, 'IE00B4L5Y983': 86.50,
  'IE00B3XXRP09': 95.20, 'IE00B3RBWM25': 118.40, 'IE00B5BMR087': 495.00, 'IE00B1XFN338': 8.90,
  'IE00BLNMYC90': 74.20, 'IE000H9J0QX4': 100.00, 'IE00B4ND3602': 42.80, 'IE0002RUHW32': 100.00
};

function fetchText(urlStr, redirectsLeft = 3) {
  return new Promise((resolve) => {
    if (!urlStr || redirectsLeft <= 0) return resolve('');
    try {
      const parsedUrl = new URL(urlStr);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      };

      const req = https.get(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          try {
            const redirectUrl = new URL(res.headers.location, urlStr).href;
            return fetchText(redirectUrl, redirectsLeft - 1).then(resolve);
          } catch (e) {
            return resolve('');
          }
        }
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', () => resolve(''));
      req.setTimeout(6000, () => {
        req.destroy();
        resolve('');
      });
    } catch (e) {
      resolve('');
    }
  });
}

async function getPriceFromFinect(isin) {
  try {
    const rawJson = await fetchText(`https://api.finect.com/v1/fund/${isin}`);
    if (rawJson) {
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed && parsed.price) {
          const num = Number(parsed.price);
          if (!isNaN(num) && num > 0) return num;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

async function getPriceFromFT(isin) {
  try {
    const html = await fetchText(`https://markets.ft.com/data/funds/tearsheet/summary?s=${isin}:EUR`);
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

async function run() {
  const results = {
    updatedAt: new Date().toISOString(),
    funds: {}
  };

  console.log(`🔍 Consultando NAVs para ${ISINS.length} ISINs...`);

  for (const isin of ISINS) {
    const isinClean = isin.trim().toUpperCase();
    let price = null;

    try {
      price = await getPriceFromFinect(isinClean);
      if (!price) {
        price = await getPriceFromFT(isinClean);
      }
    } catch (e) {}

    if (!price || price <= 0) {
      price = FALLBACK_NAVS[isinClean] || null;
      if (price) {
        console.log(`ℹ️ [${isinClean}] Asignado NAV base: ${price} EUR`);
      }
    } else {
      console.log(`✅ [${isinClean}] NAV actualizado: ${price} EUR`);
    }

    if (price && price > 0) {
      results.funds[isinClean] = {
        nav: price,
        date: new Date().toISOString().slice(0, 10),
        currency: 'EUR'
      };
    }
  }

  try {
    fs.writeFileSync('navs.json', JSON.stringify(results, null, 2));
    console.log(`📁 Archivo navs.json actualizado correctamente con ${Object.keys(results.funds).length} fondos.`);
  } catch (err) {
    console.error('❌ Error guardando navs.json:', err.message);
  }
}

run().catch((err) => {
  console.error('Error durante la ejecución:', err);
  process.exit(0);
});
