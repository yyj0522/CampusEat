"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { useAuth } from "../../context/AuthProvider";

const CATEGORIES = [
  { id: 'TRAFFIC', label: '교통/셔틀' },
  { id: 'CAFETERIA', label: '학식/식당' },
  { id: 'EVENT', label: '행사/축제' },
  { id: 'WEATHER', label: '날씨/시설' },
  { id: 'ETC', label: '기타' },
];

const CATEGORY_STYLES = {
  TRAFFIC: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  CAFETERIA: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  EVENT: { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  WEATHER: { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-100' },
  ETC: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' },
};

const DAYS = [
  { id: 'MON', label: '월' },
  { id: 'TUE', label: '화' },
  { id: 'WED', label: '수' },
  { id: 'THU', label: '목' },
  { id: 'FRI', label: '금' },
];

export default function CampusStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('REALTIME');
  
  const [summaryData, setSummaryData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TRAFFIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [selectedDay, setSelectedDay] = useState('MON');
  const [predictionData, setPredictionData] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchSummary = useCallback(async () => {
    if (!user) return; 

    try {
      const response = await apiClient.get('/campus/status/summary/latest');
      if (response.data && response.data.breakdown) {
        setSummaryData(response.data.breakdown);
        setLastUpdated(response.data.createdAt);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const fetchPrediction = useCallback(async () => {
    try {
      setPredictionData(null);
      const response = await apiClient.get(`/campus/status/prediction?day=${selectedDay}`);
      if (response.data && response.data.status === 'success') {
        setPredictionData(response.data.timeline);
      }
    } catch (error) {
      console.error(error);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (user && activeTab === 'REALTIME') {
      fetchSummary();
      const intervalId = setInterval(fetchSummary, 10000);
      return () => clearInterval(intervalId);
    } else if (user && activeTab === 'FORECAST') {
      fetchPrediction();
    }
  }, [fetchSummary, fetchPrediction, user, activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/campus/status', {
        content,
        category: selectedCategory,
      });
      setContent('');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error(error);
      alert('제보 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(date);
  };

  const getConfidenceBadge = (score) => {
    if (score >= 80) return <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">신뢰도 높음 ({score}%)</span>;
    if (score >= 50) return <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">신뢰도 보통 ({score}%)</span>;
    return <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">확인 필요 ({score}%)</span>;
  };

  if (authLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      <main className="max-w-5xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-extrabold">실시간 우리학교 현황</h1>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <p className="text-lg opacity-90 max-w-2xl">
              제보된 내용을 AI가 실시간으로 분석하여 팩트와 상황을 상세하게 정리해드립니다.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('REALTIME')}
              className={`pb-3 font-bold transition-all ${activeTab === 'REALTIME' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              실시간 현황
            </button>
            <button 
              onClick={() => setActiveTab('FORECAST')}
              className={`pb-3 font-bold transition-all ${activeTab === 'FORECAST' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              요일별 예측 (Beta)
            </button>
          </div>
        </div>

        {activeTab === 'REALTIME' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl"></span> {user?.university || '우리 학교'} 실시간 상황 분석
                </h2>
                {lastUpdated && <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">{formatTime(lastUpdated)} 갱신됨</span>}
              </div>

              {summaryData && summaryData.length > 0 ? (
                <div className="space-y-4">
                  {summaryData.map((item, index) => {
                    const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.ETC;
                    return (
                      <div key={index} className={`bg-white rounded-2xl p-6 shadow-sm border ${style.border} hover:shadow-md transition-shadow animate-fadeIn`} style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full ${style.bg} text-lg`}>{style.icon}</span>
                            <span className={`text-sm font-bold ${style.color}`}>{CATEGORIES.find(c => c.id === item.category)?.label || item.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium">{item.reportCount}건의 제보 분석</span>
                            {getConfidenceBadge(item.confidence)}
                          </div>
                        </div>
                        <p className="text-gray-800 text-lg font-medium leading-relaxed pl-10">
                          {item.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 p-12 text-center shadow-sm">
                  <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
                    <i className="fas fa-check-circle text-gray-300 text-3xl"></i>
                  </div>
                  <p className="text-gray-500 font-medium text-lg">현재 특이사항이 없습니다.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span></span> 제보하기
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          selectedCategory === cat.id
                            ? 'bg-black text-white shadow-md transform scale-105'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="상황을 구체적으로 알려주세요.&#13;&#10;(예: 셔틀 줄이 본관 앞까지 서있어요, 학식 돈까스 매진됨)"
                      className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-black resize-none h-40 placeholder-gray-400"
                      maxLength={200}
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-medium">
                      {content.length}/200
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className={`w-full py-3.5 rounded-full font-bold text-sm shadow-lg transition-all transform active:scale-95 ${
                      isSubmitting || !content.trim()
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        전송 중...
                      </span>
                    ) : '제보하기'}
                  </button>
                </form>
                <p className="mt-4 text-[10px] text-gray-400 text-center leading-relaxed">
                  ※ 허위 제보 시 서비스 이용이 제한될 수 있습니다.<br/>
                  여러분의 제보가 학우들에게 큰 도움이 됩니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                    selectedDay === day.id ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {day.label}요일
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl"></span> {selectedDay === 'MON' ? '월요일' : selectedDay === 'TUE' ? '화요일' : selectedDay === 'WED' ? '수요일' : selectedDay === 'THU' ? '목요일' : '금요일'} 예상 시나리오
              </h3>
              
              {predictionData ? (
                <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-gray-100">
                  {predictionData.map((item, idx) => (
                    item.congestion > 0 && (
                      <div key={idx} className="relative pl-10 flex items-start group animate-fadeIn" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white ${item.congestion > 50 ? 'bg-red-500' : 'bg-green-500'} shadow-sm mt-1`}></div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-gray-400 block mb-1">{item.time}</span>
                          <div className={`p-4 rounded-xl ${item.congestion > 50 ? 'bg-red-50' : 'bg-gray-50'} border border-transparent hover:border-gray-200 transition-colors`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.congestion > 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                혼잡도 {item.congestion}%
                              </span>
                            </div>
                            <p className="text-gray-800 font-medium">{item.summary}</p>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                  {predictionData.every(d => d.congestion === 0) && (
                    <div className="text-center py-10 text-gray-400">데이터가 부족하거나 하루 종일 원활합니다.</div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center text-gray-400 animate-pulse">데이터 분석 중...</div>
              )}
            </div>
          </div>
        )}
      </main>

      {showSuccessModal && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-fadeIn text-sm font-bold flex items-center gap-2">
          <i className="fas fa-check-circle text-green-400"></i>
          제보가 접수되었습니다!
        </div>
      )}
    </div>
  );
}