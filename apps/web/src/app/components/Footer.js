"use client";

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
        { name: "청소년보호정책", path: "/youth-policy" },
        { name: "커뮤니티이용규칙", path: "/community-rules" },
        { name: "공지사항", path: "/notice" },
        { name: "문의하기", path: "/contact" },
    ];

    return (
        <footer className="w-full bg-gray-100 text-gray-500 text-xs">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-700 mb-1">{companyInfo.name}</h3>
                    <p>{companyInfo.address} | 사업자등록번호: {companyInfo.registrationNumber} | 직업정보제공사업 신고번호: {companyInfo.reportNumber}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {links.map((link, index) => (
                        <a key={index} href={link.path} className="hover:text-gray-800">
                            {link.name}
                        </a>
                    ))}
                    <span>|</span>
                    <span>© 캠퍼스잇</span>
                </div>
            </div>
        </footer>
    );
}