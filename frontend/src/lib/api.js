// 파일 경로: lib/api.js (예시)
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // 백엔드 서버 주소
});

export default apiClient;