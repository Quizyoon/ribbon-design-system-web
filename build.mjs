import StyleDictionary from 'style-dictionary';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = resolve(__dirname, 'tokens');
const BUILD_DIR = resolve(__dirname, 'build');

// ─── Pre-process: flatten complex token values ───

function loadJSON(filename) {
  return JSON.parse(readFileSync(resolve(TOKENS_DIR, filename), 'utf-8'));
}

/** Flatten shadow object values to CSS string */
function flattenShadows(obj) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val.value && typeof val.value === 'object' && val.value.blur !== undefined) {
      result[key] = {
        ...val,
        value: `${val.value.x}px ${val.value.y}px ${val.value.blur}px ${val.value.spread}px ${val.value.color}`,
      };
    } else {
      result[key] = val;
    }
  }
  return result;
}

/** Flatten multi-locale lineHeight to EN values */
function flattenLineHeights(obj) {
  const result = {};
  for (const [category, sizes] of Object.entries(obj)) {
    result[category] = {};
    for (const [key, val] of Object.entries(sizes)) {
      if (val.value && typeof val.value === 'object' && val.value.en !== undefined) {
        result[category][key] = { ...val, value: val.value.en };
      } else {
        result[category][key] = val;
      }
    }
  }
  return result;
}

/** Flatten typography style composites into separate tokens */
function flattenTypographyStyles(styles) {
  const result = {};
  for (const [category, items] of Object.entries(styles)) {
    result[category] = {};
    for (const [name, val] of Object.entries(items)) {
      if (val.value && typeof val.value === 'object' && val.value.fontSize) {
        // Create individual tokens for each property
        result[category][`${name}-fontSize`] = {
          value: val.value.fontSize,
          type: 'fontSizes',
        };
        result[category][`${name}-lineHeight`] = {
          value: val.value.lineHeight,
          type: 'lineHeights',
        };
        result[category][`${name}-fontWeight`] = {
          value: val.value.fontWeight,
          type: 'fontWeights',
        };
      } else {
        result[category][name] = val;
      }
    }
  }
  return result;
}

// ─── Load and merge all tokens ───

const color = loadJSON('color.json');
const dimension = loadJSON('dimension.json');
const spacing = loadJSON('spacing.json');
const typography = loadJSON('typography.json');
const shadow = loadJSON('shadow.json');
const borderRadius = loadJSON('borderRadius.json');
const border = loadJSON('border.json');

// Save raw styles before flattening (for utility class generation)
const rawStyles = typography.styles
  ? JSON.parse(JSON.stringify(typography.styles))
  : null;

// Pre-process complex values
shadow.shadow = flattenShadows(shadow.shadow);
typography.lineHeight = flattenLineHeights(typography.lineHeight);
if (typography.styles) {
  typography.styles = flattenTypographyStyles(typography.styles);
}

// Merge into single token tree
const tokens = {
  ...color,
  ...dimension,
  ...spacing,
  ...typography,
  ...shadow,
  ...borderRadius,
  ...border,
};

// ─── Build ───

if (!existsSync(BUILD_DIR)) {
  mkdirSync(BUILD_DIR, { recursive: true });
}

const sd = new StyleDictionary({
  tokens,
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/',
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
  },
});

console.log('Building design tokens...');
await sd.buildAllPlatforms();
console.log('Done! Output: build/variables.css');

// ─── Generate typography utility classes ───

/** Convert token reference like {fontSize.t10} to var(--font-size-t10) */
function tokenRefToVar(ref) {
  const inner = ref.replace(/[{}]/g, '');
  const kebab = inner
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-');
  return `var(--${kebab})`;
}

