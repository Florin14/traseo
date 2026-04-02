import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../utils/api';

export const fetchShapes = createAsyncThunk(
  'shapes/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const raw = await api.getShapes();
      // Pre-index by shape_id -> sorted points array for O(1) lookup
      const indexed = {};
      raw.forEach((p) => {
        if (!indexed[p.shape_id]) indexed[p.shape_id] = [];
        indexed[p.shape_id].push(p);
      });
      // Sort each shape's points by sequence
      Object.values(indexed).forEach((pts) =>
        pts.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence)
      );
      return indexed;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const shapesSlice = createSlice({
  name: 'shapes',
  initialState: {
    data: {},       // { shapeId: [{ shape_pt_lat, shape_pt_lon, ... }] }
    loaded: false,
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
        state.loaded = true;
        state.data = action.payload;
      })
      .addCase(fetchShapes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default shapesSlice.reducer;
