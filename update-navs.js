const fs = require('fs');
const https = require('https');

// =============================================================================
// AVISO IMPORTANTE SOBRE ESTE SCRIPT
// =============================================================================
// No puedo verificar en vivo (este entorno no tiene acceso a red) que el
// scraping de FT.com siga funcionando el día que leas esto: las webs cambian
// su HTML sin avisar y esto puede romperse en cualquier momento. Por eso este
// script ahora:
//   1. Ya NO llama a api.finect.com/v1/fund/{isin} — no encontré ningún
//      rastro de que ese endpoint exista públicamente, así que es casi
//      seguro que fallaba siempre y lo único que hacía era perder tiempo.
//   2. Registra el motivo real de cada fallo (código HTTP, excepción, o
//      "regex no encontró el precio"), en vez de tragárselo en silencio.
//   3. Guarda SIEMPRE navs.json al final, aunque todas las consultas hayan
//      fallado y se use el valor de referencia (FALLBACK_NAVS) para todo.
//      Así nunca te quedas sin archivo por un fallo parcial.
//   4. Dice explícitamente, por cada fondo, si el precio es "en vivo" o
//      "de referencia (fallback)", para que sepas qué estás mirando.
// =============================================================================

const ISINS = [
  // Mediolanum
  'IE0004878413', 'IE0004621052', 'IE0004462408', 'IE00BJYLJ823',
  'ES0165127038', 'IE00BVL88501', 'IE0004490672', 'IE00B1P83S40', 'IE00B1P83V78',

  // MyInvestor / Vanguard / iShares / Fidelity / Amundi
  'IE00B03HD191', 'IE000ZYRH0Q7', 'IE00B42W3S00', 'IE000QAZP7L2', 'IE00BYX5MX67',
  'LU0996182563', 'LU1737652824', 'ES0165265002', 'ES0165242001', 'ES0156572002',
  'FR0000447823', 'LU0996175948', 'IE0031786696', 'IE00BD3Q8221',
