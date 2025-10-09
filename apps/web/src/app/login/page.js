"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FaChevronDown, FaArrowUp, FaStore, FaHeart, FaCommentDots, FaUsers, FaCalendarAlt, FaClock, FaUtensils, FaBus } from "react-icons/fa";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import IdFind from "./IdFind";
import PwFind from "./PwFind";

const featureSections = [
  {
    title: "맛집 추천",
    description: "학우들이 검증한 진짜 맛집, 실패 없는 선택을 경험하세요.",
    bgColor: "bg-amber-50",
    textColor: "text-amber-800",
  },
  {
    title: "번개 모임",
    description: "오늘 저녁 치킨 먹을 사람? 실시간으로 모임을 만들고 참여하세요.",
    bgColor: "bg-teal-50",
    textColor: "text-teal-800",
  },
  {
    title: "학식 & 셔틀 정보",
    description: "오늘의 학식 메뉴와 실시간 셔틀 위치를 한눈에 확인하세요.",
    bgColor: "bg-sky-50",
    textColor: "text-sky-800",
  },
  {
    title: "커뮤니티",
    description: "수업 정보부터 중고 거래까지, 우리 학교 학생들만의 소통 공간입니다.",
    bgColor: "bg-violet-50",
    textColor: "text-violet-800",
  },
];

