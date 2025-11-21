"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";

const Toast = ({ message, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"><i className="fas fa-info-circle"></i>{message}</div></div>;
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-full max-w-sm animate-scale-up">
            <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-question text-xl"></i></div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">확인</h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-md">확인</button>
            </div>
        </div>
    </div>
);

const BanUserModal = ({ isOpen, onClose, onConfirm, targetUser }) => {
    const [days, setDays] = useState(1);
    useEffect(() => { if (isOpen) setDays(1); }, [isOpen]);
    if (!isOpen || !targetUser) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm animate-scale-up">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i className="fas fa-ban text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900">이용 제한</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        <span className="font-bold text-gray-800">{targetUser.nickname}</span> 님을 제재합니다.
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">기간 선택</label>
                    <select value={days} onChange={(e) => setDays(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium bg-gray-50">
                        <option value={1}>1일 정지</option>
                        <option value={3}>3일 정지</option>
                        <option value={7}>7일 정지</option>
                        <option value={30}>30일 정지</option>
                        <option value={-1}>영구 정지</option>
                    </select>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50">취소</button>
                    <button onClick={() => onConfirm(targetUser.id, Number(days))} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-md">적용</button>
                </div>
            </div>
        </div>
    );
};

export default function ReportAdminPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState({ show: false, message: "" });
    const [confirmInfo, setConfirmInfo] = useState({ show: false, message: "", onConfirm: null });
    const [banModal, setBanModal] = useState({ isOpen: false, user: null });

    const showToast = (message) => setToast({ show: true, message });

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/reports', {
                params: { page, limit: 10, status: activeTab }
            });
            setReports(response.data.data);
            setTotalPages(response.data.meta.lastPage);
        } catch (error) {
            console.error("신고 목록 로드 실패:", error);
            showToast("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => { fetchReports(); }, [fetchReports]);
    useEffect(() => { setPage(1); }, [activeTab]);

    const handleStatusUpdate = (reportId, newStatus) => {
        setConfirmInfo({
            show: true,
            message: "신고 상태를 '처리 완료'로 변경하시겠습니까?",
            onConfirm: () => executeStatusUpdate(reportId, newStatus)
        });
    };
    
    const executeStatusUpdate = async (reportId, newStatus) => {
        try {
            await apiClient.patch(`/reports/${reportId}/status`, { status: newStatus });
            showToast("처리 상태가 변경되었습니다.");
            fetchReports();
        } catch (error) {
            showToast("오류가 발생했습니다.");
        } finally {
            setConfirmInfo({ show: false, message: "", onConfirm: null });
        }
    };

    const handleBanUser = async (userId, days) => {
        try {
            await apiClient.post('/users/admin/suspend', { userId, days });
            showToast("이용 제한이 적용되었습니다.");
            setBanModal({ isOpen: false, user: null });
        } catch (error) {
            showToast("제재 적용 중 오류가 발생했습니다.");
        }
    };

    const getTargetInfo = (report) => {
        if (report.reportedUser) return `사용자: ${report.reportedUser.nickname}`;
        if (report.reportedRestaurant) return `맛집: ${report.reportedRestaurant.name}`;
        if (report.contextType === 'post') return `게시글 ID: ${report.contextId}`;
        if (report.contextType === 'gathering') return `모임 ID: ${report.contextId}`;
        return "알 수 없음";
    };

    return (
        <div className="space-y-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">신고 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">접수된 신고 내역을 확인하고 처리합니다.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'pending' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>대기중</button>
                    <button onClick={() => setActiveTab('resolved')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'resolved' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>처리완료</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">로딩 중...</div>
                ) : reports.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
                        <i className="far fa-check-circle text-4xl mb-3 opacity-30"></i>
                        <p>신고 내역이 없습니다.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 text-[10px] font-bold text-white bg-gray-800 rounded-full uppercase">
                                        {report.contextType || 'ETC'}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{new Date(report.createdAt).toLocaleString()}</span>
                                </div>
                                {activeTab === 'pending' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusUpdate(report.id, 'resolved')} className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition">완료 처리</button>
                                        {report.reportedUser && (
                                            <button onClick={() => setBanModal({ isOpen: true, user: report.reportedUser })} className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition">제재</button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">완료됨</span>
                                )}
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{report.reason}</h3>
                            <p className="text-gray-600 text-sm mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                {report.details || "상세 내용 없음"}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-bullseye text-gray-400"></i>
                                    <span className="font-bold">대상:</span>
                                    <span>{getTargetInfo(report)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <i className="fas fa-user-tag text-gray-400"></i>
                                    <span className="font-bold">신고자:</span>
                                    <span>{report.reporter?.nickname || '익명'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                     <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">이전</button>
                    <span className="px-3 py-1 text-xs font-medium text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">다음</button>
                </div>
            )}

            <BanUserModal isOpen={banModal.isOpen} targetUser={banModal.user} onClose={() => setBanModal({ isOpen: false, user: null })} onConfirm={handleBanUser} />
            {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />}
            {confirmInfo.show && <ConfirmModal message={confirmInfo.message} onConfirm={confirmInfo.onConfirm} onCancel={() => setConfirmInfo({ show: false, message: "", onConfirm: null })} />}
        </div>
    );
}