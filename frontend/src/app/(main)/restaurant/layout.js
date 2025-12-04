export const metadata = {
  title: '맛집 추천 | 캠퍼스잇',
  description: '학교 주변의 숨겨진 맛집을 찾아보세요. 학우들의 솔직한 리뷰와 평점을 확인할 수 있습니다.',
};

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-12 p-8 rounded-3xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-extrabold tracking-tight">맛집 추천</h1>
            </div>
            <p className="text-lg opacity-95 max-w-2xl font-medium">
              학우들의 생생한 리뷰를 확인하고 학교 주변 맛집을 찾아보세요!
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        </div>
        {children}
      </main>
    </div>
  );
}