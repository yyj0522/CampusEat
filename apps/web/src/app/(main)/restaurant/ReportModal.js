"use client";

import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";

export default function ReportModal({ isOpen, onClose, restaurant, user, onShowAlert }) {
    const [reason, setReason] = useState('direct');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportReasons = { direct: '직접 작성할게요.', nonexistent: '지금은 존재하지 않는 음식점이에요.', incorrect: '정보가 실제와 달라요.', far: '학교와 거리가 너무 멀어요.' };

    useEffect(() => {
        if (!isOpen) {
            setReason('direct');
            setCustomReason('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (isSubmitting || !user) return;

        const finalReason = reason === 'direct' ? customReason.trim() : reportReasons[reason];
        if (!finalReason) {
            onShowAlert('신고 사유를 입력하거나 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const reportColRef = collection(db, "newUniversities", user.university, "newRestaurants", restaurant.id, "reports");
            await addDoc(reportColRef, {
                reporterId: user.uid,
                reporterNickname: user.nickname,
                reason: finalReason,
                createdAt: serverTimestamp(),
            });

            const restaurantDocRef = doc(db, "newUniversities", user.university, "newRestaurants", restaurant.id);
            await updateDoc(restaurantDocRef, { reportCount: increment(1) });

            onShowAlert('신고가 성공적으로 접수되었습니다.');
            onClose();
        } catch (error) {
            console.error('신고 접수 오류:', error);
            onShowAlert('신고 접수 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{restaurant?.name} 신고하기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 사유</label>
                        <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border p-2 rounded-lg">
                            {Object.entries(reportReasons).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                        </select>
                    </div>
                    {reason === 'direct' && (
                        <div>
                            <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 내용 작성</label>
                            <textarea id="custom-reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="신고 사유를 자세히 적어주세요."></textarea>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled={isSubmitting}>취소</button>
                        <button id="submit-report-button" type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" disabled={isSubmitting}>
                            {isSubmitting ? '접수 중...' : '접수하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}