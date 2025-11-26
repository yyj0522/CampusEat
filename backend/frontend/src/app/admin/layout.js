"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthProvider';
import '@fortawesome/fontawesome-free/css/all.min.css';

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

  const menuItems = [
    { name: '사용자 관리', href: '/admin/user', icon: 'fa-users' },
    { name: '신고 관리', href: '/admin/report', icon: 'fa-flag' },
    { name: '문의 관리', href: '/admin/inquiry', icon: 'fa-headset' },
    { name: '시간표 데이터', href: '/admin/timetable', icon: 'fa-calendar-alt' },
    { name: '공지사항', href: '/admin/notice', icon: 'fa-bullhorn' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                <span className="text-blue-600">관리자</span> 페이지
            </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                            isActive 
                            ? 'bg-blue-50 text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        <i className={`fas ${item.icon} w-6 text-center mr-3 ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`}></i>
                        {item.name}
                    </Link>
                );
            })}
        </nav>
        <div className="p-4 border-t border-gray-100">
             <Link
                href="/home" 
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
                <i className="fas fa-sign-out-alt mr-2"></i> 서비스로 돌아가기
            </Link>
        </div>
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 px-4 py-3 flex justify-between items-center">
         <h1 className="text-lg font-extrabold text-gray-900"><span className="text-blue-600">관리자</span> 페이지</h1>
         <Link href="/home" className="text-gray-500"><i className="fas fa-home"></i></Link>
      </div>
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-16 md:pt-8 max-w-screen-2xl mx-auto w-full">
         <div className="md:hidden mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex space-x-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
                            pathname === item.href
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600'
                        }`}
                    >
                        {item.name}
                    </Link>
                ))}
            </div>
         </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[calc(100vh-4rem)]">
            {children}
        </div>
      </main>
    </div>
  );
}