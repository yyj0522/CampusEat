import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.campuseat.shop/api', 
});

export default apiClient;