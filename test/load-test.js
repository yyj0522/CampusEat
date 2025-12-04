import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // 100명까지 늘어나는 시나리오 (발표용)
  stages: [
    { duration: '10s', target: 20 },  // 10초 동안 20명
    { duration: '20s', target: 30 },  // 20초 동안 30명 유지 (현실적 부하)
    { duration: '10s', target: 0 },   // 종료
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%가 2초 이내면 성공 (여유 있게 설정)
  },
};

export default function () {
  const BASE_URL = 'http://158.180.68.205:3000/api'; 

  // [중요] 아까 성공했던 실제 아이디/비번을 다시 적어주세요!
  const payload = JSON.stringify({
    email: 'koko5648@naver.com', 
    password: '1234',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 올바른 주소 /signin 사용
  const res = http.post(`${BASE_URL}/auth/signin`, payload, params);

  check(res, {
    '로그인 성공(200/201)': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}