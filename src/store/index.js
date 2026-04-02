import { configureStore } from '@reduxjs/toolkit';
import vehiclesReducer from './slices/vehiclesSlice';
import routesReducer from './slices/routesSlice';
import stopsReducer from './slices/stopsSlice';
import tripsReducer from './slices/tripsSlice';
import shapesReducer from './slices/shapesSlice';
import stopTimesReducer from './slices/stopTimesSlice';

export const store = configureStore({
  reducer: {
    vehicles: vehiclesReducer,
    routes: routesReducer,
    stops: stopsReducer,
    trips: tripsReducer,
    shapes: shapesReducer,
    stopTimes: stopTimesReducer,
  },
});

export default store;
