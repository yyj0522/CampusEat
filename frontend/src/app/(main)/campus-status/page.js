"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import apiClient from '@/lib/api';
import { useAuth } from "../../context/AuthProvider";

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-gray-100 rounded-2xl h-32 w-full"></div>
    ))}
  </div>
);

const RealtimeView = dynamic(() => import('@/app/components/campus/RealtimeView'), {
  loading: () => <SkeletonLoader />
});

const ForecastView = dynamic(() => import('@/app/components/campus/ForecastView'), {
  loading: () => <SkeletonLoader />,
  ssr: false 
});

export default function CampusStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('REALTIME');
  
  const [summaryData, setSummaryData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDay, setSelectedDay] = useState('MON');
  const [predictionData, setPredictionData] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

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
      setPredictionLoading(true);
      setPredictionData(null);
      const response = await apiClient.get(`/campus/status/prediction?day=${selectedDay}`);
      if (response.data && response.data.status === 'success') {
        setPredictionData(response.data.timeline);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPredictionLoading(false);
    }
  }, [selectedDay]);

  const handleReportSubmit = async (content, category, onSuccess) => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/campus/status', { content, category });
      setShowSuccessModal(true);
      if (onSuccess) onSuccess();
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (error) {
      console.error(error);
      alert('제보 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!user || activeTab !== 'REALTIME') return;
    fetchSummary();
    const intervalId = setInterval(fetchSummary, 60000);
    return () => clearInterval(intervalId);
  }, [fetchSummary, user, activeTab]);

  useEffect(() => {
    if (user && activeTab === 'FORECAST') {
      fetchPrediction();
    }
  }, [fetchPrediction, user, activeTab]);

  // [수정] 불필요한 외부 레이아웃 div 제거 (layout.js가 처리함)
  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      {/* 탭 네비게이션 */}
      <div className="mb-6 border-b border-gray-200" role="tablist">
        <div className="flex space-x-6">
          <button 
            role="tab"
            aria-selected={activeTab === 'REALTIME'}
            onClick={() => setActiveTab('REALTIME')}
            className={`pb-3 font-bold transition-all flex items-center gap-2 text-base ${activeTab === 'REALTIME' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            실시간 현황
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'FORECAST'}
            onClick={() => setActiveTab('FORECAST')}
            className={`pb-3 font-bold transition-all flex items-center gap-2 text-base ${activeTab === 'FORECAST' ? 'text-indigo-700 border-b-2 border-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AI 혼잡도 예측 (Beta)
          </button>
        </div>
      </div>

      {/* 로딩 및 데이터 뷰 */}
      {authLoading || !user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><SkeletonLoader /></div>
          <div className="lg:col-span-1 h-64 bg-gray-50 rounded-[2rem] animate-pulse"></div>
        </div>
      ) : (
        <>
          {activeTab === 'REALTIME' ? (
            <RealtimeView 
              user={user}
              summaryData={summaryData}
              lastUpdated={lastUpdated}
              onReportSubmit={handleReportSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            <ForecastView 
              predictionData={predictionData}
              predictionLoading={predictionLoading}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
            />
          )}
        </>
      )}

      {showSuccessModal && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-fadeIn text-sm font-bold flex items-center gap-2" role="alert">
          제보가 접수되었습니다!
        </div>
      )}
    </>
  );
}