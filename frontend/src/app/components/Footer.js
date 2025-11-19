"use client";

import Link from 'next/link';

export default function Footer() {
  const companyInfo = {
    name: "캠퍼스잇 주식회사",
    address: "OO시 OO구 OO로 OOO, O층",
    registrationNumber: "XXX-XX-XXXXX",
    reportNumber: "XXXXXXXXXXXXXX",
  };

  const links = [
    { name: "이용약관", path: "/terms" },
    { name: "개인정보처리방침", path: "/privacy" },
    { name: "커뮤니티이용규칙", path: "/community-rules" },
    { name: "공지사항", path: "/community?category=notice" },
    { name: "문의하기", path: "/contact" },
  ];

  return (
    <footer className="w-full bg-gray-100 text-gray-600 text-xs border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col gap-y-6 md:gap-y-4">
          <div>
            <h3 className="font-bold text-sm text-gray-800 mb-2">
              {companyInfo.name}
            </h3>
            <div className="flex flex-col gap-y-1 md:flex-row md:items-center md:flex-wrap text-gray-500 leading-relaxed">
              <span>{companyInfo.address}</span>
              
              <span className="hidden md:inline mx-2 text-gray-300">|</span>
              
              <span>사업자등록번호: {companyInfo.registrationNumber}</span>
              
              <span className="hidden md:inline mx-2 text-gray-300">|</span>
              
              <span>직업정보제공사업 신고번호: {companyInfo.reportNumber}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-y-4 pt-4 md:pt-0 md:border-t-0 border-t border-gray-200 md:border-none">
            
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {links.map((link, index) => (
                <Link 
                  key={index} 
                  href={link.path} 
                  className="hover:text-gray-900 font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <div className="text-gray-400 mt-2 md:mt-0">
               <span>© 캠퍼스잇. All Rights Reserved.</span>
            </div>
            
          </div>
        </div>
      </div>
    </footer>
  );
}