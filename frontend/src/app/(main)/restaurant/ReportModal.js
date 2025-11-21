"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";

export default function ReportModal({ isOpen, onClose, restaurant, onShowAlert }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('nonexistent');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reportReasons = { nonexistent: '지금은 존재하지 않는 음식점이에요.', incorrect: '정보가 실제와 달라요.', far: '학교와 거리가 너무 멀어요.', direct: '기타 사유를 직접 작성할게요.' };
  
  useEffect(() => {
    if (!isOpen) { 
      setReason('nonexistent');
      setCustomReason('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (isSubmitting || !user || !restaurant) return;

    const selectedReason = reportReasons[reason]; 
    const detailsText = customReason.trim(); 

    const finalReasonForServer = reason === 'direct' ? detailsText : selectedReason;
    const finalDetailsForServer = reason === 'direct' ? detailsText : selectedReason;

    if (!finalReasonForServer || (reason === 'direct' && detailsText.length < 5)) {
      onShowAlert('신고 내용을 5자 이상 입력하거나, 목록에서 사유를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/reports', {
        reportedRestaurantId: restaurant.id, 
        reason: finalReasonForServer, 
        details: finalDetailsForServer, 
        contextType: 'restaurant',
        contextId: restaurant.id.toString(),
      });
      
      onShowAlert("신고가 성공적으로 접수되었습니다.");
      onClose();
    } catch (error) {
      console.error('신고 접수 오류:', error);
      const errorMessage = error.response?.data?.message || '신고 접수 중 오류가 발생했습니다.';
      onShowAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !restaurant) return null; 

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">신고하기</h3>
                <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-800">'{restaurant.name}'</span>에 대한<br/>신고 사유를 알려주세요.
                </p>
            </div>
            
            <form onSubmit={handleSubmitReport} className="px-6 pb-6 space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">신고 사유</label>
                    <div className="relative">
                        <select 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)} 
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl appearance-none text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all cursor-pointer"
                        >
                            {Object.entries(reportReasons).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <i className="fas fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>
                
                {reason === 'direct' && (
                    <div className="space-y-2 animate-fadeIn">
                         <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">상세 내용</label>
                         <textarea 
                            value={customReason} 
                            onChange={(e) => setCustomReason(e.target.value)} 
                            rows="3" 
                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 resize-none transition-all" 
                            placeholder="신고 사유를 자세히 적어주세요. (최소 5자)"
                        ></textarea>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition" disabled={isSubmitting}>취소</button>
                    <button type="submit" className="flex-[2] py-3.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition disabled:opacity-70 flex items-center justify-center gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>처리 중...</span>
                            </>
                        ) : <span>접수하기</span>}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}