import { useState, useCallback } from 'react';

const STORAGE_KEY = 'traseo_favorites';

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

/**
 * Favorite entry shape:
 * {
 *   id: string,          // unique id
 *   type: 'route' | 'partial_route',
 *   routeId: number,
 *   routeName: string,   // short name like "10"
 *   routeLongName: string,
 *   // For partial routes:
 *   fromStopId?: number,
 *   fromStopName?: string,
 *   toStopId?: number,
 *   toStopName?: string,
 *   directionId?: number,
 *   addedAt: string,      // ISO date
 * }
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(loadFavorites);

  const addFavorite = useCallback((entry) => {
    setFavorites((prev) => {
      // Avoid duplicates
      const exists = prev.some((f) => f.id === entry.id);
      if (exists) return prev;
      const next = [...prev, { ...entry, addedAt: new Date().toISOString() }];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => {
    return favorites.some((f) => f.id === id);
  }, [favorites]);

  const toggleFavorite = useCallback((entry) => {
    if (favorites.some((f) => f.id === entry.id)) {
      removeFavorite(entry.id);
    } else {
      addFavorite(entry);
    }
  }, [favorites, addFavorite, removeFavorite]);

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
