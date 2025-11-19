import { Suspense } from 'react';
import CommunityPageClient from './CommunityPageClient';

function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">게시판을 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CommunityPageClient />
    </Suspense>
  );
}