if (rawStyles) {
  let css = '/* Typography Utility Classes - Auto-generated from typography.json */\n\n';

  for (const [category, items] of Object.entries(rawStyles)) {
    for (const [name, val] of Object.entries(items)) {
      if (val.value && typeof val.value === 'object' && val.value.fontSize) {
        css += `.${category}-${name} {\n`;
        css += `  font-size: ${tokenRefToVar(val.value.fontSize)};\n`;
        css += `  line-height: ${tokenRefToVar(val.value.lineHeight)};\n`;
        css += `  font-weight: ${tokenRefToVar(val.value.fontWeight)};\n`;
        css += `}\n\n`;
      }
    }
  }

  writeFileSync(resolve(BUILD_DIR, 'typography.css'), css);
  console.log('Done! Output: build/typography.css');
}

// ─── Generate button component CSS ───

function generateButtonCSS() {
  const B = '.ribbon-button';

  // Size config: [propName, tokenSuffix, typoStyle, iconSize, iconPadding{iconSide, textSide}]
  const sizes = [
    { name: 'xsmall',  tk: 'xs', typo: 'title-4xs-bold', icon: 'xs', iconPad: { iconSide: '--button-padding-xs', textSide: '--spacing-m-plus' } },
    { name: 'small',   tk: 's',  typo: 'title-2xs-bold', icon: 's',  iconPad: { iconSide: '--button-padding-s',  textSide: '--button-padding-xl' } },
    { name: 'medium',  tk: 'm',  typo: 'title-2xs-bold', icon: 's',  iconPad: { iconSide: '--button-padding-m',  textSide: '--button-padding-l' } },
    { name: 'large',   tk: 'l',  typo: 'title-xs-bold',  icon: 'm',  iconPad: { iconSide: '--button-padding-m',  textSide: '--button-padding-l' } },
    { name: 'xlarge',  tk: 'xl', typo: 'title-xs-bold',  icon: 'l',  iconPad: { iconSide: '--button-padding-m',  textSide: '--button-padding-l' } },
  ];

  // Solid-type variants (share disabled color tokens)
  const solidVariants = [
    'brand-solid', 'brand-weak',
    'neutral-solid', 'neutral-weak',
    'critical-solid', 'critical-weak',
  ];

  let css = '/* Ribbon Button Component - Auto-generated from design tokens */\n\n';

  // ── Icon Container ──
  css += `${B}__icon {\n`;
  css += `  display: flex;\n  align-items: center;\n  justify-content: center;\n  flex-shrink: 0;\n`;
  css += `}\n\n`;

  // ── Base (default: medium, brandSolid) ──
  css += `${B} {\n`;
  css += `  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n`;
  css += `  box-sizing: border-box;\n`;
  css += `  height: var(--button-height-m);\n`;
  css += `  padding: 0 var(--button-padding-m);\n`;
  css += `  font-size: var(--styles-title-2xs-bold-font-size);\n`;
  css += `  line-height: var(--styles-title-2xs-bold-line-height);\n`;
  css += `  font-weight: var(--styles-title-2xs-bold-font-weight);\n`;
  css += `  border-radius: var(--button-radius-m);\n`;
  css += `  border: none;\n  cursor: pointer;\n`;
  css += `  transition: all 0.2s ease;\n`;
  css += `  gap: var(--button-gap-m);\n`;
  css += `  color: var(--color-button-brand-solid-fg);\n`;
  css += `  background: var(--color-button-brand-solid-bg);\n`;
  css += `}\n`;
  css += `${B}:active {\n  background: var(--color-button-brand-solid-bg-pressed);\n}\n\n`;

  // ── Sizes ──
  for (const s of sizes) {
    css += `/* ── Size: ${s.name} ── */\n`;
    css += `${B}--${s.name} {\n`;
    css += `  height: var(--button-height-${s.tk});\n`;
    css += `  padding: 0 var(--button-padding-${s.tk});\n`;
    css += `  font-size: var(--styles-${s.typo}-font-size);\n`;
    css += `  line-height: var(--styles-${s.typo}-line-height);\n`;
    css += `  font-weight: var(--styles-${s.typo}-font-weight);\n`;
    css += `  border-radius: var(--button-radius-${s.tk});\n`;
    css += `  gap: var(--button-gap-${s.tk});\n`;
    css += `}\n`;
    css += `${B}--${s.name} ${B}__icon { width: var(--icon-size-${s.icon}); height: var(--icon-size-${s.icon}); }\n`;
    css += `${B}--${s.name} ${B}__icon svg { width: var(--icon-size-${s.icon}); height: var(--icon-size-${s.icon}); }\n`;
    css += `${B}--${s.name}${B}--icon-left { padding: 0 var(${s.iconPad.textSide}) 0 var(${s.iconPad.iconSide}); }\n`;
    css += `${B}--${s.name}${B}--icon-right { padding: 0 var(${s.iconPad.iconSide}) 0 var(${s.iconPad.textSide}); }\n\n`;
  }

  // ── Solid Variants ──
  for (const v of solidVariants) {
    css += `${B}--${v} {\n`;
    css += `  color: var(--color-button-${v}-fg);\n`;
    css += `  background: var(--color-button-${v}-bg);\n`;
    css += `}\n`;
    css += `${B}--${v}:active { background: var(--color-button-${v}-bg-pressed); }\n\n`;
  }

  // ── Outline Variant ──
  css += `${B}--outline {\n`;
  css += `  color: var(--color-button-outline-fg);\n`;
  css += `  background: transparent;\n`;
  css += `  border: var(--border-thin) solid var(--color-button-outline-border);\n`;
  css += `}\n`;
  css += `${B}--outline:active { background: var(--color-button-outline-bg-pressed); }\n\n`;

  // ── Ghost Variant ──
  css += `${B}--ghost {\n`;
  css += `  color: var(--color-button-ghost-fg);\n`;
  css += `  background: transparent;\n`;
  css += `}\n`;
  css += `${B}--ghost:active { background: var(--color-button-ghost-bg-pressed); }\n\n`;

  // ── Disabled ──
  css += `${B}:disabled {\n  cursor: not-allowed;\n  opacity: 0.6;\n}\n`;
  css += solidVariants.map(v => `${B}--${v}:disabled`).join(',\n') + ` {\n`;
  css += `  color: var(--color-button-disabled-fg);\n`;
  css += `  background: var(--color-button-disabled-bg);\n`;
  css += `}\n`;
  css += `${B}--outline:disabled {\n`;
  css += `  color: var(--color-button-outline-fg-disabled);\n`;
  css += `  border-color: var(--color-button-outline-border-disabled);\n`;
  css += `  background: transparent;\n`;
  css += `}\n`;
  css += `${B}--ghost:disabled {\n`;
  css += `  color: var(--color-button-ghost-fg-disabled);\n`;
  css += `  background: transparent;\n`;
  css += `}\n\n`;

  // ── Icon Only ──
  css += `${B}--icon-only { padding: 0; }\n`;
  for (const s of sizes) {
    css += `${B}--icon-only${B}--${s.name} { width: var(--button-height-${s.tk}); }\n`;
  }
  css += `\n`;

  // ── SVG Sizes ──
  for (const s of sizes) {
    css += `${B}--${s.name} svg { width: var(--icon-size-${s.icon}); height: var(--icon-size-${s.icon}); }\n`;
  }
  css += `\n`;

  // ── Loading ──
  css += `${B}--loading {\n  pointer-events: none;\n  opacity: 0.6;\n}\n\n`;

  // ── Flex Grow ──
  css += `${B}--flex-grow {\n  flex-grow: 1;\n}\n`;

  return css;
}

const COMPONENTS_DIR = resolve(BUILD_DIR, 'components');
if (!existsSync(COMPONENTS_DIR)) {
  mkdirSync(COMPONENTS_DIR, { recursive: true });
}

writeFileSync(resolve(COMPONENTS_DIR, 'button.css'), generateButtonCSS());
console.log('Done! Output: build/components/button.css');
