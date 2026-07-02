import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add global error interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    console.error(`API Error: ${message}`, error);

    const customError = new Error(message);
    customError.statusCode = error.response?.status;
    customError.response = error.response;

    return Promise.reject(customError);
  }
);

export default apiClient;