import { DataSource } from 'typeorm';
import 'dotenv/config';
import * as path from 'path';
import { Lecture } from './src/timetable/lecture.entity';

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

const LECTURE_DATA = [
  {
    id: 1483,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335501",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "김호영",
    schedule: [{ day: "목", periods: [7], classroom: "진리406" }],
    courseType: "GE"
  },
  {
    id: 1484,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335502",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "최윤영",
    schedule: [{ day: "수", periods: [6], classroom: "진리305" }],
    courseType: "GE"
  },
  {
    id: 1485,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335503",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "강혜리",
    schedule: [{ day: "목", periods: [2], classroom: "진리406" }],
    courseType: "GE"
  },
  {
    id: 1486,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335504",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "서민지",
    schedule: [{ day: "목", periods: [2], classroom: "진리305" }],
    courseType: "GE"
  },
  {
    id: 1487,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335505",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "김수영",
    schedule: [{ day: "화", periods: [2], classroom: "본부312" }],
    courseType: "GE"
  },
  {
    id: 1488,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335506",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "한만오",
    schedule: [{ day: "수", periods: [2], classroom: "본부307" }],
    courseType: "GE"
  },
  {
    id: 1489,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335507",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "서장국",
    schedule: [{ day: "화", periods: [3], classroom: "본부312" }],
    courseType: "GE"
  },
  {
    id: 1490,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335508",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "김현정",
    schedule: [{ day: "화", periods: [3], classroom: "본부718" }],
    courseType: "GE"
  },
  {
    id: 1491,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335509",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 60,
    professor: "민경상,이용태",
    schedule: [{ day: "화", periods: [3], classroom: "본부315" }],
    courseType: "GE"
  },
  {
    id: 1492,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335510",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 60,
    professor: "송병호",
    schedule: [{ day: "수", periods: [6], classroom: "본부709" }],
    courseType: "GE"
  },
  {
    id: 1493,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335511",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 60,
    professor: "이건수",
    schedule: [{ day: "화", periods: [5], classroom: "본부709" }],
    courseType: "GE"
  },
  {
    id: 1494,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335512",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송선욱,문성현,신성호",
    schedule: [{ day: "월", periods: [1], classroom: "지혜602" }],
    courseType: "GE"
  },
  {
    id: 1495,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335513",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송주은,정혜욱,이상연,최경열,김종국",
    schedule: [{ day: "월", periods: [4], classroom: "예술206" }],
    courseType: "GE"
  },
  {
    id: 1496,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335514",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송주은,정혜욱,이상연,최경열,김종국",
    schedule: [{ day: "월", periods: [4], classroom: "예술317" }],
    courseType: "GE"
  },
  {
    id: 1497,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335515",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송주은,정혜욱,이상연,최경열,김종국",
    schedule: [{ day: "월", periods: [4], classroom: "예술318" }],
    courseType: "GE"
  },
  {
    id: 1498,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335516",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송주은,정혜욱,이상연,최경열,김종국",
    schedule: [{ day: "월", periods: [4], classroom: "본부102" }],
    courseType: "GE"
  },
  {
    id: 1499,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335517",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 40,
    professor: "송주은,정혜욱,이상연,최경열,김종국",
    schedule: [{ day: "월", periods: [4], classroom: "예술319" }],
    courseType: "GE"
  },
  {
    id: 1500,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335518",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 60,
    professor: "권봉헌,박슬기,고영길,심지연",
    schedule: [{ day: "화", periods: [8], classroom: "본부404" }],
    courseType: "GE"
  },
  {
    id: 1501,
    university: "백석대학교",
    campus: "천안",
    department: "교양",
    major: "사랑의실천",
    year: 2025,
    semester: "2학기",
    group: "교양",
    courseCode: "0335519",
    courseName: "기독교세계관",
    hours: 1,
    credits: 1,
    capacity: 60,
    professor: "권봉헌,박슬기,고영길,심지연",
    schedule: [{ day: "화", periods: [8], classroom: "본부414" }],
    courseType: "GE"
  }
];

const seedLectures = async () => {
  try {
    await dataSource.initialize();
    console.log('✅ DB Connected for Seeding');

    const lectureRepo = dataSource.getRepository(Lecture);

    console.log(`ℹ️ Starting to insert ${LECTURE_DATA.length} lectures...`);

    for (const data of LECTURE_DATA) {
      const existingLecture = await lectureRepo.findOne({ where: { id: data.id } });
      
      if (existingLecture) {
        console.log(`⚠️ Lecture ID ${data.id} already exists. Skipping...`);
        continue;
      }

      const newLecture = lectureRepo.create(data);
      await lectureRepo.save(newLecture);
      
      console.log(`✅ Inserted Lecture ID: ${data.id} - ${data.courseName}`);
    }

    console.log(`🎉 Successfully finished seeding lectures.`);
    await dataSource.destroy();
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

seedLectures();