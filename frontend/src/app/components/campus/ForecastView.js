// frontend/src/components/campus/ForecastView.js
"use client";

const DAYS = [
  { id: 'MON', label: '월' },
  { id: 'TUE', label: '화' },
  { id: 'WED', label: '수' },
  { id: 'THU', label: '목' },
  { id: 'FRI', label: '금' },
];

export default function ForecastView({ 
  predictionData, 
  predictionLoading, 
  selectedDay, 
  setSelectedDay 
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-100">
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto" role="group" aria-label="요일 선택">
          {DAYS.map((day) => (
            <button
              key={day.id}
              aria-pressed={selectedDay === day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                selectedDay === day.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {day.label}요일
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2 shadow-sm">
          <span className="text-indigo-500">🤖</span>
          Prophet AI 모델이 과거 데이터를 학습하여 예측한 결과입니다.
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-900">
          {selectedDay === 'MON' ? '월요일' : selectedDay === 'TUE' ? '화요일' : selectedDay === 'WED' ? '수요일' : selectedDay === 'THU' ? '목요일' : '금요일'} 시간대별 혼잡도 예측
        </h3>
        
        {predictionLoading ? (
           <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">AI가 데이터를 분석하고 있습니다...</p>
           </div>
        ) : predictionData && predictionData.length > 0 ? (
          <div className="relative">
            <div className="absolute left-20 top-0 bottom-0 w-0.5 bg-gray-100"></div>
            <div className="space-y-6">
              {predictionData.map((item, idx) => {
                 const getCongestionColor = (val) => {
                    if (val >= 70) return 'bg-red-500';
                    if (val >= 40) return 'bg-orange-500';
                    if (val >= 20) return 'bg-yellow-500';
                    return 'bg-green-500';
                 };
                 const barWidth = Math.max(10, item.congestion);

                 return (
                  <div key={idx} className="relative pl-28 group animate-fadeIn" style={{ animationDelay: `${idx * 30}ms` }}>
                    <span className="absolute left-0 top-1 text-sm font-bold text-gray-500 w-16 text-right">{item.time}</span>
                    <div className={`absolute left-[74px] top-2 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${getCongestionColor(item.congestion)}`}></div>
                    <div className="bg-gray-50 rounded-xl p-4 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 transition-all cursor-default">
                       <div className="flex items-center gap-3 mb-2">
                          <div className="h-2 rounded-full bg-gray-200 w-32 md:w-64 overflow-hidden" aria-hidden="true">
                             <div className={`h-full rounded-full transition-all duration-1000 ${getCongestionColor(item.congestion)}`} style={{ width: `${barWidth}%` }}></div>
                          </div>
                          <span className={`text-xs font-bold ${item.congestion >= 70 ? 'text-red-600' : 'text-gray-600'}`}>
                             혼잡도 {item.congestion}%
                          </span>
                       </div>
                       <div className="flex items-start gap-2">
                          <p className="text-gray-800 font-medium text-sm leading-relaxed">{item.summary}</p>
                       </div>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-50 mb-3">
              <span className="text-gray-300 text-3xl">📊</span>
            </div>
            <p className="text-gray-500 font-medium">예측할 데이터가 충분하지 않거나, 해당 요일은 원활합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}