#!/usr/bin/env node

/**
 * 🎨 SPOrTS Contrast Checker
 * 
 * Verifica automaticamente il contrasto dei colori secondo WCAG 2.1
 * Requisiti: AA (4.5:1 per testi normali, 3:1 per testi grandi)
 */

// Colori della palette SPOrTS (RGB values)
const colors = {
  // Primary Colors
  primary: [43, 168, 74],        // #2ba84a
  primaryDark: [36, 130, 50],    // #248232
  primaryLight: [52, 199, 89],   // #34c759
  
  // Background & Text
  background: [255, 255, 255],   // White
  foreground: [15, 23, 42],      // Dark blue-gray
  
  // Secondary & Muted
  secondary: [241, 245, 249],    // Light gray
  muted: [241, 245, 249],        // Light gray
  mutedForeground: [100, 116, 139], // Medium gray
  
  // Destructive
  destructive: [239, 68, 68],    // Red
  
  // Dark theme
  backgroundDark: [15, 23, 42],  // Dark background
  foregroundDark: [248, 250, 252], // Light text
  secondaryDark: [51, 65, 85],   // Dark secondary
};

/**
 * Converte RGB in luminanza relativa
 * Formula W3C: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcola il rapporto di contrasto tra due colori
 * Formula WCAG: (L1 + 0.05) / (L2 + 0.05)
 */
function getContrastRatio(color1, color2) {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determina se il contrasto soddisfa i requisiti WCAG
 */
function checkWCAGCompliance(ratio, level = 'AA', size = 'normal') {
  const thresholds = {
    'AA': { normal: 4.5, large: 3.0 },
    'AAA': { normal: 7.0, large: 4.5 }
  };
  
  return ratio >= thresholds[level][size];
}

/**
 * Formatta i risultati per l'output
 */
function formatResult(name1, name2, ratio, compliant) {
  const status = compliant ? '✅' : '❌';
  const ratioStr = ratio.toFixed(2);
  return `${status} ${name1} / ${name2}: ${ratioStr}:1`;
}

/**
 * Test combinations che devono essere verificate
 */
const testCombinations = [
  // Light theme combinations
  { fg: 'foreground', bg: 'background', desc: 'Testo principale su sfondo' },
  { fg: 'primary', bg: 'background', desc: 'Primary su sfondo bianco' },
  { fg: 'background', bg: 'primary', desc: 'Testo bianco su primary' },
  { fg: 'mutedForeground', bg: 'background', desc: 'Testo secondario' },
  { fg: 'foreground', bg: 'secondary', desc: 'Testo su sfondo secondario' },
  { fg: 'destructive', bg: 'background', desc: 'Errori su sfondo' },
  { fg: 'background', bg: 'destructive', desc: 'Testo su errore' },
  
  // Dark theme combinations
  { fg: 'foregroundDark', bg: 'backgroundDark', desc: 'Dark: Testo principale' },
  { fg: 'primary', bg: 'backgroundDark', desc: 'Dark: Primary su sfondo' },
  { fg: 'foregroundDark', bg: 'secondaryDark', desc: 'Dark: Testo su secondario' },
  
  // Primary variations
  { fg: 'primaryDark', bg: 'background', desc: 'Primary dark su bianco' },
  { fg: 'primaryLight', bg: 'background', desc: 'Primary light su bianco' },
];

console.log('🎨 SPOrTS Contrast Checker - WCAG 2.1 Compliance');
console.log('='.repeat(60));
console.log('');

let passCount = 0;
let totalCount = 0;

// Test tutte le combinazioni
testCombinations.forEach(({ fg, bg, desc }) => {
  if (!colors[fg] || !colors[bg]) {
    console.log(`⚠️  Colore mancante: ${fg} o ${bg}`);
    return;
  }
  
  const ratio = getContrastRatio(colors[fg], colors[bg]);
  const compliant = checkWCAGCompliance(ratio, 'AA', 'normal');
  
  console.log(formatResult(fg, bg, ratio, compliant));
  console.log(`   ${desc}`);
  
  if (compliant) passCount++;
  totalCount++;
  
  console.log('');
});

// Sommario finale
console.log('='.repeat(60));
console.log(`📊 Risultati: ${passCount}/${totalCount} test superati`);

if (passCount === totalCount) {
  console.log('🎉 Tutti i test di contrasto sono stati superati!');
  process.exit(0);
} else {
  console.log(`⚠️  ${totalCount - passCount} test falliti - revisione necessaria`);
  console.log('');
  console.log('💡 Suggerimenti:');
  console.log('   - Scurire i colori di testo per migliorare il contrasto');
  console.log('   - Schiarire gli sfondi dove necessario');
  console.log('   - Considerare varianti alternative per testi piccoli');
  process.exit(1);
}

