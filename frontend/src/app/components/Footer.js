"use client";

import Link from 'next/link';
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Footer() {
  const companyInfo = {
    name: "캠퍼스잇 주식회사",
    ceo: "유영재",
    address: "OO시 OO구 OO로 OOO, O층 (OO동, OO빌딩)",
    registrationNumber: "XXX-XX-XXXXX",
    reportNumber: "2025-서울강남-XXXX",
    email: "projectc029@gmail.com",
    phone: "02-0000-0000",
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

  const socialLinks = [
    { icon: "instagram", href: "https://www.instagram.com" },
    { icon: "facebook-f", href: "https://www.facebook.com" },
    { icon: "youtube", href: "https://www.youtube.com" },
    { icon: "twitter", href: "https://twitter.com" },
  ];

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 text-gray-600 font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4 space-y-6">
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
            <div className="flex gap-4">
              {socialLinks.map((social, idx) => (
                <Link 
                  key={idx} 
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-indigo-500 transition-all duration-300"
                >
                  <i className={`fab fa-${social.icon} text-lg`}></i>
                </Link>
              ))}
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

        <div className="border-t border-gray-100 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-xs text-gray-400 space-y-1.5">
            </div>
            <div className="text-xs text-gray-400 md:text-right space-y-1.5">
              <div className="flex md:justify-end gap-4">
                <a href={`mailto:${companyInfo.email}`} className="hover:text-gray-600">이메일: {companyInfo.email}</a>
                <span className="hidden md:inline">|</span>
                <a href={`tel:${companyInfo.phone}`} className="hover:text-gray-600">고객센터: {companyInfo.phone}</a>
              </div>
              <p>운영시간: 평일 10:00 ~ 18:00 (주말/공휴일 휴무)</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Campuseat Corp. All rights reserved.
            </p>
            <p className="text-[10px] text-gray-300 mt-2 md:mt-0">
              캠퍼스잇은 통신판매중개자이며 통신판매의 당사자가 아닙니다. 상품 거래 정보 및 거래에 대한 책임은 판매자에게 있습니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}