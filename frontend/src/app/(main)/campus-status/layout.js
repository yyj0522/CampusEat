export const metadata = {
  title: '실시간 캠퍼스 현황 | 캠퍼스잇',
  description: '우리 학교의 실시간 교통, 학식, 행사 정보를 확인하고 제보하세요. AI가 혼잡도를 예측해 드립니다.',
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <main className="max-w-5xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">실시간 우리학교 현황</h1>
              <span className="relative flex h-3 w-3" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <p className="text-lg opacity-95 max-w-2xl font-medium">
              제보된 내용을 AI가 실시간으로 분석하여 팩트와 상황을 상세하게 정리해드립니다.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        </div>
        {children}
      </main>
    </div>
  );
}