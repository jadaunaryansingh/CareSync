import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 15000,
});

// ── Attach auth token to every request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('caresync_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Handle 401 (expired / invalid token) ──
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('caresync_token');
      localStorage.removeItem('caresync_user');
      window.dispatchEvent(new Event('caresync:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──
export const authLogin  = (data) => api.post('/api/auth/login', data);
export const authSignup = (data) => api.post('/api/auth/signup', data);
export const getMe      = ()     => api.get('/api/auth/me');
export const getRegistrations = (status) => api.get('/api/auth/registrations', { params: { status } });
export const approveRegistration = (id) => api.patch(`/api/auth/registrations/${id}/approve`);
export const rejectRegistration  = (id, reason) => api.patch(`/api/auth/registrations/${id}/reject`, { rejection_reason: reason });

// Dashboard
export const getDashboard = () => api.get('/api/dashboard');
export const getActivity = (limit = 20) => api.get(`/api/activity?limit=${limit}`);

// Beds
export const getBeds = (ward, status) => api.get('/api/beds', { params: { ward, status } });
export const getBedStats = () => api.get('/api/beds/stats');
export const getBed = (id) => api.get(`/api/beds/${id}`);
export const createBed = (data) => api.post('/api/beds', data);
export const admitPatient = (id, data) => api.patch(`/api/beds/${id}/admit`, data);
export const dischargePatient = (id) => api.patch(`/api/beds/${id}/discharge`);
export const updateBedStatus = (id, data) => api.patch(`/api/beds/${id}/status`, data);
export const deleteBed = (id) => api.delete(`/api/beds/${id}`);

// Blood
export const getBlood = () => api.get('/api/blood');
export const updateBlood = (data) => api.post('/api/blood/update', data);

// Oxygen
export const getOxygen = () => api.get('/api/oxygen');
export const oxygenAction = (id, action) => api.post(`/api/oxygen/${id}/action`, { action });

// Ambulances
export const getAmbulances = (status) => api.get('/api/ambulances', { params: { status } });
export const getAmbulanceStats = () => api.get('/api/ambulances/stats');
export const addAmbulance = (data) => api.post('/api/ambulances', data);
export const dispatchAmbulance = (id, destination) => api.patch(`/api/ambulances/${id}/dispatch`, null, { params: { destination } });
export const recallAmbulance = (id) => api.patch(`/api/ambulances/${id}/recall`);
export const clearAmbulance = (id) => api.patch(`/api/ambulances/${id}/clear`);
export const refuelAmbulance = (id) => api.patch(`/api/ambulances/${id}/fuel`);
export const deleteAmbulance = (id) => api.delete(`/api/ambulances/${id}`);

// Staff
export const getStaff = (status, search) => api.get('/api/staff', { params: { status, search } });
export const getStaffStats = () => api.get('/api/staff/stats');
export const addStaff = (data) => api.post('/api/staff', data);
export const updateStaff = (id, data) => api.patch(`/api/staff/${id}`, data);
export const deleteStaff = (id) => api.delete(`/api/staff/${id}`);

// Emergencies
export const getEmergencies = (status) => api.get('/api/emergencies', { params: { status } });
export const getEmergencyStats = () => api.get('/api/emergencies/stats');
export const getEmergencyMap = () => api.get('/api/emergencies/map');
export const createEmergency = (data) => api.post('/api/emergencies', data);
export const approveEmergency = (id) => api.patch(`/api/emergencies/${id}/approve`);
export const declineEmergency = (id) => api.patch(`/api/emergencies/${id}/decline`);
export const resolveEmergency = (id) => api.patch(`/api/emergencies/${id}/resolve`);
export const reopenEmergency = (id) => api.patch(`/api/emergencies/${id}/reopen`);
