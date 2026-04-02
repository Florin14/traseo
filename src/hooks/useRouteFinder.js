import { useMemo } from 'react';

/**
 * Given stopTimes and trips, find which routes connect two stops.
 * Returns routes that have both stops in the same trip direction,
 * with fromStop appearing before toStop in the sequence.
 */
export function useRouteFinder(stops, stopTimes, trips, routes) {
  // Build a lookup: routeId -> { directionId -> [stopId in order] }
  const routeStopSequences = useMemo(() => {
    if (!stopTimes.length || !trips.length) return {};

    const tripToRoute = {};
    const tripToDir = {};
    trips.forEach((t) => {
      tripToRoute[t.trip_id] = t.route_id;
      tripToDir[t.trip_id] = t.direction_id;
    });

    // Group stop_times by trip_id, sorted by sequence
    const tripStops = {};
    stopTimes.forEach((st) => {
      if (!tripStops[st.trip_id]) tripStops[st.trip_id] = [];
      tripStops[st.trip_id].push(st);
    });

    const result = {};
    Object.entries(tripStops).forEach(([tripId, sts]) => {
      const routeId = tripToRoute[tripId];
      if (routeId === undefined) return;
      const dirId = tripToDir[tripId];

      sts.sort((a, b) => a.stop_sequence - b.stop_sequence);
      const stopIds = sts.map((s) => s.stop_id);

      if (!result[routeId]) result[routeId] = {};
      result[routeId][dirId] = stopIds;
    });

    return result;
  }, [stopTimes, trips]);

  const routeMap = useMemo(() => {
    const m = {};
    routes.forEach((r) => { m[r.route_id] = r; });
    return m;
  }, [routes]);

  /**
   * Find routes connecting fromStopId -> toStopId
   */
  function findRoutes(fromStopId, toStopId) {
    if (!fromStopId || !toStopId) return [];

    const results = [];
    Object.entries(routeStopSequences).forEach(([routeId, dirs]) => {
      Object.entries(dirs).forEach(([dirId, stopIds]) => {
        const fromIdx = stopIds.indexOf(fromStopId);
        const toIdx = stopIds.indexOf(toStopId);
        if (fromIdx >= 0 && toIdx >= 0 && fromIdx < toIdx) {
          const route = routeMap[parseInt(routeId)];
          if (route) {
            results.push({
              route,
              directionId: parseInt(dirId),
              stopsCount: toIdx - fromIdx,
              totalStops: stopIds.length,
              trip: trips.find((t) => t.route_id === parseInt(routeId) && t.direction_id === parseInt(dirId)),
            });
          }
        }
      });
    });

    // Sort by fewest stops
    results.sort((a, b) => a.stopsCount - b.stopsCount);
    return results;
  }

  return { findRoutes };
}
