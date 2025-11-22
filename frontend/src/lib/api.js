import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://158.180.68.205:3000/api', 
});

export default apiClient;