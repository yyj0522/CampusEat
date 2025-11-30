import { DataSource } from 'typeorm';
import { CampusStatusMessage } from './src/campus-status/entities/campus-status-message.entity';
import { User } from './src/users/user.entity';
import { University } from './src/universities/entities/university.entity';
import 'dotenv/config';
import * as path from 'path';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || '158.180.68.205',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'postgres',
  entities: [path.join(__dirname, 'src/**/*.entity.ts')],
  synchronize: false,
});

const TRAFFIC_MSGS = [
  '두정역 셔틀 줄 1번 출구까지 섰음. 최소 30분 대기각',
  '셔틀 기사님 피셜 눈와서 차 막힌다고 함. 배차 간격 20분 넘음',
  '택시 승강장도 줄 김. 합승하실 분 구해요',
  '정문 앞 도로 제설 안돼서 차들 기어감',
  '1번 버스 방금 만차로 떠남. 다음 차 언제 오냐',
  '셔틀 줄 너무 길어서 지각 확정임 교수님 봐주세요',
  '후문 쪽 주차장 자리 없음. 빙빙 돌지 말고 딴데 가세요',
  '지금 하교 셔틀 줄 체육관까지 이어짐',
  '두정역 가는 셔틀 지금 타면 앉아서 갈 수 있음',
  '택시도 안 잡히고 버스도 안 오고 고립됨',
];

const CAFETERIA_MSGS = [
  '학생회관 돈까스 벌써 품절됨. 제육만 남음',
  '학식 키오스크 2대 고장나서 줄 엄청 김',
  '교직원 식당은 그나마 한산함. 학식 줄 길면 거기로',
  '오늘 특식이라 사람 미어터짐',
  '매점 샌드위치랑 김밥 다 팔렸어요 ㅠㅠ',
  '지금 식당 자리 없어서 서서 기다리는 중',
  '학식 맛없음 오늘 메뉴 거르세요',
  '컵라면 자판기 고장남',
  '카페 아메리카노 나오는데 20분 걸림',
  '식권 발매기 카드 결제 안됨 현금 준비하세요',
];

const WEATHER_MSGS = [
  '예술대학 올라가는 계단 얼음판임 조심하세요',
  '본부동 앞 바람 너무 세서 날아갈 뻔',
  '도서관 앞 제설 작업 안 되어 있어서 미끄러움',
  '후문 쪽 내리막길 빙판이니까 돌아가세요',
  '비 와서 운동장 물웅덩이 엄청 생김',
  '오늘 날씨 미쳤다 패딩 필수',
  '강의실 에어컨 너무 빵빵해서 추워요',
  '난방 안 틀어주나 발 시려움',
  '눈 때문에 학교 경치 좋네요 사진 찍으러 오세요',
  '안개 너무 심해서 앞이 안 보임',
];

const EVENT_MSGS = [
  '총학생회 간식 나눔 행사 줄 100미터 넘음',
  '오늘 본부동 앞에서 동아리 버스킹 한다는데 취소됐나요?',
  '대운동장에서 눈싸움 하실 분 구함',
  '축제 부스 재료 소진돼서 마감했대요',
  '졸업 사진 찍는 사람들 때문에 정문 혼잡함',
  '플리마켓 구경할 거 많음',
  '취업 박람회 기념품 다 떨어짐',
  '동아리 홍보 부스 시끄러워서 수업 집중 안됨',
  '야외 영화 상영회 자리 꽉 참',
  '푸드트럭 줄 너무 길어서 포기함',
];

const ETC_MSGS = [
  '도서관 3열람실 자리 하나도 없습니다',
  '공학관 엘리베이터 또 고장남 5층까지 걸어감',
  '2기숙사 택배 수령처 사람 너무 많음',
  '도서관 열람실 빌런 출몰 조용히 좀 합시다',
  '본부동 앞에서 공사 소음 너무 심해요',
  '체육관 샤워실 온수 안 나옵니다',
  '도서관 와이파이 연결 자꾸 끊겨요',
  '과방 비밀번호 바뀜 아시는 분?',
  '분실물 습득함 학생증 찾아가세요',
  '기숙사 세탁기 다 돌아가는 중 대기해야 함',
];

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generateDummyData = async () => {
  try {
    await dataSource.initialize();
    console.log('✅ DB Connected for Seeding');

    const messageRepo = dataSource.getRepository(CampusStatusMessage);
    const userRepo = dataSource.getRepository(User);
    
    // [수정] DB에서 아무 유저나 한 명 찾아서 author로 사용
    const existUser = await userRepo.findOne({ where: {} });
    
    if (!existUser) {
        console.error("❌ Error: DB에 유저가 한 명도 없습니다! 회원가입을 먼저 해주세요.");
        await dataSource.destroy();
        return;
    }

    const universityId = 161; 
    const authorId = existUser.id; // 찾은 유저의 ID 사용

    console.log(`ℹ️ Found User ID: ${authorId}. Starting data generation...`);

    const dummyData = [];
    const now = new Date();

    // 지난 4주간 (28일) 데이터 생성
    for (let d = 0; d < 28; d++) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - d);
      const dayOfWeek = targetDate.getDay(); // 0:일, 1:월 ... 6:토

      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const isRainyDay = Math.random() < 0.15;
      const isEventDay = Math.random() < 0.1;

      for (let h = 8; h <= 22; h++) {
        let msgCount = 0;
        let categories = [];

        // 시간대별 패턴 설정
        if (h >= 8 && h <= 9) {
          msgCount = Math.floor(Math.random() * 5) + 3;
          categories = ['TRAFFIC', 'TRAFFIC', 'TRAFFIC', 'WEATHER'];
        } else if (h >= 11 && h <= 13) {
          msgCount = Math.floor(Math.random() * 6) + 4;
          categories = ['CAFETERIA', 'CAFETERIA', 'CAFETERIA', 'ETC'];
        } else if (h >= 17 && h <= 18) {
          msgCount = Math.floor(Math.random() * 5) + 3;
          categories = ['TRAFFIC', 'TRAFFIC', 'ETC'];
        } else {
          msgCount = Math.floor(Math.random() * 2);
          categories = ['ETC', 'WEATHER'];
        }

        if (isRainyDay && Math.random() > 0.5) categories.push('WEATHER');
        if (isEventDay && h >= 10 && h <= 17) categories.push('EVENT');

        for (let i = 0; i < msgCount; i++) {
          const category = categories[Math.floor(Math.random() * categories.length)];
          let content = '';

          switch (category) {
            case 'TRAFFIC': content = getRandom(TRAFFIC_MSGS); break;
            case 'CAFETERIA': content = getRandom(CAFETERIA_MSGS); break;
            case 'WEATHER': content = getRandom(WEATHER_MSGS); break;
            case 'EVENT': content = getRandom(EVENT_MSGS); break;
            default: content = getRandom(ETC_MSGS); break;
          }

          const createdAt = new Date(targetDate);
          createdAt.setHours(h, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

          dummyData.push({
            content,
            category,
            isVerified: true,
            createdAt,
            universityId,
            authorId,
            weatherCondition: isRainyDay ? 'RAIN' : 'SUNNY'
          });
        }
      }
    }

    // 대량 삽입 (Batch Insert)
    const BATCH_SIZE = 500;
    for (let i = 0; i < dummyData.length; i += BATCH_SIZE) {
      const batch = dummyData.slice(i, i + BATCH_SIZE);
      await messageRepo.save(batch);
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`);
    }

    console.log(`🎉 Successfully inserted ${dummyData.length} records for University ID ${universityId}`);
    await dataSource.destroy();
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    await dataSource.destroy();
  }
};

generateDummyData();