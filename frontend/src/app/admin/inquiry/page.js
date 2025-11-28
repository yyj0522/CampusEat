"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";

const Toast = ({ message, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"><i className="fas fa-info-circle"></i>{message}</div></div>;
};

export default function InquiryAdminPage() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedId, setExpandedId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "" });

    const showToast = (message) => setToast({ show: true, message });

    const fetchInquiries = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/inquiries/admin', {
                params: { page, limit: 10, status: activeTab }
            });
            setInquiries(response.data.data);
            setTotalPages(response.data.meta.lastPage);
        } catch (error) {
            console.error("문의 목록 로드 실패:", error);
            showToast("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => { fetchInquiries(); }, [fetchInquiries]);
    useEffect(() => { setPage(1); setExpandedId(null); }, [activeTab]);

    const toggleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            setReplyContent("");
        }
    };

    const handleDownloadFile = async (inquiryId, fileName, e) => {
        e.stopPropagation();
        try {
            const response = await apiClient.get(`/inquiries/${inquiryId}/file`);
            const link = document.createElement('a');
            link.href = response.data.url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            showToast("파일을 다운로드할 수 없습니다.");
        }
    };

    const handleSubmitReply = async (inquiryId) => {
        if (!replyContent.trim()) {
            showToast("답변 내용을 입력해주세요.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await apiClient.post(`/inquiries/${inquiryId}/answers`, { content: replyContent });
            showToast("답변이 등록되었습니다.");
            setExpandedId(null);
            fetchInquiries();
        } catch {
            showToast("답변 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">1:1 문의 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">사용자 문의에 답변하고 처리 상태를 관리합니다.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>대기중</button>
                    <button onClick={() => setActiveTab('answered')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'answered' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>완료됨</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-10 text-center text-gray-400">로딩 중...</div>
                ) : inquiries.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">문의 내역이 없습니다.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {inquiries.map((inquiry) => (
                            <div key={inquiry.id} className="group transition bg-white">
                                <div 
                                    onClick={() => toggleExpand(inquiry.id)}
                                    className={`p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 ${expandedId === inquiry.id ? 'bg-gray-50' : ''}`}
                                >
                                    <div className="flex items-start gap-4 overflow-hidden">
                                        <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${inquiry.status === 'answered' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800 truncate pr-4">{inquiry.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span className="font-medium text-gray-700">{inquiry.author?.nickname}</span>
                                                <span>·</span>
                                                <span>{inquiry.replyEmail}</span>
                                                <span>·</span>
                                                <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                                                {inquiry.fileName && <span className="text-blue-500 flex items-center"><i className="fas fa-paperclip ml-1 mr-0.5"></i> 파일</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 self-end sm:self-center">
                                        <i className={`fas fa-chevron-${expandedId === inquiry.id ? 'up' : 'down'} text-gray-400 transition-transform`}></i>
                                    </div>
                                </div>

                                {expandedId === inquiry.id && (
                                    <div className="px-6 pb-6 pt-2 bg-gray-50 border-t border-gray-100 animate-fadeIn">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{inquiry.content}</p>
                                            {inquiry.fileName && (
                                                <button 
                                                    onClick={(e) => handleDownloadFile(inquiry.id, inquiry.fileName, e)}
                                                    className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition w-fit"
                                                >
                                                    <i className="fas fa-download"></i> {inquiry.fileName}
                                                </button>
                                            )}
                                        </div>

                                        {inquiry.answers && inquiry.answers.length > 0 && (
                                            <div className="mb-6 pl-4 border-l-2 border-blue-200">
                                                <h4 className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">답변 내역</h4>
                                                <div className="space-y-3">
                                                    {inquiry.answers.map((ans) => (
                                                        <div key={ans.id} className="bg-blue-50 p-4 rounded-r-xl rounded-bl-xl text-sm text-gray-700">
                                                            <div className="flex justify-between text-xs text-blue-400 mb-1 font-bold">
                                                                <span>{ans.author?.nickname || '관리자'}</span>
                                                                <span>{new Date(ans.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            {ans.content}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white p-1 rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-sm">
                                            <textarea 
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="여기에 답변 내용을 입력하세요..."
                                                className="w-full p-3 text-sm outline-none resize-none rounded-lg"
                                                rows="4"
                                            ></textarea>
                                            <div className="flex justify-end p-2 bg-gray-50 rounded-b-lg border-t border-gray-100">
                                                <button 
                                                    onClick={() => handleSubmitReply(inquiry.id)}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-black transition disabled:opacity-50"
                                                >
                                                    {isSubmitting ? '등록 중...' : '답변 등록'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                     <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">이전</button>
                    <span className="px-3 py-1 text-xs font-medium text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">다음</button>
                </div>
            )}
            
            {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />}
        </div>
    );
}