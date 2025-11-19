"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { FaChevronDown, FaRegFileImage } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider"; 
import apiClient from "@/lib/api";

function AlertModal({ message, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!message) return null;

  return (
    <div 
        className="fixed inset-0 flex items-center justify-center z-[60]"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm animate-fadeIn">
        <p className="text-lg mb-6">{message}</p>
        <button onClick={onClose} className="bg-indigo-600 text-white px-8 py-2 rounded-lg w-full hover:bg-indigo-700 transition">확인</button>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm]);

  return (
    <div 
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm animate-fadeIn">
        <p className="text-lg font-medium text-gray-800 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="w-1/2 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition">
            아니요
          </button>
          <button onClick={onConfirm} className="w-1/2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
            네
          </button>
        </div>
      </div>
    </div>
  );
}

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

function FaqItem({ faq, isOpen, onClick, onSwitchToForm }) {
  return (
    <div className="border-b border-gray-200 py-4">
      <button onClick={onClick} className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800 focus:outline-none">
        <span>{faq.question}</span>
        <FaChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-4 text-gray-600 bg-gray-50 p-4 rounded-md animate-fadeIn">
          <p>{faq.answer}</p>
          <div className="mt-6 text-sm text-center border-t pt-4">
            <span>해결이 되지 않으셨나요? </span>
            <button onClick={onSwitchToForm} className="font-semibold text-indigo-600 hover:underline">
              문의하기
            </button>
            <span>를 통해 접수해주세요!</span>
          </div>
        </div>
      )}
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
    <div className="border-b border-gray-200 py-4">
      <div className="w-full flex justify-between items-center text-left text-lg font-medium text-gray-800">
        <button onClick={onClick} className="flex-grow flex items-center gap-4 focus:outline-none">
          <span className={`px-3 py-1 text-sm rounded-full ${inquiry.status === 'answered' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
            {inquiry.status === 'answered' ? '답변 완료' : '답변 대기'}
          </span>
          <span>{inquiry.title}</span>
        </button>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-sm text-gray-500 font-normal">{inquiryDate}</span>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCancel(inquiry.id);
            }} 
            className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-1 px-3 rounded-md transition"
          >
            문의 취소
          </button>
          <button onClick={onClick} className="focus:outline-none">
            <FaChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 space-y-6 text-gray-700 bg-gray-50 p-6 rounded-md animate-fadeIn">
          <div className="border-b pb-4">
            <p className="whitespace-pre-wrap">{inquiry.content}</p>
            {inquiry.fileName && (
              <p className="text-sm text-gray-500 mt-4">
                첨부파일:{" "}
                <button
                  onClick={handleDownload}
                  className="text-indigo-600 hover:underline"
                >
                  {inquiry.fileName}
                </button>
              </p>
            )}
          </div>
          {inquiry.answers && inquiry.answers.length > 0 ? (
            inquiry.answers.map(answer => (
              <div key={answer.id} className="bg-indigo-50 p-4 rounded">
                <p className="font-semibold text-indigo-800 mb-2">
                  관리자 답변 ({new Date(answer.createdAt).toLocaleDateString('ko-KR')})
                </p>
                <p className="whitespace-pre-wrap">{answer.content}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-gray-500">아직 등록된 답변이 없습니다.</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">고객센터</h1>
          <p className="mt-4 text-lg text-gray-500">
            {mode === 'faq' && "먼저 자주 묻는 질문을 확인해보세요."}
            {mode === 'myInquiries' && "작성한 문의와 답변을 확인해보세요."}
            {mode === 'form' && "궁금한 점을 문의해주시면 최대한 빠르게 답변드리겠습니다."}
          </p>
        </div>

        {mode === 'faq' && (
          <div className="bg-white p-8 border rounded-lg shadow-sm" style={{ minHeight: '400px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">자주 묻는 질문</h2>
              <div>
                <button onClick={() => handleProtectedMode('myInquiries')} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition mr-4">내 문의 보기</button>
                <button onClick={() => handleProtectedMode('form')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">1:1 문의하기</button>
              </div>
            </div>
            <div>
              {faqData.map(faq => <FaqItem key={faq.id} faq={faq} isOpen={openFaqId === faq.id} onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)} onSwitchToForm={() => handleProtectedMode('form')} />)}
            </div>
          </div>
        )}

        {mode === 'myInquiries' && user && (
          <div className="bg-white p-8 border rounded-lg shadow-sm" style={{ minHeight: '1000px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">내 문의</h2>
              <div>
                <button onClick={() => setMode('faq')} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition mr-4">FAQ 보기</button>
                <button onClick={() => handleProtectedMode('form')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">새 문의 작성</button>
              </div>
            </div>
            <div>
              {isLoading ? <p>문의 내역을 불러오는 중입니다...</p> : inquiries.length > 0 ? (
                inquiries.map(inquiry => (
                  <InquiryItem
                    key={inquiry.id}
                    inquiry={inquiry}
                    isOpen={openInquiryId === inquiry.id}
                    onClick={() => handleInquiryClick(inquiry.id)}
                    answers={inquiry.answers} 
                    onCancel={handleCancelInquiry}
                    showAlert={showAlert}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">작성한 문의가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {mode === 'form' && user && (
          <div className="bg-white p-8 border rounded-lg shadow-sm" style={{ minHeight: '1000px' }}>
            <div className="flex justify-end items-center mb-6">
              <button onClick={() => setMode('faq')} className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition">← FAQ로 돌아가기</button>
            </div>
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitInquiry();
              }}
              noValidate
            >
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="문의 제목을 입력해주세요."
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="문의하실 내용을 자세하게 작성해주세요."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">파일 첨부</label>
                <div className="mt-1 flex items-center gap-4">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaRegFileImage className="inline-block mr-2" /> 파일 선택
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  {file && <span className="text-sm text-gray-600">{file.name}</span>}
                </div>
              </div>
              <div>
                <label htmlFor="replyEmail" className="block text-sm font-medium text-gray-700 mb-1">연락받을 이메일</label>
                <input
                  id="replyEmail"
                  value={replyEmail}
                  onChange={(e) => setReplyEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이용자 아이디</label>
                <input
                  type="text"
                  value={user?.nickname || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학교</label>
                <input
                  type="text"
                  value={user?.university || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="border-t pt-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-1"
                  />
                  <div className="ml-3 text-sm">
                    <span className="font-medium text-gray-800">
                      개인정보 수집 및 이용 동의 (필수)
                    </span>
                    <p className="text-gray-500">
                      문의 처리를 위해 이메일, 문의내용에 포함된 개인정보를 수집하며,
                      개인정보처리방침에 따라 3년간 보관 후 파기합니다. 개인정보 수집 및 이용을 거부할 수 있으며,
                      거부할 경우 문의가 불가합니다.
                    </p>
                  </div>
                </label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !consent}
                className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "접수 중..." : "문의 접수하기"}
              </button>
            </form>
          </div>
        )}

        {alertInfo.show && (
          <AlertModal message={alertInfo.message} onClose={closeAlert} />
        )}

        {showConfirmModal && (
          <ConfirmModal
            message="정말 문의를 취소하시겠습니까?"
            onConfirm={executeDeleteInquiry}
            onCancel={() => setShowConfirmModal(false)}
          />
        )}
      </div>
    </div>
  );
}