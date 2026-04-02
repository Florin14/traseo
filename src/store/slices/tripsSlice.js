import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchTrips = createAsyncThunk(
  'trips/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getTrips();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const tripsSlice = createSlice({
  name: 'trips',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default tripsSlice.reducer;
