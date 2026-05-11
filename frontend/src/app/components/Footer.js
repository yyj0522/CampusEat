"use client";

import Link from 'next/link';
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Footer() {
  const companyInfo = {
    email: "projectc029@gmail.com",
  };

  const footerSections = [
    {
      title: "서비스",
      links: [
        { name: "맛집 추천", path: "/restaurant" },
        { name: "번개모임", path: "/meeting" },
        { name: "자유게시판", path: "/community" },
        { name: "시간표", path: "/time" },
        { name: "교재거래", path: "/book" },
      ]
    },
    {
      title: "고객지원",
      links: [
        { name: "공지사항", path: "/community?category=notice" },
        { name: "자주 묻는 질문", path: "/contact" },
        { name: "문의하기", path: "/contact" },
      ]
    },
    {
      title: "약관 및 정책",
      links: [
        { name: "이용약관", path: "/terms" },
        { name: "개인정보처리방침", path: "/privacy", bold: true },
        { name: "커뮤니티 이용규칙", path: "/community-rules" },
      ]
    }
  ];

  return (
    <footer className="bg-white border-t border-gray-100 py-10 text-gray-600 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
                  Campuseat
                </span>
              </h2>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                대학생을 위한 올인원 라이프 스타일 플랫폼.<br />
                점심추천부터 시간표, 중고거래까지 캠퍼스잇과 함께하세요.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
            {footerSections.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-sm font-bold text-gray-900 mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link 
                        href={link.path} 
                        className={`text-sm hover:text-indigo-600 transition-colors ${link.bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <div className="flex flex-col gap-2 text-xs text-gray-400 md:flex-row md:items-center md:justify-between">
            <a href={`mailto:${companyInfo.email}`} className="hover:text-gray-600">
              이메일: {companyInfo.email}
            </a>
            <p>
              &copy; 2026 Campuseat Corp. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}