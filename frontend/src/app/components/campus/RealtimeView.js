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
    if (score >= 80) return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">신뢰도 높음 · {score}%</span>;
    if (score >= 50) return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70">신뢰도 보통 · {score}%</span>;
    return <span className="text-[11px] font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200/70">확인 필요 · {score}%</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col gap-3 rounded-3xl border border-gray-200/70 bg-white/80 p-5 shadow-sm ring-1 ring-black/[0.03] backdrop-blur md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Campus status
            </p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              {user?.university || '우리 학교'} 실시간 상황 분석
            </h2>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200/70 w-fit">
              {formatTime(lastUpdated)} 갱신
            </span>
          )}
        </div>

        {summaryData && summaryData.length > 0 ? (
          <div className="space-y-4">
            {summaryData.map((item, index) => {
              const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.ETC;
              return (
                <div
                  key={index}
                  className="group overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md animate-fadeIn"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${style.bg} text-lg shadow-inner`}
                        aria-hidden="true"
                      >
                        {style.icon}
                      </span>
                      <div>
                        <p className={`text-sm font-extrabold ${style.color}`}>
                          {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold">
                          {item.reportCount}건 제보 기반
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 md:justify-end">
                      {getConfidenceBadge(item.confidence)}
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-gray-50/70 border border-gray-100 p-4">
                    <p className="text-gray-900 text-[15px] md:text-base font-semibold leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-12 text-center shadow-sm ring-1 ring-black/[0.03]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="text-xl" aria-hidden="true">✓</span>
            </div>
            <p className="text-gray-900 font-extrabold text-lg tracking-tight">현재 특이사항이 없습니다</p>
            <p className="mt-2 text-sm text-gray-500 font-medium">새로운 제보가 들어오면 자동으로 반영됩니다.</p>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-[2rem] border border-gray-200/70 bg-white/85 p-6 shadow-sm ring-1 ring-black/[0.03] backdrop-blur">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
              제보하기
            </h3>
            <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-200/70 px-2.5 py-1 rounded-full">
              200자
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="제보 카테고리 선택">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                    selectedCategory === cat.id ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70'
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
                className="w-full bg-gray-50/80 border border-gray-200/70 rounded-2xl px-4 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-40 placeholder-gray-400 text-gray-900"
                maxLength={200}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-gray-500 font-medium bg-white/80 px-2 py-0.5 rounded-full border border-gray-200/70">
                {content.length}/200
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-all transform active:scale-[0.99] flex justify-center items-center ${
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