const FeatureSection = ({
  title,
  description,
  bgColor,
  textColor,
  isLast,
}) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });
  const [activeTab, setActiveTab] = useState('shuttle');

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  const sampleRestaurants = [
    { name: "캠퍼스잇 치킨 정문점", address: "캠퍼스잇시 19번길 14", walkTime: 5, likes: 154, reviews: 42 },
    { name: "잇코리안 파스타하우스", address: "대학로 25-1", walkTime: 12, likes: 210, reviews: 68 },
    { name: "열공인의 든든한 밥집", address: "지식의숲길 77", walkTime: 2, likes: 189, reviews: 55 },
  ];

  const sampleMeetup = {
    tag: "저녁",
    title: "오늘 저녁 치킨 먹을 사람?",
    date: "10월 9일",
    time: "오후 7:00",
    location: "미스터치킨",
    participants: "1 / 4",
    organizer: "김캠퍼스",
  };
  
  const sampleChat = [
      { sender: "other", text: "안녕하세요!" },
      { sender: "me", text: "네 안녕하세요! 치킨 좋죠!" },
      { sender: "other", text: "언제 만날까요?" },
  ];

  const toCampusTimes = ["07:50", "08:05", "08:20", "08:35", "08:50", "09:05", "09:20", "09:35", "09:50", "10:05", "10:20", "10:35", "10:50", "11:05", "11:20", "11:30"];
  const fromCampusTimes = ["13:30", "13:50", "14:10", "14:30", "14:50", "15:10", "15:30", "15:50", "16:10", "16:30", "16:50", "17:10", "17:30", "17:50", "18:00"];
  
  const nextToCampus = "10:35";
  const nextFromCampus = "13:30";

  const sampleMenu = {
    lunch: { name: "든든 중식", time: "11:30 - 14:00", items: ["오늘의 백반", "특식: 돈까스 정식", "샐러드바", "김치", "요구르트"] },
    dinner: { name: "든든 석식", time: "17:30 - 19:00", items: ["제육볶음", "된장찌개", "계란찜", "공기밥", "배추김치"] },
    other: { name: "간편식", time: "09:00 - 19:00", items: ["라면", "김밥", "샌드위치", "음료"] }
  };
  
  const samplePosts = [
      { category: "자유게시판", title: "오늘 학식 비주얼 대박..", author: "컴공_23학번", university: "가나다대학교", likes: 25, commentsCount: 4, comments: [{author:"경영_24", text:"와 맛있겠다!"}, {author:"디자인_22", text:"우리 학교도 저렇게 나오면 좋겠다 ㅠㅠ"}] },
      { category: "정보공유", title: "토익 900점 넘으신 분 팁 좀 주세요!", author: "새내기", university: "캠퍼스잇대학교", likes: 48, commentsCount: 12, comments: [{author:"고인물", text:"단어만 외워도 800은 넘어요!"}, {author:"토익만점자", text:"LC는 쉐도잉이 진리입니다."}]},
      { category: "스터디모집", title: "주말에 같이 코테 스터디 하실 분?", author: "취준생", university: "대한민국대학교", likes: 12, commentsCount: 3, comments: [{author:"알고리즘고수", text:"저요! 같이해요!"}] }
  ];

  const pageVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToNext = () => {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={pageVariants}
      className={`relative min-h-[70vh] w-full flex flex-col items-center justify-center p-8 snap-center ${bgColor}`}
    >
      <div className="text-center w-full max-w-5xl">
        <h2 className={`text-5xl md:text-6xl font-extrabold mb-4 ${textColor}`}>
          {title}
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8">{description}</p>
        
        {title === "맛집 추천" ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={controls}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12"
          >
            {sampleRestaurants.map((resto, index) => (
              <motion.div key={index} variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col">
                <div className="bg-gray-200 rounded-lg h-40 flex items-center justify-center mb-4"><FaStore className="text-gray-400 text-5xl" /></div>
                <h3 className="font-bold text-lg text-gray-800 text-left">{resto.name}</h3>
                <p className="text-gray-500 text-sm text-left mt-1">📍 {resto.address} <span className="text-blue-600 font-semibold">(도보 {resto.walkTime}분)</span></p>
                <div className="flex items-center text-gray-500 mt-3 text-sm"><FaHeart className="text-red-500 mr-1" /> {resto.likes}<FaCommentDots className="ml-4 mr-1" /> {resto.reviews}</div>
                <div className="grid grid-cols-2 gap-2 mt-auto pt-4">
                  <button className="bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">리뷰보기</button>
                  <button className="bg-gray-600 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 transition">리뷰작성</button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : title === "번개 모임" ? (
            <motion.div variants={containerVariants} initial="hidden" animate={controls} className="mt-4 w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
                <div className="w-full max-w-sm flex flex-col items-center">
                    <motion.div variants={itemVariants} className="flex space-x-2 mb-4">
                        {['전체', '점심', '술', '취미', '스터디'].map(tag => (<button key={tag} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${tag === '점심' ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>{tag}</button>))}
                    </motion.div>
                    <motion.p variants={itemVariants} className="text-sm text-gray-500 mb-4">#태그로_관심사_필터링</motion.p>
                    <motion.div variants={itemVariants} className="relative w-full bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                        <div className="flex justify-between items-start"><span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">{sampleMeetup.tag}</span><span className="text-xs text-gray-500">7시간 뒤 마감</span></div>
                        <h3 className="text-lg font-bold text-gray-800 mt-3 text-left">{sampleMeetup.title}</h3>
                        <div className="space-y-2 mt-3 text-sm text-left">
                            <p className="flex items-center"><FaCalendarAlt className="mr-2 text-gray-400"/> {sampleMeetup.date}</p>
                            <p className="flex items-center"><FaClock className="mr-2 text-gray-400"/> {sampleMeetup.time}</p>
                            <p className="flex items-center"><FaStore className="mr-2 text-gray-400"/> {sampleMeetup.location}</p>
                            <p className="flex items-center"><FaUsers className="mr-2 text-gray-400"/> {sampleMeetup.participants}</p>
                        </div>
                        <div className="border-t mt-4 pt-3 flex justify-between items-center"><span className="text-sm font-semibold">{sampleMeetup.organizer}</span><div className="flex space-x-2"><button className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">채팅</button><button className="px-4 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">삭제</button></div></div>
                    </motion.div>
                    <motion.p variants={itemVariants} className="text-sm text-gray-500 mt-4">실시간으로_열리는_모임</motion.p>
                </div>
                <div className="w-full max-w-sm flex flex-col items-center">
                     <motion.div variants={itemVariants} className="w-full h-80 bg-white rounded-2xl shadow-lg flex flex-col border border-gray-200">
                        <div className="p-3 border-b font-bold text-gray-700">{`'${sampleMeetup.title}' 채팅방`}</div>
                        <div className="flex-grow p-3 space-y-3 overflow-y-auto">
                            {sampleChat.map((chat, index) => (
                                <motion.div key={index} variants={itemVariants} className={`flex ${chat.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-3 py-2 rounded-lg max-w-xs ${chat.sender === 'me' ? 'bg-yellow-300' : 'bg-gray-200'}`}><p className="text-sm">{chat.text}</p></div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-2 border-t"><input type="text" placeholder="메시지 입력..." className="w-full text-sm px-3 py-2 border rounded-lg" /></div>
                    </motion.div>
                    <motion.p variants={itemVariants} className="text-sm text-gray-500 mt-4">참여자들과_자유로운_대화</motion.p>
                </div>
            </motion.div>
        ) : title === "학식 & 셔틀 정보" ? (
            <motion.div variants={containerVariants} initial="hidden" animate={controls} className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <motion.div variants={itemVariants} className="flex justify-center items-center p-1 bg-gray-100 rounded-lg max-w-xs mx-auto">
                    <button onClick={() => setActiveTab('food')} className={`w-1/2 py-2 text-sm font-bold rounded-md transition ${activeTab === 'food' ? 'bg-white shadow' : 'text-gray-500'}`}><FaUtensils className="inline mr-1"/> 학식 메뉴</button>
                    <button onClick={() => setActiveTab('shuttle')} className={`w-1/2 py-2 text-sm font-bold rounded-md transition ${activeTab === 'shuttle' ? 'bg-white shadow' : 'text-gray-500'}`}><FaBus className="inline mr-1"/> 셔틀 시간표</button>
                </motion.div>
                {activeTab === 'shuttle' && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-green-400 to-cyan-500 text-white p-4 rounded-lg"><h3 className="font-bold">캠퍼스잇역 ↔ 캠퍼스(등교)</h3><p className="text-sm">총 16회 운행</p></div>
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4 rounded-lg"><h3 className="font-bold">캠퍼스 ↔ 캠퍼스잇역(하교)</h3><p className="text-sm">총 15회 운행</p></div>
                    <div className="grid grid-cols-4 gap-2">
                        {toCampusTimes.map(time => (<div key={time} className={`p-2 text-center rounded-md text-sm font-semibold border ${nextToCampus === time ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 border-gray-200'}`}>{time}{nextToCampus === time && <div className="text-xs font-bold">다음차</div>}</div>))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {fromCampusTimes.map(time => (<div key={time} className={`p-2 text-center rounded-md text-sm font-semibold border ${nextFromCampus === time ? 'bg-blue-500 text-white border-blue-600' : 'bg-gray-100 border-gray-200'}`}>{time}{nextFromCampus === time && <div className="text-xs font-bold">다음차</div>}</div>))}
                    </div>
                </motion.div>
                )}
                {activeTab === 'food' && (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.values(sampleMenu).map((meal, index) => (
                            <div key={index} className="bg-gray-50 border rounded-lg p-4">
                                <h4 className="font-bold text-lg text-gray-800">{meal.name}</h4><p className="text-xs text-gray-500 mb-3">{meal.time}</p>
                                <ul className="space-y-1 text-left">{meal.items.map((item, itemIndex) => (<li key={itemIndex} className="text-sm text-gray-700">{item}</li>))}</ul>
                            </div>
                        ))}
                    </motion.div>
                )}
            </motion.div>
        ) : title === "커뮤니티" ? (
            <motion.div variants={containerVariants} initial="hidden" animate={controls} className="w-full">
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 rounded-xl shadow-lg mb-8">
                    <h3 className="text-xl font-bold">전국 모든 대학생이 함께하는 곳!</h3>
                    <p className="text-sm opacity-90">우리 학교를 넘어, 더 넓은 캠퍼스의 이야기를 들어보세요.</p>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {samplePosts.map((post, index) => (
                        <motion.div key={index} variants={itemVariants} className="bg-white rounded-xl shadow-lg border p-5 flex flex-col">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full self-start mb-2 ${post.category === "자유게시판" ? "bg-sky-100 text-sky-800" : post.category === "정보공유" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>{post.category}</span>
                            <h4 className="text-md font-bold text-gray-800 text-left mb-2">{post.title}</h4>
                            <div className="text-xs text-gray-500 text-left mb-3">
                                <span>{post.author}</span>
                                <span className="mx-1">|</span>
                                <span>{post.university}</span>
                            </div>
                            <div className="border-t pt-3 mt-auto">
                                {post.comments.slice(0, 2).map((comment, cIndex) => (
                                    <div key={cIndex} className="text-left text-xs mb-2">
                                        <span className="font-semibold text-gray-600">{comment.author}:</span>
                                        <span className="text-gray-500 ml-1">{comment.text}</span>
                                    </div>
                                ))}
                                <div className="flex items-center text-xs text-gray-400 mt-2">
                                    <FaHeart className="mr-1 text-red-400"/> {post.likes}
                                    <FaCommentDots className="ml-3 mr-1"/> {post.commentsCount}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        ) : null}
      </div>

      {!isLast && (
        <div onClick={scrollToNext} className="absolute bottom-8 text-center cursor-pointer group animate-bounce"><FaChevronDown className="mx-auto text-2xl text-gray-400 group-hover:text-purple-600" /></div>
      )}
      
      {isLast && (
        <div onClick={scrollToTop} className="absolute bottom-10 w-full flex items-center justify-center cursor-pointer group">
            <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex items-center">
                <FaArrowUp className="text-gray-600 group-hover:text-purple-600 transition-colors mr-2" />
                <span className="font-semibold text-lg text-gray-700 group-hover:text-purple-600 transition-colors">로그인하러 가기</span>
            </div>
        </div>
      )}
    </motion.div>
  );
};


export default function LoginPage() {
  const [mode, setMode] = useState("login");

  const scrollToFeatures = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div id="login-section" className="min-h-screen bg-white flex flex-col items-center justify-center p-4 snap-start">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center mx-auto">
            <Image
              src="/icon.png"
              alt="캠퍼스잇 로고"
              width={460} 
              height={100}
              priority
            />
          </div>
          <p className="text-gray-500 mb-4 text-lg">
            대학생을 위한 종합 플랫폼
          </p> 

          {mode === "login" && <LoginForm setMode={setMode} />}
          {mode === "signup" && <SignUpForm setMode={setMode} />}
          {mode === "findID" && <IdFind />}
          {mode === "findPW" && <PwFind />}

          {mode !== "login" && (
             <div className="mt-6 text-center">
                <button type="button" onClick={() => setMode("login")} className="text-sm text-gray-500 hover:text-purple-600 hover:underline">
                  로그인 화면으로 돌아가기
                </button>
             </div>
          )}
        </div>
        <div onClick={scrollToFeatures} className="absolute bottom-8 text-center cursor-pointer group">
          <span className="text-gray-500 font-medium group-hover:text-purple-600 transition-colors">
            캠퍼스잇 미리보기!
          </span>
          <FaChevronDown className="mx-auto mt-2 text-gray-400 animate-bounce group-hover:text-purple-600" />
        </div>
      </div>
      <div className="snap-y snap-mandatory">
        {featureSections.map((feature, index) => (
          <FeatureSection
            key={feature.title}
            {...feature}
            isLast={index === featureSections.length - 1}
          />
        ))}
      </div>
    </>
  );
}