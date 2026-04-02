import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getVehicles();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState: {
    data: [],
    loading: false,
    error: null,
    lastUpdated: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default vehiclesSlice.reducer;
