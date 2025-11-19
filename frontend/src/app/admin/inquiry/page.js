"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";
import '../../styles/style.css';

const AlertModal = ({ message, onClose }) => {
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
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full hover:bg-blue-700 transition">확인</button>
            </div>
        </div>
    );
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
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });

    const showAlert = (message) => setAlertInfo({ show: true, message });

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
            showAlert("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => {
        fetchInquiries();
    }, [fetchInquiries]);

    useEffect(() => {
        setPage(1);
        setExpandedId(null);
    }, [activeTab]);

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
        } catch (error) {
            console.error("파일 다운로드 오류:", error);
            showAlert("파일을 다운로드할 수 없습니다.");
        }
    };

    const handleSubmitReply = async (inquiryId) => {
        if (!replyContent.trim()) {
            showAlert("답변 내용을 입력해주세요.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await apiClient.post(`/inquiries/${inquiryId}/answers`, { content: replyContent });
            showAlert("답변이 등록되었습니다.");
            setExpandedId(null);
            fetchInquiries();
        } catch (error) {
            console.error("답변 등록 실패:", error);
            showAlert("답변 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">1:1 문의 관리</h2>
                <div className="bg-white rounded-lg border p-1 flex">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'pending' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        처리 대기
                    </button>
                    <button 
                        onClick={() => setActiveTab('answered')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'answered' ? 'bg-green-50 text-green-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        처리 완료
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : inquiries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">문의 내역이 없습니다.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {inquiries.map((inquiry) => (
                            <div key={inquiry.id} className="transition">
                                <div 
                                    onClick={() => toggleExpand(inquiry.id)}
                                    className={`p-6 cursor-pointer flex justify-between items-center hover:bg-gray-50 ${expandedId === inquiry.id ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${inquiry.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {inquiry.status === 'answered' ? '완료' : '대기'}
                                            </span>
                                            <h3 className="font-bold text-gray-800">{inquiry.title}</h3>
                                            {inquiry.fileName && (
                                                <span className="text-xs text-gray-400 flex items-center">
                                                    <i className="fas fa-paperclip mr-1"></i>파일첨부
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            작성자: {inquiry.author?.nickname} ({inquiry.replyEmail}) | {new Date(inquiry.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <i className={`fas fa-chevron-${expandedId === inquiry.id ? 'up' : 'down'} text-gray-400`}></i>
                                    </div>
                                </div>

                                {expandedId === inquiry.id && (
                                    <div className="p-6 bg-gray-50 border-t border-gray-100 animate-fadeIn">
                                        <div className="mb-6">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">문의 내용</h4>
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-wrap">
                                                {inquiry.content}
                                            </div>
                                            {inquiry.fileName && (
                                                <div className="mt-2">
                                                    <button 
                                                        onClick={(e) => handleDownloadFile(inquiry.id, inquiry.fileName, e)}
                                                        className="text-sm text-blue-600 hover:underline flex items-center"
                                                    >
                                                        <i className="fas fa-download mr-2"></i>
                                                        첨부파일: {inquiry.fileName}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {inquiry.answers && inquiry.answers.length > 0 && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-bold text-gray-700 mb-2">등록된 답변</h4>
                                                <div className="space-y-3">
                                                    {inquiry.answers.map((ans) => (
                                                        <div key={ans.id} className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                                            <div className="flex justify-between text-xs text-blue-800 mb-1">
                                                                <span className="font-semibold">{ans.author?.nickname || '관리자'}</span>
                                                                <span>{new Date(ans.createdAt).toLocaleString()}</span>
                                                            </div>
                                                            <p className="text-gray-800 whitespace-pre-wrap">{ans.content}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">답변 작성</h4>
                                            <textarea 
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder="답변 내용을 입력하세요..."
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                                            ></textarea>
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={() => handleSubmitReply(inquiry.id)}
                                                    disabled={isSubmitting}
                                                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
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
                <div className="flex justify-center gap-2 mt-4">
                    <button 
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        이전
                    </button>
                    <span className="px-3 py-1 text-gray-600">{page} / {totalPages}</span>
                    <button 
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        다음
                    </button>
                </div>
            )}
            
            {alertInfo.show && (
                <AlertModal 
                    message={alertInfo.message} 
                    onClose={() => setAlertInfo({ show: false, message: "" })} 
                />
            )}
        </div>
    );
}