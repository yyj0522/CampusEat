export default function TermsPage() {
    return (
        <div className="bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        이용약관
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        캠퍼스잇 서비스 이용에 관한 규정을 안내합니다.
                    </p>
                </div>

                <div className="mt-12 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    <div className="space-y-8 text-gray-600 leading-relaxed">
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제1조 (목적)</h2>
                            <p>이 약관은 캠퍼스잇 주식회사(이하 &ldquo;회사&rdquo;)가 제공하는 캠퍼스잇 및 관련 제반 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여 회사와 회원과의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제2조 (정의)</h2>
                            <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.<br/>
                                1. &ldquo;서비스&rdquo;라 함은 구현되는 단말기(PC, 모바일, 태블릿 PC 등의 각종 유무선 장치를 포함)와 상관없이 &ldquo;회원&rdquo;이 이용할 수 있는 캠퍼스잇 커뮤니티 및 관련 제반 서비스를 의미합니다.<br/>
                                2. &ldquo;회원&rdquo;이라 함은 회사의 &ldquo;서비스&rdquo;에 접속하여 이 약관에 따라 &ldquo;회사&rdquo;와 이용계약을 체결하고 &ldquo;회사&rdquo;가 제공하는 &ldquo;서비스&rdquo;를 이용하는 고객을 말합니다.<br/>
                                3. &ldquo;아이디(ID)&rdquo;라 함은 &ldquo;회원&rdquo;의 식별과 &ldquo;서비스&rdquo; 이용을 위하여 &ldquo;회원&rdquo;이 정하고 &ldquo;회사&rdquo;가 승인하는 이메일 주소를 의미합니다.<br/>
                                4. &ldquo;비밀번호&rdquo;라 함은 &ldquo;회원&rdquo;이 부여 받은 &ldquo;아이디&rdquo;와 일치되는 &ldquo;회원&rdquo;임을 확인하고 비밀보호를 위해 &ldquo;회원&rdquo; 자신이 정한 문자 또는 숫자의 조합을 의미합니다.<br/>
                                5. &ldquo;게시물&rdquo;이라 함은 &ldquo;회원&rdquo;이 &ldquo;서비스&rdquo;를 이용함에 있어 &ldquo;서비스상&rdquo;에 게시한 부호ㆍ문자ㆍ음성ㆍ화상ㆍ동영상 등의 정보 형태의 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제3조 (약관의 게시와 개정)</h2>
                            <p>1. &ldquo;회사&rdquo;는 이 약관의 내용을 &ldquo;회원&rdquo;이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br/>
                                2. &ldquo;회사&rdquo;는 &ldquo;약관의 규제에 관한 법률&rdquo;, &ldquo;정보통신망 이용촉진 및 정보보호 등에 관한 법률(이하 &ldquo;정보통신망법&rdquo;)&rdquo; 등 관련법을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.<br/>
                                3. &ldquo;회사&rdquo;가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 제1항의 방식에 따라 그 개정약관의 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 다만, 회원에게 불리한 약관의 개정의 경우에는 30일 전부터 공지합니다.
                            </p>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제4조 (이용계약 체결)</h2>
                            <p>1. 이용계약은 &ldquo;회원&rdquo;이 되고자 하는 자(이하 &ldquo;가입신청자&rdquo;)가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 &ldquo;회사&rdquo;가 이러한 신청에 대하여 승낙함으로써 체결됩니다.<br/>
                                2. &ldquo;회사&rdquo;는 &ldquo;가입신청자&rdquo;의 신청에 대하여 &ldquo;서비스&rdquo; 이용을 승낙함을 원칙으로 합니다. 다만, &ldquo;회사&rdquo;는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않거나 사후에 이용계약을 해지할 수 있습니다.<br/>
                                &nbsp;&nbsp;가. 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우<br/>
                                &nbsp;&nbsp;나. 실명이 아니거나 타인의 명의를 이용한 경우<br/>
                                &nbsp;&nbsp;다. 허위의 정보를 기재하거나, &ldquo;회사&rdquo;가 제시하는 내용을 기재하지 않은 경우
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제5조 (회사의 의무)</h2>
                            <p>1. &ldquo;회사&rdquo;는 관련법과 이 약관이 금지하거나 미풍양속에 반하는 행위를 하지 않으며, 계속적이고 안정적으로 &ldquo;서비스&rdquo;를 제공하기 위하여 최선을 다하여 노력합니다.<br/>
                                2. &ldquo;회사&rdquo;는 &ldquo;회원&rdquo;이 안전하게 &ldquo;서비스&rdquo;를 이용할 수 있도록 개인정보(신용정보 포함)보호를 위해 보안시스템을 갖추어야 하며 개인정보처리방침을 공시하고 준수합니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제6조 (회원의 의무)</h2>
                            <p>1. &ldquo;회원&rdquo;은 다음 행위를 하여서는 안 됩니다.<br/>
                                &nbsp;&nbsp;가. 신청 또는 변경 시 허위 내용의 등록<br/>
                                &nbsp;&nbsp;나. 타인의 정보 도용<br/>
                                &nbsp;&nbsp;다. &ldquo;회사&rdquo;가 게시한 정보의 변경<br/>
                                &nbsp;&nbsp;라. &ldquo;회사&rdquo;와 기타 제3자의 저작권 등 지적재산권에 대한 침해<br/>
                                &nbsp;&nbsp;마. &ldquo;회사&rdquo; 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br/>
                                &nbsp;&nbsp;바. 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 &ldquo;서비스&rdquo;에 공개 또는 게시하는 행위<br/>
                                2. &ldquo;회원&rdquo;은 관계법, 이 약관의 규정, 이용안내 및 &ldquo;서비스&rdquo;와 관련하여 공지한 주의사항, &ldquo;회사&rdquo;가 통지하는 사항 등을 준수하여야 하며, 기타 &ldquo;회사&rdquo;의 업무에 방해되는 행위를 하여서는 안 됩니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제7조 (서비스의 제공 및 변경)</h2>
                            <p>1. &ldquo;회사&rdquo;는 &ldquo;회원&rdquo;에게 아래와 같은 서비스를 제공합니다.<br/>
                                &nbsp;&nbsp;가. 커뮤니티 서비스 (게시물 작성, 댓글 등)<br/>
                                &nbsp;&nbsp;나. 기타 &ldquo;회사&rdquo;가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 &ldquo;회원&rdquo;에게 제공하는 일체의 서비스<br/>
                                2. &ldquo;회사&rdquo;는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 또는 운영상 상당한 이유가 있는 경우 &ldquo;서비스&rdquo;의 제공을 일시적으로 중단할 수 있습니다.<br/>
                                3. &ldquo;회사&rdquo;는 상당한 이유가 있는 경우에 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 &ldquo;서비스&rdquo;를 변경할 수 있습니다.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제8조 (게시물의 저작권 및 관리)</h2>
                            <p>1. &ldquo;회원&rdquo;이 &ldquo;서비스&rdquo; 내에 게시한 &ldquo;게시물&rdquo;의 저작권은 해당 &ldquo;게시물&rdquo;의 저작자에게 귀속됩니다.<br/>
                                2. &ldquo;회원&rdquo;이 &ldquo;서비스&rdquo; 내에 게시하는 &ldquo;게시물&rdquo;은 검색결과 내지 &ldquo;서비스&rdquo; 및 관련 프로모션 등에 노출될 수 있으며, 해당 노출을 위해 필요한 범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다.<br/>
                                3. &ldquo;회원&rdquo;의 &ldquo;게시물&rdquo;이 &ldquo;정보통신망법&rdquo; 및 &ldquo;저작권법&rdquo;등 관련법에 위반되는 내용을 포함하는 경우, 권리자는 관련법이 정한 절차에 따라 해당 &ldquo;게시물&rdquo;의 게시중단 및 삭제 등을 요청할 수 있으며, &ldquo;회사&rdquo;는 관련법에 따라 조치를 취하여야 합니다.</p>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제9조 (계약해제, 해지 등)</h2>
                            <p>1. &ldquo;회원&rdquo;은 언제든지 서비스 내 정보 관리 메뉴를 통하여 이용계약 해지 신청(회원탈퇴)을 할 수 있으며, &ldquo;회사&rdquo;는 관련법 등이 정하는 바에 따라 이를 즉시 처리하여야 합니다.<br/>
                                2. &ldquo;회원&rdquo;이 이용계약을 해지할 경우, 관련법 및 개인정보처리방침에 따라 &ldquo;회사&rdquo;가 회원정보를 보유하는 경우를 제외하고는 해지 즉시 &ldquo;회원&rdquo;의 모든 데이터는 소멸됩니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제10조 (책임제한)</h2>
                            <p>1. &ldquo;회사&rdquo;는 천재지변 또는 이에 준하는 불가항력으로 인하여 &ldquo;서비스&rdquo;를 제공할 수 없는 경우에는 &ldquo;서비스&rdquo; 제공에 관한 책임이 면제됩니다.<br/>
                                2. &ldquo;회사&rdquo;는 &ldquo;회원&rdquo;의 귀책사유로 인한 &ldquo;서비스&rdquo; 이용의 장애에 대하여는 책임을 지지 않습니다.<br/>
                                3. &ldquo;회사&rdquo;는 &ldquo;회원&rdquo;이 &ldquo;서비스&rdquo;와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.<br/>
                                4. &ldquo;회사&rdquo;는 &ldquo;회원&rdquo; 간 또는 &ldquo;회원&rdquo;과 제3자 상호간에 &ldquo;서비스&rdquo;를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">제11조 (준거법 및 재판관할)</h2>
                            <p>1. &ldquo;회사&rdquo;와 &ldquo;회원&rdquo; 간에 제기된 소송은 대한민국법을 준거법으로 합니다.<br/>
                                2. &ldquo;회사&rdquo;와 &ldquo;회원&rdquo;간 발생한 분쟁에 관한 소송은 민사소송법 상의 관할법원에 제소합니다.</p>
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