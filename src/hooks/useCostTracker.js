import { useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'traseo_trips';

function loadTrips() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTrips(trips) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function useCostTracker(ticketPrice = 3, monthlyPassPrice = 100) {
  const [trips, setTrips] = useState(loadTrips);

  const addTrip = useCallback((trip) => {
    setTrips((prev) => {
      const next = [
        ...prev,
        {
          id: `trip-${Date.now()}`,
          date: new Date().toISOString(),
          cost: trip.cost || ticketPrice,
          routeName: trip.routeName || '',
          routeId: trip.routeId || null,
          note: trip.note || '',
        },
      ];
      saveTrips(next);
      return next;
    });
  }, [ticketPrice]);

  const removeTrip = useCallback((id) => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTrips(next);
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = trips.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonth = trips.filter((t) => {
      const d = new Date(t.date);
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const thisMonthTotal = thisMonth.reduce((s, t) => s + t.cost, 0);
    const lastMonthTotal = lastMonth.reduce((s, t) => s + t.cost, 0);
    const thisMonthTrips = thisMonth.length;
    const avgPerDay = thisMonthTrips > 0 ? (thisMonthTotal / Math.max(now.getDate(), 1)) : 0;
    const projectedMonthly = avgPerDay * 30;

    const routeFreq = {};
    thisMonth.forEach((t) => {
      if (t.routeName) routeFreq[t.routeName] = (routeFreq[t.routeName] || 0) + 1;
    });
    const topRoutes = Object.entries(routeFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const passWouldSave = thisMonthTotal > monthlyPassPrice ? thisMonthTotal - monthlyPassPrice : 0;
    const passWorthIt = projectedMonthly > monthlyPassPrice;
    const breakEvenTrips = Math.ceil(monthlyPassPrice / ticketPrice);
    const taxiEquivalent = thisMonthTrips * 15;
    const savedVsTaxi = taxiEquivalent - thisMonthTotal;

    return {
      thisMonthTotal,
      lastMonthTotal,
      thisMonthTrips,
      avgPerDay: Math.round(avgPerDay * 100) / 100,
      projectedMonthly: Math.round(projectedMonthly),
      topRoutes,
      passWouldSave: Math.round(passWouldSave),
      passWorthIt,
      breakEvenTrips,
      savedVsTaxi: Math.round(savedVsTaxi),
      taxiEquivalent: Math.round(taxiEquivalent),
      ticketPrice,
      monthlyPassPrice,
    };
  }, [trips, ticketPrice, monthlyPassPrice]);

  return { trips, addTrip, removeTrip, stats };
}
