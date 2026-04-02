import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchStopTimes = createAsyncThunk(
  'stopTimes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getStopTimes();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const stopTimesSlice = createSlice({
  name: 'stopTimes',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStopTimes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStopTimes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchStopTimes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default stopTimesSlice.reducer;
