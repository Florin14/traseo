import { configureStore, createSlice } from "@reduxjs/toolkit";
import { getVehicles } from "./thunks/get_buses";

// Create a slice for vehicles
const vehiclesSlice = createSlice({
  name: "vehicles",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(getVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const store = configureStore({
  reducer: {
    vehicles: vehiclesSlice.reducer,
  },
});

export default store;
