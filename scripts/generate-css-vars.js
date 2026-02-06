/**
 * CSS Variables Generator
 * tokens/colors.js에서 styles.css용 CSS 변수를 생성합니다.
 *
 * 사용법: node scripts/generate-css-vars.js
 */

const palette = require('../tokens/colors.js').default;

function generateCSSVariables(obj, prefix = '--palette') {
  let css = '';

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object') {
      css += generateCSSVariables(value, `${prefix}-${key}`);
    } else {
      css += `  ${prefix}-${key}: ${value};\n`;
    }
  }

  return css;
}

const cssVars = generateCSSVariables(palette);

console.log('/* Auto-generated from tokens/colors.js */');
console.log('/* Run: node scripts/generate-css-vars.js > palette-vars.css */');
console.log(':root {');
console.log(cssVars);
console.log('}');
