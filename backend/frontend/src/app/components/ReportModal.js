"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import apiClient from "@/lib/api";

const reportReasons = [ "욕설/비방/혐오 표현", "광고/상업적 목적", "선정적인 내용", "불법적인 정보", "사기 또는 거짓 정보" ];

export default function ReportModal() {
    const { reportModal, closeReportModal, showAlert } = useUserInteraction();
    const { show, targetUser, context } = reportModal;

    const [selectedReason, setSelectedReason] = useState(reportReasons[0]);
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (show) {
            setSelectedReason(reportReasons[0]);
            setDetails("");
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const reason = `${selectedReason}${details ? `: ${details.trim()}` : ''}`;
        if (!reason) {
            showAlert("신고 사유를 선택해주세요.");
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            await apiClient.post('/reports', {
                reportedUserId: targetUser.id,
                reason,
                details,
                contextType: context?.type,
                contextId: context?.id?.toString(),
            });
            showAlert("신고가 접수되었습니다. 신속하게 처리하겠습니다.");
            closeReportModal();
        } catch (error) {
            console.error("신고 접수 오류:", error);
            showAlert(error.response?.data?.message || "신고 접수 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (!show) return null;

    return (
        <div 
            className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={closeReportModal}
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
                className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">신고하기</h3>
                    <p className="text-sm text-gray-500">
                        <span className="font-bold text-gray-800">'{targetUser?.displayName || targetUser?.nickname}'</span> 님을<br/>신고하는 이유를 알려주세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">신고 사유</label>
                        <div className="relative">
                            <select 
                                value={selectedReason} 
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl appearance-none text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all cursor-pointer"
                            >
                                {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <i className="fas fa-chevron-down text-xs"></i>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">상세 내용 (선택)</label>
                        <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows="3"
                            placeholder="신고 사유에 대해 더 자세히 적어주세요."
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-none transition-all"
                        ></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={closeReportModal} 
                            disabled={isSubmitting} 
                            className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="flex-[2] py-3.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>처리 중...</span>
                                </>
                            ) : (
                                <span>신고 접수</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}