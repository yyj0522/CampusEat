export default function CommunityRulesPage() {
    return (
        <div className="bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        커뮤니티 이용규칙
                    </h1>
                    <p className="mt-4 text-lg text-gray-500">
                        모두가 즐겁고 안전한 커뮤니티를 함께 만들어가요.
                    </p>
                </div>

                <div className="mt-12 bg-white p-8 border border-gray-200 rounded-lg shadow-sm">
                    <div className="space-y-10 text-gray-600 leading-relaxed">
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">🤝 1. 존중과 배려의 문화</h2>
                            <p>캠퍼스잇은 모든 학우들을 위한 소중한 공간입니다. 나이, 성별, 학력, 출신 지역, 인종, 종교, 성적 지향 등에 관계없이 서로를 존중하고 배려하는 문화를 지향합니다. 건전한 비판은 가능하지만, 타인에 대한 인신공격, 비방, 욕설, 차별적인 발언은 엄격히 금지됩니다.</p>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">🚫 2. 금지되는 활동</h2>
                            <p>다음과 같은 활동은 커뮤니티의 신뢰를 저해하고 타인에게 피해를 줄 수 있어 엄격히 금지됩니다. 위반 시 정도에 따라 강력한 제재가 이루어질 수 있습니다.</p>
                            <ul className="list-disc list-inside mt-4 space-y-3">
                                <li><b>분쟁 및 명예훼손:</b> 특정 개인이나 단체에 대한 욕설, 비방, 모욕, 허위사실 유포 등 타인의 명예를 훼손하는 모든 행위</li>
                                <li><b>개인정보 침해:</b> 타인의 동의 없이 실명, 연락처, 주소, 사진 등 개인을 식별할 수 있는 정보를 게시하거나 유포하는 행위</li>
                                <li><b>불법 콘텐츠 게시:</b> 저작권을 침해하는 불법 복제물, 음란물, 사행성 정보 등 현행법에 위배되는 모든 콘텐츠를 게시하거나 공유하는 행위</li>
                                <li><b>혐오 발언 및 차별 조장:</b> 특정 집단에 대한 편견이나 고정관념을 기반으로 한 혐오 발언, 사회적 약자를 비하하거나 차별을 조장하는 행위</li>
                                <li><b>상업적 광고 및 스팸:</b> 허가되지 않은 상업적 광고, 홍보, 다단계, 특정 사이트 가입 유도 등 스팸성 게시물을 반복적으로 게시하는 행위</li>
                                <li><b>서비스 운영 방해:</b> 게시판 도배, 어뷰징, 매크로 사용, 관리자 사칭 등 서비스의 정상적인 운영을 방해하는 모든 행위</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">🚨 3. 위반 시 제재 조치 안내</h2>
                            <p>이용규칙을 위반하는 게시물은 관리자에 의해 예고 없이 삭제 또는 블라인드 처리될 수 있습니다. 또한, 위반 행위의 심각성과 반복성에 따라 아래와 같은 단계별 이용 제한 조치가 적용됩니다.</p>
                            
                            <div className="mt-4 pl-4 border-l-4 border-yellow-300">
                                <h3 className="font-bold text-gray-700">경고 또는 3일 이용 정지</h3>
                                <p className="mt-1">비교적 경미한 위반 행위가 처음 발견된 경우 적용됩니다.</p>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    <li>단순 욕설, 비속어 사용</li>
                                    <li>타인에게 불쾌감을 주는 댓글 작성</li>
                                    <li>단순 도배성 게시물 작성</li>
                                </ul>
                            </div>

                            <div className="mt-6 pl-4 border-l-4 border-orange-400">
                                <h3 className="font-bold text-gray-700">7일 이용 정지</h3>
                                <p className="mt-1">반복적으로 규칙을 위반하거나 타인에게 피해를 주는 경우 적용됩니다.</p>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    <li>특정 사용자를 저격하거나 인신공격을 하는 경우</li>
                                    <li>지속적인 분쟁을 유발하는 경우</li>
                                    <li>성적 수치심이나 불쾌감을 유발하는 표현을 사용한 경우</li>
                                </ul>
                            </div>

                             <div className="mt-6 pl-4 border-l-4 border-red-500">
                                <h3 className="font-bold text-gray-700">30일 이용 정지</h3>
                                <p className="mt-1">커뮤니티 분위기를 심각하게 저해하거나 운영을 방해하는 경우 적용됩니다.</p>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    <li>명예훼손, 허위사실 유포로 타인에게 피해를 입힌 경우</li>
                                    <li>반복적인 제재에도 불구하고 개선의 여지가 없는 경우</li>
                                    <li>운영진의 경고를 무시하고 지속적으로 규칙을 위반하는 경우</li>
                                </ul>
                            </div>

                             <div className="mt-6 pl-4 border-l-4 border-gray-800">
                                <h3 className="font-bold text-gray-700">영구 이용 정지</h3>
                                <p className="mt-1">서비스에 심각한 피해를 주거나 현행법을 위반하는 경우 즉시 적용될 수 있습니다.</p>
                                <ul className="list-disc list-inside mt-2 text-sm">
                                    <li>타인의 개인정보를 유포하는 경우</li>
                                    <li>불법 사행성 사이트 홍보, 음란물 유포 등 현행법 위반 행위</li>
                                    <li>사기, 계정 거래/양도 등 서비스 신뢰도를 심각하게 훼손하는 경우</li>
                                </ul>
                            </div>
                            <p className="mt-6 text-sm text-gray-500">* 위 기준은 절대적인 것이 아니며, 위반 행위의 맥락과 심각성에 따라 제재 수위는 가중되거나 감경될 수 있습니다. 반복적인 경미한 위반도 누적될 경우 가중 제재의 대상이 됩니다.</p>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">🙋 4. 이의 제기</h2>
                            <p>제재 조치에 대해 이의가 있으신 경우, &lsquo;문의하기&rsquo; 채널을 통해 객관적인 자료와 함께 문의해 주시면 내부 검토 후 답변드리겠습니다.</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}