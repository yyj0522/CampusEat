// frontend/src/components/campus/ForecastView.js
"use client";

const DAYS = [
  { id: 'MON', label: '월' },
  { id: 'TUE', label: '화' },
  { id: 'WED', label: '수' },
  { id: 'THU', label: '목' },
  { id: 'FRI', label: '금' },
];

const DAY_LABEL = {
  MON: '월요일',
  TUE: '화요일',
  WED: '수요일',
  THU: '목요일',
  FRI: '금요일',
};

export default function ForecastView({ 
  predictionData, 
  predictionLoading, 
  selectedDay, 
  setSelectedDay 
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-gray-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-black/[0.03] backdrop-blur md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto" role="group" aria-label="요일 선택">
          {DAYS.map((day) => (
            <button
              key={day.id}
              aria-pressed={selectedDay === day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-4 py-2 rounded-2xl font-extrabold text-sm whitespace-nowrap transition-all border ${
                selectedDay === day.id ? 'bg-gray-900 text-white shadow-sm border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200/80'
              }`}
            >
              {day.label}요일
            </button>
          ))}
          </div>

          <div className="text-xs text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200/70 flex items-center gap-2 w-full md:w-auto">
            <span className="text-indigo-600" aria-hidden="true">🤖</span>
            과거 데이터를 학습한 모델 기반 예측입니다.
          </div>
        </div>
      </div>

      <div className="bg-white/90 rounded-3xl border border-gray-200/70 p-6 md:p-8 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
              Forecast
            </p>
            <h3 className="mt-1 text-xl md:text-2xl font-extrabold tracking-tight text-gray-900">
              {DAY_LABEL[selectedDay]} 시간대별 혼잡도
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            혼잡도는 0–100 범위로 표기됩니다.
          </p>
        </div>
        
        {predictionLoading ? (
           <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">AI가 데이터를 분석하고 있습니다...</p>
           </div>
        ) : predictionData && predictionData.length > 0 ? (
          <div className="relative">
            <div className="absolute left-20 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="space-y-5">
              {predictionData.map((item, idx) => {
                 const getCongestionColor = (val) => {
                    if (val >= 70) return 'bg-red-500';
                    if (val >= 40) return 'bg-orange-500';
                    if (val >= 20) return 'bg-yellow-500';
                    return 'bg-green-500';
                 };
                 const barWidth = Math.max(10, item.congestion);

                 return (
                  <div key={idx} className="relative pl-28 group animate-fadeIn" style={{ animationDelay: `${idx * 24}ms` }}>
                    <span className="absolute left-0 top-1 text-sm font-bold text-gray-500 w-16 text-right">{item.time}</span>
                    <div className={`absolute left-[74px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${getCongestionColor(item.congestion)}`}></div>
                    <div className="bg-gray-50/80 rounded-2xl p-4 hover:bg-white hover:shadow-md border border-gray-100 hover:border-gray-200/70 transition-all cursor-default">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="h-2 rounded-full bg-gray-200 w-32 md:w-64 overflow-hidden" aria-hidden="true">
                             <div className={`h-full rounded-full transition-all duration-1000 ${getCongestionColor(item.congestion)}`} style={{ width: `${barWidth}%` }}></div>
                          </div>
                          <span className={`text-xs font-extrabold ${item.congestion >= 70 ? 'text-red-600' : 'text-gray-700'}`}>
                             혼잡도 {item.congestion}%
                          </span>
                       </div>
                       <div className="flex items-start gap-2">
                          <p className="text-gray-900 font-medium text-sm leading-relaxed">{item.summary}</p>
                       </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-200/70">
              <span className="text-gray-400 text-xl" aria-hidden="true">📊</span>
            </div>
            <p className="text-gray-900 font-extrabold">표시할 예측 데이터가 없습니다</p>
            <p className="mt-2 text-sm text-gray-500 font-medium">데이터가 부족하거나, 해당 요일은 원활할 수 있어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}