import { useState, useCallback } from 'react';

const TILE_LAYERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: 'Dark',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    label: 'Light',
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a>',
    label: 'Strazi',
  },
};

export function useMapTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('traseo_map_theme') || 'streets';
  });

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const keys = Object.keys(TILE_LAYERS);
      const next = keys[(keys.indexOf(prev) + 1) % keys.length];
      localStorage.setItem('traseo_map_theme', next);
      return next;
    });
  }, []);

  return { theme, tileLayer: TILE_LAYERS[theme], cycleTheme, TILE_LAYERS };
}
