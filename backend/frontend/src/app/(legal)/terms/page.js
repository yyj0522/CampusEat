"use client";

import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function TermsPage() {
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
                {/* Header */}
                <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-scale-balanced text-3xl text-white"></i>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">이용약관</h1>
                        <p className="text-lg text-gray-300 font-medium">
                            캠퍼스잇 서비스 이용에 관한 규정을 안내합니다.
                        </p>
                    </div>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-black/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10 space-y-12">
                        
                        {/* 1. 목적 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xl">
                                    <i className="fas fa-flag"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">제1조 (목적)</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 leading-relaxed text-sm md:text-base">
                                <p>
                                    이 약관은 캠퍼스잇 주식회사(이하 "회사")가 제공하는 캠퍼스잇 및 관련 제반 서비스(이하 "서비스")의 
                                    이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                                </p>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 2. 정의 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xl">
                                    <i className="fas fa-book"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">제2조 (정의)</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 text-sm md:text-base">
                                <ul className="space-y-3">
                                    {[
                                        { term: "서비스", desc: "구현되는 단말기(PC, 모바일 등)와 상관없이 회원이 이용할 수 있는 캠퍼스잇 관련 제반 서비스" },
                                        { term: "회원", desc: "서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 서비스를 이용하는 고객" },
                                        { term: "아이디(ID)", desc: "회원의 식별과 서비스 이용을 위하여 회원이 정하고 회사가 승인하는 이메일 주소" },
                                        { term: "비밀번호", desc: "회원이 부여 받은 아이디와 일치되는 회원임을 확인하고 비밀보호를 위해 정한 문자 또는 숫자의 조합" },
                                        { term: "게시물", desc: "회원이 서비스를 이용함에 있어 서비스상에 게시한 글, 사진, 동영상 및 각종 파일과 링크 등" }
                                    ].map((item, idx) => (
                                        <li key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <span className="font-bold text-gray-800 mr-1">"{item.term}"</span>
                                            <span>{item.desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 3. 약관 게시 및 개정 */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xl">
                                    <i className="fas fa-bullhorn"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">제3조 (약관의 게시와 개정)</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 text-sm md:text-base space-y-2">
                                <p>1. "회사"는 이 약관의 내용을 "회원"이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                                <p>2. "회사"는 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
                                <p>3. "회사"가 약관을 개정할 경우 적용일자 및 개정사유를 명시하여 현행약관과 함께 공지합니다.</p>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                         {/* 4. 이용계약 체결 */}
                         <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center text-xl">
                                    <i className="fas fa-file-signature"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">제4조 (이용계약 체결)</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 text-sm md:text-base space-y-2">
                                <p>1. 이용계약은 "가입신청자"가 약관 내용에 동의 후 가입신청을 하고 "회사"가 승낙함으로써 체결됩니다.</p>
                                <p>2. "회사"는 다음 각 호에 해당하는 신청에 대하여 승낙을 하지 않거나 사후에 해지할 수 있습니다.</p>
                                <ul className="list-disc list-inside pl-4 text-gray-500 text-sm bg-gray-50 p-3 rounded-lg mt-2">
                                    <li>이전에 회원자격을 상실한 적이 있는 경우</li>
                                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        {/* 5. 의무 (회사/회원) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-3">제5조 (회사의 의무)</h2>
                                <div className="text-gray-600 text-sm bg-blue-50 p-4 rounded-xl h-full">
                                    <ul className="space-y-2">
                                        <li className="flex gap-2">
                                            <i className="fas fa-check text-blue-500 mt-1"></i>
                                            <span>관련법과 약관을 준수하며, 안정적인 서비스를 제공하기 위해 노력합니다.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <i className="fas fa-check text-blue-500 mt-1"></i>
                                            <span>개인정보 보호를 위해 보안시스템을 갖추고 개인정보처리방침을 준수합니다.</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-3">제6조 (회원의 의무)</h2>
                                <div className="text-gray-600 text-sm bg-red-50 p-4 rounded-xl h-full">
                                    <ul className="space-y-2">
                                        <li className="flex gap-2">
                                            <i className="fas fa-times text-red-500 mt-1"></i>
                                            <span>허위 정보 등록, 타인 정보 도용 금지</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <i className="fas fa-times text-red-500 mt-1"></i>
                                            <span>저작권 침해, 업무 방해, 외설/폭력적 메시지 게시 금지</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        <hr className="border-gray-100" />

                        {/* 7 ~ 11. 나머지 조항들 */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-4">기타 조항</h2>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">제7조 (서비스의 제공 및 변경)</h3>
                                    <p className="text-gray-600 text-sm">커뮤니티 서비스 등을 제공하며, 운영상 필요한 경우 서비스를 변경하거나 중단할 수 있습니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">제8조 (게시물의 저작권 및 관리)</h3>
                                    <p className="text-gray-600 text-sm">게시물의 저작권은 작성자에게 있으며, 회사는 서비스 내 노출을 위해 일부 수정/편집할 수 있습니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">제9조 (계약해제, 해지 등)</h3>
                                    <p className="text-gray-600 text-sm">회원은 언제든지 탈퇴할 수 있으며, 해지 시 관련법에 따라 보유하는 경우를 제외하고 데이터는 소멸됩니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">제10조 (책임제한)</h3>
                                    <p className="text-gray-600 text-sm">천재지변 등 불가항력이나 회원의 귀책사유로 인한 서비스 장애 등에 대해서는 책임을 지지 않습니다.</p>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-700 mb-2">제11조 (준거법 및 재판관할)</h3>
                                    <p className="text-gray-600 text-sm">분쟁 발생 시 대한민국법을 준거법으로 하며, 민사소송법 상의 관할법원에 제소합니다.</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Footer Note */}
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