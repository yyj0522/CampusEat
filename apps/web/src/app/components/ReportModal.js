"use client";

import { useState } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { db } from "../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ReportModal() {
    const { showReportModal, setShowReportModal, contextMenu } = useUserInteraction();
    const { user } = useAuth(); // 신고자 정보
    const [reason, setReason] = useState("");
    const [details, setDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) {
            alert("신고 사유를 선택해주세요.");
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "reports"), {
                reporterId: user.uid,
                
                reportedUserId: contextMenu.targetUser.id,
                reportedUserNickname: contextMenu.targetUser.nickname,
                
                reason,
                details,
                
                contextType: contextMenu.context?.type, // 'post', 'comment' 등
                contextId: contextMenu.context?.id,     // 게시글 또는 댓글의 ID
                
                createdAt: serverTimestamp(),
                status: "pending", // 'pending', 'resolved'
            });
            alert("신고가 접수되었습니다. 신속하게 처리하겠습니다.");
            handleClose();
        } catch (error) {
            console.error("신고 접수 오류:", error);
            alert("신고 접수 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason("");
        setDetails("");
        setShowReportModal(false);
    };

    if (!showReportModal) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
                <h3 className="text-xl font-bold mb-4">사용자 신고하기</h3>
                <p className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold">{contextMenu.targetUser?.nickname}</span>님을 신고하는 이유를 선택해주세요.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <select 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">-- 사유 선택 --</option>
                            <option value="spam">광고/스팸</option>
                            <option value="abuse">욕설/비방</option>
                            <option value="inappropriate">부적절한 콘텐츠</option>
                            <option value="other">기타</option>
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
                        <button type="button" onClick={handleClose} disabled={isSubmitting} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">{isSubmitting ? "접수 중..." : "신고 접수"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}