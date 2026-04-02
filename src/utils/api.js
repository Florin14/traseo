const API_BASE = 'https://api.tranzy.ai/v1/opendata';
const API_KEY = import.meta.env.VITE_TRANZY_API_KEY;
const AGENCY_ID = '2';

const headers = {
  'X-API-Key': API_KEY,
  'X-Agency-Id': AGENCY_ID,
  'Accept': 'application/json',
};

async function fetchAPI(endpoint) {
  const response = await fetch(`${API_BASE}/${endpoint}`, { headers });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `API error: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getVehicles: () => fetchAPI('vehicles'),
  getRoutes: () => fetchAPI('routes'),
  getTrips: () => fetchAPI('trips'),
  getStops: () => fetchAPI('stops'),
  getStopTimes: () => fetchAPI('stop_times'),
  getShapes: () => fetchAPI('shapes'),
  getAgency: () => fetchAPI('agency'),
};
