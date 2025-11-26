"use client";

import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>

            <main className="max-w-4xl mx-auto px-4 py-10 animate-fadeIn">
                <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-shield-halved text-3xl text-white"></i>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">개인정보처리방침</h1>
                        <p className="text-lg text-emerald-100 font-medium">
                            회원님의 소중한 개인정보, 안전하게 보호하겠습니다.
                        </p>
                    </div>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-teal-500/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10 space-y-12">
                        
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
                                    <i className="fas fa-bullseye"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">1. 개인정보의 처리 목적</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 leading-relaxed text-sm md:text-base">
                                <p className="mb-4">
                                    회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                                    이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { title: "회원 관리", desc: "회원제 서비스 이용 본인확인, 가입 의사 확인, 불량회원 제재, 고지사항 전달" },
                                        { title: "서비스 제공", desc: "콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 연령인증" },
                                        { title: "마케팅 및 광고", desc: "신규 서비스 개발, 이벤트 정보 제공, 접속 빈도 파악, 서비스 이용 통계" }
                                    ].map((item, idx) => (
                                        <li key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <span className="font-bold text-gray-800 block mb-1">{item.title}</span>
                                            <span className="text-sm text-gray-500">{item.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                                    <i className="fas fa-list-check"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">2. 처리하는 개인정보의 항목</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 text-sm md:text-base">
                                <p className="mb-4">회사는 원활한 서비스 제공을 위해 최소한의 개인정보를 수집하고 있습니다.</p>
                                <div className="space-y-3">
                                    <div className="flex flex-col md:flex-row gap-2 md:items-center bg-blue-50/50 p-3 rounded-lg">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold w-fit">필수항목</span>
                                        <span className="text-gray-700 font-medium">이메일 주소, 비밀번호, 닉네임, 소속 대학 정보</span>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-50 p-3 rounded-lg">
                                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold w-fit">선택항목</span>
                                        <span className="text-gray-600">프로필 사진, 자기소개</span>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-50 p-3 rounded-lg">
                                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-bold w-fit">자동수집</span>
                                        <span className="text-gray-600">서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl">
                                    <i className="fas fa-clock"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">3. 개인정보의 보유 및 이용기간</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 text-sm md:text-base">
                                <p className="mb-4">
                                    원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 
                                    단, 관련 법령에 따라 일정 기간 보존이 필요한 경우 아래와 같이 보존합니다.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-100 text-gray-700 font-bold">
                                            <tr>
                                                <th className="p-3 rounded-tl-lg">보존 항목</th>
                                                <th className="p-3">근거 법령</th>
                                                <th className="p-3 rounded-tr-lg">기간</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <tr>
                                                <td className="p-3">계약/청약철회 기록</td>
                                                <td className="p-3 text-gray-500">전자상거래법</td>
                                                <td className="p-3 font-bold text-emerald-600">5년</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3">대금결제/재화공급 기록</td>
                                                <td className="p-3 text-gray-500">전자상거래법</td>
                                                <td className="p-3 font-bold text-emerald-600">5년</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3">소비자 불만/분쟁 처리</td>
                                                <td className="p-3 text-gray-500">전자상거래법</td>
                                                <td className="p-3 font-bold text-emerald-600">3년</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3">접속 로그 기록</td>
                                                <td className="p-3 text-gray-500">통신비밀보호법</td>
                                                <td className="p-3 font-bold text-emerald-600">3개월</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                        
                        <hr className="border-gray-100" />

                         <section>
                            <h2 className="text-lg font-bold text-gray-800 mb-3">4. 개인정보의 제3자 제공</h2>
                            <p className="text-gray-600 text-sm md:text-base bg-gray-50 p-4 rounded-xl">
                                회사는 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우를 제외하고는 
                                개인정보를 제3자에게 제공하지 않습니다.
                            </p>
                        </section>

                        <section>
                             <h2 className="text-lg font-bold text-gray-800 mb-3">5. 개인정보 처리의 위탁</h2>
                             <div className="text-gray-600 text-sm md:text-base space-y-2">
                                <p>원활한 서비스 처리를 위해 다음과 같이 업무를 위탁하고 있으며, 관계 법령에 따라 관리·감독하고 있습니다.</p>
                                <ul className="list-disc list-inside ml-2 text-gray-500 text-sm">
                                    <li><b>OO 클라우드:</b> 클라우드 서버 운영 및 관리</li>
                                    <li><b>XX PG:</b> 결제 처리 및 도용 방지</li>
                                </ul>
                             </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-3">6. 정보주체의 권리</h2>
                                <p className="text-gray-600 text-sm">
                                    이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다. 
                                    서면, 전자우편 등을 통해 요청하시면 지체 없이 조치하겠습니다.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 mb-3">7. 파기절차 및 방법</h2>
                                <p className="text-gray-600 text-sm">
                                    목적 달성 후 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제하며, 
                                    종이 문서는 분쇄하거나 소각하여 파기합니다.
                                </p>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-gray-800 text-white flex items-center justify-center text-xl">
                                    <i className="fas fa-user-shield"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">9. 개인정보 보호책임자</h2>
                            </div>
                            <div className="pl-3 md:pl-14">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <p className="font-bold text-gray-800 mb-1">유영재 (CPO)</p>
                                        <p className="text-sm text-gray-500">개인정보 보호책임자</p>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><i className="fas fa-phone mr-2 text-gray-400"></i> 02-1234-5678</p>
                                        <p><i className="fas fa-envelope mr-2 text-gray-400"></i> projectc029@gmail.com</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
                <div className="mt-8 text-center space-y-4">
                    <p className="text-sm text-gray-500">
                        <span className="mr-4"><b>공고일자:</b> 2025년 10월 10일</span>
                        <span><b>시행일자:</b> 2025년 10월 10일</span>
                    </p>
                    <button 
                        onClick={() => router.back()} 
                        className="text-gray-500 hover:text-gray-800 font-bold text-sm transition flex items-center justify-center gap-2 mx-auto"
                    >
                        <i className="fas fa-arrow-left"></i> 뒤로가기
                    </button>
                </div>
            </main>
        </div>
    );
}