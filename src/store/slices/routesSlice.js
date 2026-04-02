import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchRoutes = createAsyncThunk(
  'routes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getRoutes();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const routesSlice = createSlice({
  name: 'routes',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default routesSlice.reducer;
