import axios from 'axios';

export function createApiClient() {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        console.error('API error', error.response.status, error.response.data);
      } else {
        console.error('API error', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
}
