import apiClient from './client.js';

export const getEmployeesApi = (params) => apiClient.get('/employees', { params });
export const getEmployeeByIdApi = (id) => apiClient.get(`/employees/${id}`);
export const createEmployeeApi = (data) => apiClient.post('/employees', data);
export const updateEmployeeApi = ({ id, ...data }) => apiClient.put(`/employees/${id}`, data);
export const deleteEmployeeApi = (id) => apiClient.delete(`/employees/${id}`);
export const resetEmployeePasswordApi = (id) => apiClient.post(`/employees/${id}/reset-password`);
