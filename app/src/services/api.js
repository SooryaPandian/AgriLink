import axios from 'axios';

// On Android emulator use 10.0.2.2 to reach localhost; on Expo Go device use your machine's IP
const BASE_URL = 'http://172.4.1.157:5000/api'; // Change to your local IP for physical device

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default api;
