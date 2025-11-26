"use client";

import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function CommunityRulesPage() {
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
                <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-scale-balanced text-3xl text-white"></i>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">커뮤니티 이용규칙</h1>
                        <p className="text-lg text-blue-100 font-medium">모두가 즐겁고 안전한 캠퍼스잇을 함께 만들어가요.</p>
                    </div>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 md:p-10 space-y-12">
                        
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                                    <i className="fas fa-handshake"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">1. 존중과 배려의 문화</h2>
                            </div>
                            <div className="pl-3 md:pl-14 text-gray-600 leading-relaxed text-sm md:text-base">
                                <p>
                                    캠퍼스잇은 모든 학우들을 위한 소중한 공간입니다. 나이, 성별, 학력, 출신 지역, 인종, 종교, 성적 지향 등에 관계없이 
                                    <span className="font-bold text-gray-800"> 서로를 존중하고 배려하는 문화</span>를 지향합니다. 
                                    건전한 비판은 가능하지만, 타인에 대한 인신공격, 비방, 욕설, 차별적인 발언은 엄격히 금지됩니다.
                                </p>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-xl">
                                    <i className="fas fa-ban"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">2. 금지되는 활동</h2>
                            </div>
                            <div className="pl-3 md:pl-14">
                                <p className="text-gray-600 mb-4 text-sm md:text-base">
                                    다음과 같은 활동은 커뮤니티의 신뢰를 저해하고 타인에게 피해를 줄 수 있어 엄격히 금지됩니다. 
                                    위반 시 정도에 따라 강력한 제재가 이루어질 수 있습니다.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        { title: "분쟁 및 명예훼손", desc: "욕설, 비방, 모욕, 허위사실 유포 등 타인의 명예 훼손" },
                                        { title: "개인정보 침해", desc: "타인의 동의 없는 실명, 연락처, 사진 등 개인 식별 정보 유포" },
                                        { title: "불법 콘텐츠 게시", desc: "저작권 침해, 불법 복제물, 음란물, 사행성 정보 등 불법 정보 공유" },
                                        { title: "혐오 발언 및 차별", desc: "특정 집단에 대한 편견, 혐오 발언, 사회적 약자 비하 및 차별 조장" },
                                        { title: "상업적 광고/스팸", desc: "허가되지 않은 광고, 홍보, 도배, 특정 사이트 가입 유도 등" },
                                        { title: "서비스 운영 방해", desc: "어뷰징, 매크로 사용, 관리자 사칭 등 정상적 운영 방해 행위" }
                                    ].map((item, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm md:text-base text-gray-600 bg-gray-50 p-3 rounded-lg">
                                            <i className="fas fa-check-circle text-red-400 mt-1 flex-shrink-0"></i>
                                            <div>
                                                <span className="font-bold text-gray-800 mr-1">{item.title}:</span>
                                                {item.desc}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl">
                                    <i className="fas fa-gavel"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">3. 위반 시 제재 조치 안내</h2>
                            </div>
                            <div className="pl-3 md:pl-14 space-y-4">
                                <p className="text-gray-600 text-sm md:text-base">
                                    이용규칙을 위반하는 게시물은 관리자에 의해 예고 없이 삭제될 수 있으며, 
                                    위반 행위의 심각성과 반복성에 따라 단계별 이용 제한 조치가 적용됩니다.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div className="border-l-4 border-yellow-400 bg-yellow-50/50 p-4 rounded-r-xl">
                                        <h3 className="font-bold text-yellow-800 flex items-center gap-2">
                                            <i className="fas fa-exclamation-circle"></i> 경고 / 3일 정지
                                        </h3>
                                        <p className="text-xs text-yellow-700 mt-1 font-medium">가벼운 위반 및 초범</p>
                                        <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside marker:text-yellow-400">
                                            <li>단순 욕설, 비속어 사용</li>
                                            <li>불쾌감을 주는 댓글</li>
                                            <li>단순 도배</li>
                                        </ul>
                                    </div>

                                    <div className="border-l-4 border-orange-500 bg-orange-50/50 p-4 rounded-r-xl">
                                        <h3 className="font-bold text-orange-800 flex items-center gap-2">
                                            <i className="fas fa-ban"></i> 7일 이용 정지
                                        </h3>
                                        <p className="text-xs text-orange-700 mt-1 font-medium">반복적 위반 및 타인 피해</p>
                                        <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside marker:text-orange-500">
                                            <li>특정인 저격, 인신공격</li>
                                            <li>지속적인 분쟁 유발</li>
                                            <li>성적 수치심 유발</li>
                                        </ul>
                                    </div>

                                    <div className="border-l-4 border-red-600 bg-red-50/50 p-4 rounded-r-xl">
                                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                                            <i className="fas fa-lock"></i> 30일 이용 정지
                                        </h3>
                                        <p className="text-xs text-red-700 mt-1 font-medium">심각한 분위기 저해 및 운영 방해</p>
                                        <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside marker:text-red-600">
                                            <li>명예훼손, 허위사실 유포</li>
                                            <li>지속적 규칙 위반</li>
                                            <li>경고 무시 및 개선 의지 없음</li>
                                        </ul>
                                    </div>

                                    <div className="border-l-4 border-gray-800 bg-gray-100 p-4 rounded-r-xl">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <i className="fas fa-user-slash"></i> 영구 이용 정지
                                        </h3>
                                        <p className="text-xs text-gray-600 mt-1 font-medium">서비스에 심각한 피해 및 현행법 위반</p>
                                        <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside marker:text-gray-800">
                                            <li>개인정보 유포</li>
                                            <li>불법/음란물 유포</li>
                                            <li>사기, 계정 거래 등</li>
                                        </ul>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    * 위 기준은 절대적이지 않으며, 운영진의 판단에 따라 제재 수위가 조정될 수 있습니다.
                                </p>
                            </div>
                        </section>

                        <hr className="border-gray-100" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
                                    <i className="fas fa-envelope-open-text"></i>
                                </span>
                                <h2 className="text-xl font-bold text-gray-800">4. 문의 및 이의 제기</h2>
                            </div>
                            <div className="pl-3 md:pl-14">
                                <div className="bg-blue-50 rounded-xl p-5 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                    <div className="flex-1">
                                        <p className="text-gray-700 text-sm md:text-base font-medium">
                                            제재 조치에 대해 이의가 있거나, 커뮤니티 이용 중 문의사항이 있으신가요?
                                            객관적인 자료와 함께 문의해 주시면 검토 후 답변드리겠습니다.
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/contact')}
                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition shadow-md whitespace-nowrap"
                                    >
                                        문의하기
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                <div className="mt-8 text-center">
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