import apiClient from './client.js';

export const getSettingsApi = () => apiClient.get('/settings/org');
export const updateSettingsApi = (data) => apiClient.put('/settings/org', data);

export const getPersonalSettingsApi = () => apiClient.get('/settings/personal');
export const updatePersonalSettingsApi = (data) => apiClient.put('/settings/personal', data);
