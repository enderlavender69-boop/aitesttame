export const Theme = {
  biomes: {
    grass: {
      ground: '#2d5a2d',
      groundLight: '#3a7a3a',
      groundDark: '#1e4a1e',
    },
    dirt: {
      ground: '#5d4e37',
      groundLight: '#7d6e47',
      groundDark: '#3d2e17',
    },
    water: {
      ground: '#1a4a7a',
      groundLight: '#2a6a9a',
      groundDark: '#0a2a4a',
    },
  },

  player: {
    body: '#ffcc00',
    bodyStroke: '#cc9900',
    indicator: '#ffffff',
    hand: '#ffdd88',
    tool: '#888888',
    toolStroke: '#555555',
  },

  tree: {
    trunk: '#4a3728',
    trunkDark: '#3a2718',
    canopy: '#2d7a2d',
    canopyLight: '#3d9a3d',
    canopyDark: '#1d5a1d',
    canopyHighlight: '#4db84d',
  },

  rock: {
    base: '#5a5a5a',
    light: '#7a7a7a',
    dark: '#3a3a3a',
    highlight: '#9a9a9a',
    shadow: '#2a2a2a',
  },

  bush: {
    base: '#2d6a2d',
    light: '#3d8a3d',
    dark: '#1d4a1d',
    berry: '#cc2222',
    berryGlow: '#ff4444',
  },

  ui: {
    debugBg: 'rgba(0, 0, 0, 0.8)',
    debugText: '#00ff00',
    debugAccent: '#ffff00',
    healthFull: '#00cc00',
    healthMid: '#cccc00',
    healthLow: '#cc0000',
  },

  grid: {
    major: '#3a3a5a',
    minor: '#2a2a4a',
  },
};

export function lerpColor(c1, c2, t) {
  const parse = (c) => {
    if (c.startsWith('#')) c = c.slice(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    return {
      r: parseInt(c.slice(0, 2), 16),
      g: parseInt(c.slice(2, 4), 16),
      b: parseInt(c.slice(4, 6), 16),
    };
  };
  const a = parse(c1);
  const b = parse(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bb = Math.round(a.b + (b.b - a.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
}

export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const kk = k(n);
    const val = l - a * Math.max(-1, Math.min(kk - 3, Math.min(9 - kk, 1)));
    return Math.round(255 * val).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generatePalette(baseHue, count = 5) {
  return Array.from({ length: count }, (_, i) => hslToHex(baseHue + i * 15, 60, 40 + i * 8));
}