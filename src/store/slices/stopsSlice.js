import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchStops = createAsyncThunk(
  'stops/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getStops();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const stopsSlice = createSlice({
  name: 'stops',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStops.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStops.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStops.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default stopsSlice.reducer;
