"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthProvider';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'sub_admin' && user.role !== 'super_admin') {
        alert('관리자만 접근할 수 있습니다.');
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'sub_admin' && user.role !== 'super_admin')) {
    return null; 
  }

  const tabs = [
    { name: '사용자 관리', href: '/admin/user' },
    { name: '신고 관리', href: '/admin/report' },
    { name: '문의 관리', href: '/admin/inquiry' },
    { name: '시간표 관리', href: '/admin/timetable' },
    { name: '공지사항 관리', href: '/admin/notice' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">관리자 패널</h1>
          <Link
            href="/home" 
            className="px-4 py-2 bg-white text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <i className="fas fa-home mr-2"></i>
            메인 홈으로
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 sm:space-x-4 p-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    py-2 px-3 sm:px-4 rounded-md font-medium text-sm sm:text-base shrink-0
                    ${
                      pathname === tab.href
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50' 
                    }
                  `}
                >
                  {tab.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}