import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchShapes = createAsyncThunk(
  'shapes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getShapes();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const shapesSlice = createSlice({
  name: 'shapes',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShapes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShapes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchShapes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default shapesSlice.reducer;
