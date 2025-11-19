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
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">사용자 신고하기</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">{targetUser?.displayName || targetUser?.nickname}</span>님을 신고하는 이유를 선택해주세요.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <select 
                            value={selectedReason} 
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            {reportReasons.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <textarea 
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows="4"
                            placeholder="상세한 내용을 입력해주시면 처리에 도움이 됩니다."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={closeReportModal} disabled={isSubmitting} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{isSubmitting ? "접수 중..." : "신고 접수"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}