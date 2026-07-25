// Preset tema yang bisa dipilih user, plus utility untuk generate shade dari warna dasar
// sehingga seluruh UI (yang tadinya hardcoded rose-500 dkk) otomatis ikut berubah warna.

export const THEME_PRESETS = [
  { name: 'Rose',   hex: '#f43f5e' },
  { name: 'Pink',   hex: '#ec4899' },
  { name: 'Ungu',   hex: '#8b5cf6' },
  { name: 'Biru',   hex: '#3b82f6' },
  { name: 'Hijau',  hex: '#10b981' },
  { name: 'Oranye', hex: '#f97316' },
  { name: 'Merah',  hex: '#ef4444' },
  { name: 'Teal',   hex: '#14b8a6' },
];

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Generate CSS custom properties (shades 50-600) dari satu warna dasar (dianggap setara shade 500) */
export function themeToCssVars(baseHex: string): Record<string, string> {
  const [h, s] = hexToHsl(baseHex);
  return {
    '--accent-50': hslToHex(h, Math.min(s, 85), 97),
    '--accent-100': hslToHex(h, Math.min(s, 85), 93),
    '--accent-200': hslToHex(h, Math.min(s, 80), 85),
    '--accent-300': hslToHex(h, Math.min(s, 80), 75),
    '--accent-400': hslToHex(h, s, 64),
    '--accent-500': baseHex,
    '--accent-600': hslToHex(h, s, 42),
  };
}
