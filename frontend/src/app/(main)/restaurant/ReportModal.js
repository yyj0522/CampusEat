"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";

function AlertModal({ message, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
        <p className="text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default function ReportModal({ isOpen, onClose, restaurant }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('nonexistent');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "" });
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
      setAlert({ show: true, message: '신고 내용을 5자 이상 입력하거나, 목록에서 사유를 선택해주세요.'});
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
      
      setAlert({ show: true, message: "신고가 성공적으로 접수되었습니다." });
    } catch (error) {
      console.error('신고 접수 오류:', error);
      const errorMessage = error.response?.data?.message || '신고 접수 중 오류가 발생했습니다. (백엔드 DTO 확인 필요)';
      setAlert({ show: true, message: errorMessage});
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    onClose(); 
  };

  const handleAlertClose = () => {
    if (alert.message.includes("접수")) {
      handleClose();
    }
    setAlert({ show: false, message: "" });
  };

  if (!isOpen || !restaurant) return null; 

  return (
    <>
      <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">{restaurant.name} 신고하기</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">&times;</button>
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
                <textarea id="custom-reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="신고 사유를 자세히 적어주세요. (최소 5자)"></textarea>
              </div>
            )}
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled={isSubmitting}>취소</button>
              <button id="submit-report-button" type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" disabled={isSubmitting}>
                {isSubmitting ? '접수 중...' : '접수하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {alert.show && <AlertModal message={alert.message} onClose={handleAlertClose} />}
    </>
  );
}