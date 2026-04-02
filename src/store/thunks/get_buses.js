import { createAsyncThunk } from "@reduxjs/toolkit";

export const getVehicles = createAsyncThunk(
  "getVehicles",
  async (_, thunkAPI) => {
    try {
      const apiKey = import.meta.env.VITE_TRANZY_API_KEY;

      const response = await fetch(
        `https://api.tranzy.ai/v1/opendata/vehicles`,
        {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "X-Agency-Id": 2,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            data.message || "Unknown error"
          }`
        );
        }
        console.log(data)

      return data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: true,
        message: error.message || "Failed to fetch vehicles from API",
      });
    }
  }
);


export const getRoutes = createAsyncThunk(
  "getRoutes",
  async (_, thunkAPI) => {
    try {
      const apiKey = import.meta.env.VITE_TRANZY_API_KEY;

      const response = await fetch(
        `https://api.tranzy.ai/v1/opendata/routes`,
        {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "X-Agency-Id": 2,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            data.message || "Unknown error"
          }`
        );
      }

      return data || [];
    } catch (error) {
      return thunkAPI.rejectWithValue({
        error: true,
        message: error.message || "Failed to fetch routes from API",
      });
    }
  }
);