export default function PrivacyPage() {
    return (
        <div className="bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        개인정보처리방침
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        회원님의 개인정보를 소중하게 생각하며, 정보통신망 이용촉진 및 정보보호 등에 관한 법률을 준수하고 있습니다.
                    </p>
                </div>
                
                <div className="mt-12 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">1. 개인정보의 처리 목적</h2>
                            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>회원 관리:</b> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 연령확인, 분쟁 조정을 위한 기록 보존, 불만처리 등 민원처리, 고지사항 전달</li>
                                <li><b>서비스 제공:</b> 콘텐츠 제공, 맞춤 서비스 제공, 본인인증, 연령인증</li>
                                <li><b>신규 서비스 개발 및 마케팅·광고에의 활용:</b> 신규 서비스 개발 및 맞춤 서비스 제공, 통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 이벤트 정보 및 참여기회 제공, 접속빈도 파악, 회원의 서비스이용에 대한 통계</li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">2. 처리하는 개인정보의 항목</h2>
                            <p>회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.</p>
                             <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>필수항목:</b> 이메일 주소, 비밀번호, 닉네임, 소속 대학 정보</li>
                                <li><b>선택항목:</b> 프로필 사진, 자기소개</li>
                                <li><b>자동수집항목:</b> 서비스 이용 기록, 접속 로그, 쿠키, 접속 IP 정보</li>
                            </ul>
                        </div>
                         <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">3. 개인정보의 보유 및 이용기간</h2>
                            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다. 원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>계약 또는 청약철회 등에 관한 기록:</b> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                <li><b>대금결제 및 재화 등의 공급에 관한 기록:</b> 5년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                <li><b>소비자의 불만 또는 분쟁처리에 관한 기록:</b> 3년 (전자상거래 등에서의 소비자보호에 관한 법률)</li>
                                <li><b>통신비밀보호법에 따른 통신사실확인자료:</b> 3개월</li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">4. 개인정보의 제3자 제공</h2>
                            <p>회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다. 현재 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.</p>
                             <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>제공받는 자: 해당 없음</li>
                                <li>제공 목적: 해당 없음</li>
                                <li>제공 항목: 해당 없음</li>
                             </ul>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">5. 개인정보 처리의 위탁</h2>
                            <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>수탁업체명:</b> OO 클라우드 / <b>위탁업무 내용:</b> 클라우드 서버 운영 및 관리</li>
                                <li><b>수탁업체명:</b> XX PG / <b>위탁업무 내용:</b> 결제 처리 및 도용 방지</li>
                            </ul>
                            <p className="mt-2">회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">6. 정보주체의 권리·의무 및 행사방법</h2>
                            <p>정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이 조치하겠습니다.</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">7. 개인정보의 파기절차 및 방법</h2>
                            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 파기 절차 및 방법은 다음과 같습니다.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>파기절차:</b> 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</li>
                                <li><b>파기방법:</b> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법을 이용하여 삭제하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">8. 쿠키(Cookie)의 운용 및 거부</h2>
                            <p>회사는 개인화되고 맞춤화된 서비스를 제공하기 위해서 이용자의 정보를 저장하고 수시로 불러오는 &lsquo;쿠키(cookie)&rsquo;를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에게 보내는 아주 작은 텍스트 파일로 이용자 컴퓨터의 하드디스크에 저장됩니다.</p>
                            <p className="mt-2">이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 따라서 이용자는 웹브라우저에서 옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다 확인을 거치거나, 아니면 모든 쿠키의 저장을 거부할 수도 있습니다. 단, 쿠키의 저장을 거부할 경우 로그인이 필요한 일부 서비스는 이용에 어려움이 있을 수 있습니다.</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">9. 개인정보 보호책임자</h2>
                            <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책im자를 지정하고 있습니다.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li><b>성명:</b> 유영재</li>
                                <li><b>직책:</b> 개인정보 보호책임자(CPO)</li>
                                <li><b>연락처:</b> 02-1234-5678, contact@campuseat.com</li>
                            </ul>
                        </div>
                        <div className="pt-4">
                            <p className="text-sm text-gray-500">
                                <b>공고일자:</b> 2025년 10월 10일<br/>
                                <b>시행일자:</b> 2025년 10월 10일
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}