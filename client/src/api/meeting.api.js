import apiClient from './client.js';

export const getMeetingsApi = (params) => apiClient.get('/meetings', { params });
export const createMeetingApi = (data) => apiClient.post('/meetings', data);
export const updateMeetingApi = ({ id, ...data }) => apiClient.put(`/meetings/${id}`, data);
export const deleteMeetingApi = (id) => apiClient.delete(`/meetings/${id}`);
