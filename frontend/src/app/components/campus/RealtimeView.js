// frontend/src/components/campus/RealtimeView.js
"use client";

import { useState } from 'react';

const CATEGORIES = [
  { id: 'TRAFFIC', label: '교통/셔틀' },
  { id: 'CAFETERIA', label: '학식/식당' },
  { id: 'EVENT', label: '행사/축제' },
  { id: 'WEATHER', label: '날씨/시설' },
  { id: 'ETC', label: '기타' },
];

const CATEGORY_STYLES = {
  TRAFFIC: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', icon: '🚌' },
  CAFETERIA: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', icon: '🍱' },
  EVENT: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100', icon: '🎉' },
  WEATHER: { color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-100', icon: '☔' },
  ETC: { color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-100', icon: '📢' },
};

export default function RealtimeView({ 
  user, 
  summaryData, 
  lastUpdated, 
  onReportSubmit, 
  isSubmitting 
}) {
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TRAFFIC');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onReportSubmit(content, selectedCategory, () => setContent(''));
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul', hour: 'numeric', minute: 'numeric', hour12: false,
    }).format(date);
  };

  const getConfidenceBadge = (score) => {
    if (score >= 80) return <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">신뢰도 높음 ({score}%)</span>;
    if (score >= 50) return <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200">신뢰도 보통 ({score}%)</span>;
    return <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">확인 필요 ({score}%)</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true"></span> {user?.university || '우리 학교'} 실시간 상황 분석
          </h2>
          {lastUpdated && <span className="text-xs text-gray-600 font-semibold bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{formatTime(lastUpdated)} 갱신됨</span>}
        </div>

        {summaryData && summaryData.length > 0 ? (
          <div className="space-y-4">
            {summaryData.map((item, index) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.ETC;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow animate-fadeIn" style={{ animationDelay: `${index * 100}ms`, borderColor: style.border }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full ${style.bg} text-lg`} aria-hidden="true">{style.icon}</span>
                      <span className={`text-sm font-bold ${style.color}`}>{CATEGORIES.find(c => c.id === item.category)?.label || item.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-semibold">{item.reportCount}건의 제보 분석</span>
                      {getConfidenceBadge(item.confidence)}
                    </div>
                  </div>
                  <p className="text-gray-800 text-lg font-medium leading-relaxed pl-10">{item.summary}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-gray-200 p-12 text-center shadow-sm">
            <div className="inline-block p-4 rounded-full bg-gray-50 mb-4">
              <span className="text-gray-300 text-3xl">✅</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">현재 특이사항이 없습니다.</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-200 p-6 sticky top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span aria-hidden="true"></span> 제보하기
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="제보 카테고리 선택">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-md transform scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <label htmlFor="reportContent" className="sr-only">제보 내용</label>
              <textarea
                id="reportContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="상황을 구체적으로 알려주세요."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-40 placeholder-gray-400 text-gray-900"
                maxLength={200}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 font-medium bg-white/80 px-1 rounded">{content.length}/200</div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`w-full py-3.5 rounded-full font-bold text-sm shadow-lg transition-all transform active:scale-95 flex justify-center items-center ${
                isSubmitting || !content.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              {isSubmitting ? '전송 중...' : '제보하기'}
            </button>
          </form>
          <p className="mt-4 text-[11px] text-gray-500 text-center leading-relaxed font-medium">
            ※ 허위 제보 시 서비스 이용이 제한될 수 있습니다.<br/>여러분의 제보가 학우들에게 큰 도움이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}