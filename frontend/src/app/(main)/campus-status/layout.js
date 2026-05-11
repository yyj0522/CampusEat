export const metadata = {
  title: '실시간 캠퍼스 현황 | 캠퍼스잇',
  description: '우리 학교의 실시간 교통, 학식, 행사 정보를 확인하고 제보하세요. AI가 혼잡도를 예측해 드립니다.',
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50/90 text-gray-900 font-sans relative">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_110%_70%_at_50%_-10%,rgba(99,102,241,0.18),transparent_58%)] pointer-events-none" />
      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 md:py-12 relative">
        <div className="mb-8 overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 shadow-sm ring-1 ring-black/[0.03] backdrop-blur">
          <div className="relative px-7 py-7 md:px-10 md:py-9">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  실시간 우리학교 현황
                </h1>
                <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-30" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
                  </span>
                  Live
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm md:text-base leading-relaxed text-gray-600 font-medium">
                학우들의 제보를 바탕으로 실시간 상황을 정리하고, 혼잡도를 예측해 보여드립니다.
              </p>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}