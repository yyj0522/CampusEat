"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import { FaChevronDown, FaRegFileImage, FaHeadset, FaHistory, FaQuestionCircle } from "react-icons/fa";

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={onClose}
        >
            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
                    <i className="fas fa-info text-2xl text-blue-500"></i>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">알림</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8 break-keep">
                    {message}
                </p>
                <button 
                    onClick={onClose} 
                    className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-blue-700 transition active:scale-95"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">확인</h3>
                <p className="text-gray-600 font-medium mb-8 break-keep">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition">취소</button>
                    <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-600 transition shadow-md">확인</button>
                </div>
            </div>
        </div>
    );
};

const faqData = [
  { id: 1, question: "학교/캠퍼스가 바뀌었는데 변경할 수 없나요?", answer: "회원가입 시 선택한 학교/캠퍼스는 가입 이후 변경할 수 없습니다. 다른 학교/캠퍼스로 변경을 원하실 경우, 현재 사용하시는 계정을 탈퇴하신 후 새로운 학교/캠퍼스로 다시 회원가입을 진행해주시기 바랍니다." },
  { id: 2, question: "닉네임, 프로필 이미지 등 프로필 변경은 어떻게 하나요?", answer: "마이페이지의 '프로필 수정' 메뉴에서 닉네임과 프로필 이미지를 자유롭게 변경하실 수 있습니다. 닉네임은 30일에 한 번만 변경 가능하니 신중하게 선택해주세요." },
  { id: 3, question: "아이디/비밀번호를 잊어버렸어요.", answer: "로그인 페이지 하단의 '아이디/비밀번호 찾기' 기능을 통해 가입 시 인증한 이메일로 비밀번호 재설정 링크를 발급받을 수 있습니다." },
  { id: 4, question: "회원 탈퇴는 어떻게 하나요?", answer: "계정 설정 메뉴 가장 하단에 '회원 탈퇴' 버튼이 있습니다. 탈퇴 시 모든 활동 기록과 개인 정보는 복구할 수 없으니 신중하게 결정해주시기 바랍니다." },
  { id: 5, question: "불량 사용자를 신고하고 싶어요.", answer: "문제가 되는 게시물의 '더보기(...)' 메뉴, 유저의 닉네임 우클릭 -> 신고하기를 통해 신고를 할 수 있습니다. 신고 접수 시 내부 검토를 거쳐 커뮤니티 이용규칙에 따라 조치됩니다." },
  { id: 6, question: "학교 이메일 인증이 계속 실패해요.", answer: "먼저 스팸 메일함을 확인해보시고, 인증 메일이 오지 않았다면 이메일 주소를 정확히 입력했는지 다시 확인해주세요. 문제가 지속될 경우, '1:1 문의하기'를 통해 문의해주시면 확인 후 처리해드리겠습니다." },
  { id: 7, question: "가입하려는 학교가 목록에 없어요!", answer: "학교 정보는 주기적으로 업데이트되고 있습니다. 만약 본인의 학교가 목록에 없다면 캠퍼스잇 이메일로 학교 추가를 요청해주세요. 검토 후 빠르게 반영하겠습니다." },
  { id: 8, question: "자유 게시판 이용 시 주의사항이 있나요?", answer: "자유 게시판은 자유로운 소통을 위한 공간입니다. 건전한 커뮤니티 문화를 위해 매너있는 글, 댓글 작성 부탁드립니다. 이용수칙 위반 시 제재될 수 있습니다." },
  { id: 9, question: "익명으로 글을 쓰면 정말 아무도 모르는 건가요?", answer: "네, 익명으로 작성된 게시물은 닉네임은 공개되지않고 최소한의 신뢰성을 위해 대학교정보만 공개됩니다. 다만, 심각한 약관 위반이나 법적 문제 발생 시에는 관련 법령에 따라 수사기관에 정보가 제공될 수 있습니다." },
  { id: 10, question: "제가 쓴 글이나 댓글을 수정/삭제하고 싶어요.", answer: "본인이 작성한 게시물과 댓글은 언제든지 수정하거나 삭제할 수 있습니다." },
  { id: 11, question: "졸업생도 계속 이용할 수 있나요?", answer: "네, 졸업 후에도 캠퍼스잇 서비스는 계속 이용하실 수 있습니다. 다만, 탈퇴 시 재가입은 제한될 수 있습니다." },
  { id: 12, question: "알림은 어떻게 설정하나요?", answer: "설정 메뉴에서 새로운 댓글, 좋아요 등에 대한 푸시 알림 및 이메일 알림 수신 여부를 상세하게 설정할 수 있습니다." },
  { id: 13, question: "파일 첨부 용량 제한이 있나요?", answer: "게시물 작성 시 첨부 가능한 파일의 개수는 최대 5개이며, 각 파일의 용량은 10MB를 초과할 수 없습니다." },
  { id: 14, question: "서비스 이용 중 오류가 발생했어요.", answer: "서비스 이용에 불편을 드려 죄송합니다. 오류가 발생한 화면을 캡쳐하여 '1:1 문의하기'로 접수해주시면, 문제 상황을 파악하고 해결하는 데 큰 도움이 됩니다." },
  { id: 15, question: "개인정보는 안전하게 관리되나요?", answer: "그럼요. 회원님의 개인정보는 개인정보처리방침에 따라 암호화되어 안전하게 관리되고 있습니다. 자세한 내용은 홈페이지 하단의 '개인정보처리방침' 문서를 참고해주시기 바랍니다." }
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button 
        onClick={onClick} 
        className={`w-full flex justify-between items-center text-left py-5 px-4 hover:bg-gray-50 transition-colors rounded-lg ${isOpen ? 'bg-gray-50' : ''}`}
      >
        <span className="font-bold text-gray-800 text-sm md:text-base pr-4 flex items-center gap-3">
            <span className="text-blue-600 font-black text-lg">Q.</span>
            {faq.question}
        </span>
        <div className={`transform transition-transform duration-300 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}>
            <FaChevronDown />
        </div>
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-5 bg-gray-50 rounded-b-lg text-sm md:text-base text-gray-600 leading-relaxed border-t border-gray-100 mx-2 mb-2">
            <div className="flex gap-3">
                <span className="text-red-500 font-black text-lg">A.</span>
                <p>{faq.answer}</p>
            </div>
        </div>
      </div>
    </div>
  );
}

function InquiryItem({ inquiry, isOpen, onClick, onCancel, showAlert }) {
  const inquiryDate = new Date(inquiry.createdAt).toLocaleDateString('ko-KR');

  const handleDownload = async () => {
    try {
      const response = await apiClient.get(`/inquiries/${inquiry.id}/file`);
      if (response.data?.url) {
        window.open(response.data.url, "_blank");
      } else {
        showAlert("다운로드 URL을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      showAlert("파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4 shadow-sm hover:shadow-md transition-shadow">
      <div 
        onClick={onClick}
        className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-5 cursor-pointer bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 mb-2 md:mb-0 flex-1 min-w-0">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-md flex-shrink-0 ${inquiry.status === 'answered' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            {inquiry.status === 'answered' ? '답변 완료' : '답변 대기'}
          </span>
          <span className="font-bold text-gray-800 truncate pt-0.5">{inquiry.title}</span>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end pl-11 md:pl-0">
          <span className="text-xs text-gray-400 font-medium">{inquiryDate}</span>
          <div className="flex items-center gap-2">
              {inquiry.status !== 'answered' && (
                <button 
                    onClick={(e) => {
                    e.stopPropagation();
                    onCancel(inquiry.id);
                    }} 
                    className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg transition"
                >
                    취소
                </button>
              )}
              <FaChevronDown className={`text-gray-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-gray-100 bg-gray-50 p-6 animate-fadeIn">
          <div className="prose prose-sm max-w-none text-gray-700 mb-6">
            <p className="whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
            {inquiry.fileName && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 w-fit">
                <FaRegFileImage className="text-gray-400" />
                <button onClick={handleDownload} className="text-sm text-blue-600 hover:underline font-medium truncate max-w-xs">
                  {inquiry.fileName}
                </button>
              </div>
            )}
          </div>

          {inquiry.answers && inquiry.answers.length > 0 ? (
            <div className="space-y-4 mt-6 border-t border-gray-200 pt-6">
              {inquiry.answers.map(answer => (
                <div key={answer.id} className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-blue-700 flex items-center gap-2">
                        <i className="fas fa-headset"></i> 관리자 답변
                    </span>
                    <span className="text-xs text-blue-400">{new Date(answer.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <i className="fas fa-hourglass-half"></i>
                </div>
                <p className="text-sm text-gray-500">담당자가 확인 중입니다.<br/>조금만 기다려주세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ContactPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState('faq'); 
  const [openFaqId, setOpenFaqId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [openInquiryId, setOpenInquiryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState(null);

  const showAlert = (message) => setAlertInfo({ show: true, message });
  const closeAlert = () => setAlertInfo({ show: false, message: "" });

  useEffect(() => {
    if (!authLoading && user) {
        setReplyEmail(user.email);
    }
  }, [user, authLoading]);

  const handleProtectedMode = (targetMode) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setMode(targetMode);
    window.scrollTo(0, 0);
  };

  const fetchInquiries = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get('/inquiries');
      setInquiries(response.data);
    } catch (error) {
      console.error("문의 내역 로딩 실패:", error);
      showAlert("문의 내역을 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [user]); 
  
  useEffect(() => {
    if (user && mode === 'myInquiries') {
      fetchInquiries();
    }
  }, [user, mode, fetchInquiries]);

  const handleInquiryClick = (inquiryId) => {
    const newOpenInquiryId = openInquiryId === inquiryId ? null : inquiryId;
    setOpenInquiryId(newOpenInquiryId);
  };

  const handleSubmitInquiry = async () => {
    if (!title.trim() || !content.trim()) {
      showAlert("제목 및 내용을 작성해주세요!");
      return;
    }
    if (!consent) {
      showAlert("개인정보 수집 및 이용에 동의해주세요.");
      return;
    }
    
    let dataToSend;
    let headers = {};

    if (file) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('replyEmail', replyEmail);
      formData.append('file', file);
      dataToSend = formData;
    } else {
      dataToSend = {
        title,
        content,
        replyEmail,
      };
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/inquiries", dataToSend, { headers }); 
      showAlert("문의가 성공적으로 접수되었습니다.");
      setTitle("");
      setContent("");
      setFile(null);
      setConsent(false);
      setMode("myInquiries");
    } catch (error) {
      console.error("문의 접수 오류:", error);
      showAlert(error.response?.data?.message || "문의 접수 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelInquiry = (inquiryId) => {
    setInquiryToDelete(inquiryId);
    setShowConfirmModal(true);
  };

  const executeDeleteInquiry = async () => {
    if (!inquiryToDelete) return;
    try {
      await apiClient.delete(`/inquiries/${inquiryToDelete}`);
      setShowConfirmModal(false);
      setInquiryToDelete(null);
      showAlert("문의가 취소되었습니다.");
      setInquiries(prev => prev.filter(inq => inq.id !== inquiryToDelete));
    } catch (error) {
      console.error("문의 취소 오류:", error);
      showAlert("문의 취소 중 오류가 발생했습니다.");
      setShowConfirmModal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
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
                    <i className="fas fa-headset text-3xl text-white"></i>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-3">고객센터</h1>
                <p className="text-lg text-blue-100 font-medium">
                    무엇을 도와드릴까요? 궁금한 점을 빠르게 해결해드립니다.
                </p>
            </div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/30 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
        </div>

        <div className="flex justify-center mb-8">
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex">
                {[
                    { id: 'faq', label: '자주 묻는 질문', icon: <FaQuestionCircle className="mr-2"/> },
                    { id: 'myInquiries', label: '내 문의 내역', icon: <FaHistory className="mr-2"/> },
                    { id: 'form', label: '1:1 문의하기', icon: <FaHeadset className="mr-2"/> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => tab.id === 'faq' ? setMode('faq') : handleProtectedMode(tab.id)}
                        className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm min-h-[500px] overflow-hidden">
            
            {mode === 'faq' && (
                <div className="p-6 md:p-8 animate-fadeIn">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
                        자주 묻는 질문
                    </h2>
                    <div className="space-y-2">
                        {faqData.map(faq => <FaqItem key={faq.id} faq={faq} isOpen={openFaqId === faq.id} onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)} />)}
                    </div>
                    <div className="mt-10 p-6 bg-gray-50 rounded-2xl text-center border border-gray-100">
                        <p className="text-gray-600 mb-4 font-medium">원하는 답변을 찾지 못하셨나요?</p>
                        <button 
                            onClick={() => handleProtectedMode('form')} 
                            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg"
                        >
                            1:1 문의 남기기
                        </button>
                    </div>
                </div>
            )}

            {mode === 'myInquiries' && user && (
                <div className="p-6 md:p-8 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                            <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
                            내 문의 내역
                        </h2>
                        <button onClick={() => handleProtectedMode('form')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center">
                            <i className="fas fa-plus mr-1"></i> 새 문의 작성
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        {isLoading ? (
                             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                                <p>문의 내역을 불러오는 중입니다...</p>
                            </div>
                        ) : inquiries.length > 0 ? (
                            inquiries.map(inquiry => (
                                <InquiryItem
                                    key={inquiry.id}
                                    inquiry={inquiry}
                                    isOpen={openInquiryId === inquiry.id}
                                    onClick={() => handleInquiryClick(inquiry.id)}
                                    onCancel={handleCancelInquiry}
                                    showAlert={showAlert}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <i className="far fa-folder-open text-4xl mb-3 opacity-50"></i>
                                <p>작성한 문의 내역이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {mode === 'form' && user && (
                <div className="p-6 md:p-8 animate-fadeIn">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                        <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
                        1:1 문의 작성
                    </h2>
                    <p className="text-gray-500 mb-8 text-sm ml-5">문의 내용을 상세히 적어주시면 정확한 답변을 받으실 수 있습니다.</p>

                    <form
                        className="space-y-6 max-w-3xl"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmitInquiry();
                        }}
                        noValidate
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">이용자 아이디</label>
                                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium">
                                    {user?.nickname || ''}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">답변 받을 이메일</label>
                                <input
                                    value={replyEmail}
                                    onChange={(e) => setReplyEmail(e.target.value)}
                                    type="email"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">문의 제목</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold"
                                placeholder="제목을 입력해주세요."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">문의 내용</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="8"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm resize-none"
                                placeholder="문의하실 내용을 자세하게 작성해주세요."
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">파일 첨부 (선택)</label>
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-100 transition flex items-center gap-2"
                                >
                                    <FaRegFileImage /> 파일 선택
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                                {file && (
                                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                                        <span>{file.name}</span>
                                        <button type="button" onClick={() => setFile(null)} className="hover:text-indigo-900"><i className="fas fa-times"></i></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={consent}
                                        onChange={(e) => setConsent(e.target.checked)}
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-indigo-500 checked:bg-indigo-500"
                                    />
                                     <i className="fas fa-check text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        개인정보 수집 및 이용 동의 (필수)
                                    </span>
                                    <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                                        문의 처리를 위해 이메일, 문의내용에 포함된 개인정보를 수집하며,
                                        개인정보처리방침에 따라 3년간 보관 후 파기합니다. 동의를 거부할 수 있으나, 이 경우 문의 접수가 제한됩니다.
                                    </p>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting || !consent}
                                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none transition-all text-lg"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        접수 중...
                                    </span>
                                ) : "문의하기"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {alertInfo.show && (
          <AlertModal message={alertInfo.message} onClose={closeAlert} />
        )}

        {showConfirmModal && (
          <ConfirmModal
            message="정말 문의를 취소하시겠습니까? (삭제된 문의는 복구할 수 없습니다)"
            onConfirm={executeDeleteInquiry}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </main>
    </div>
  );
}