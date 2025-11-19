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

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onConfirm]);

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-[60]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm animate-fadeIn">
                <p className="text-lg mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="px-4 py-2 w-full border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700">확인</button>
                </div>
            </div>
        </div>
    );
};

const BanUserModal = ({ isOpen, onClose, onConfirm, targetUser }) => {
    const [days, setDays] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setDays(1);
        }
    }, [isOpen]);

    if (!isOpen || !targetUser) return null;

    const handleConfirm = () => {
        onConfirm(targetUser.id, Number(days));
    };

    return (
        <div 
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm animate-fadeIn">
                <h3 className="text-xl font-bold text-red-600 mb-2">사용자 이용 제한</h3>
                <p className="text-gray-600 mb-4">
                    <span className="font-semibold text-gray-800">{targetUser.nickname}</span>님을 제재하시겠습니까?
                </p>
                
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">제한 기간 선택</label>
                    <select 
                        value={days} 
                        onChange={(e) => setDays(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    >
                        <option value={1}>1일 정지</option>
                        <option value={3}>3일 정지</option>
                        <option value={7}>7일 정지</option>
                        <option value={30}>30일 정지</option>
                        <option value={-1}>영구 정지</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">적용하기</button>
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
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });
    const [confirmInfo, setConfirmInfo] = useState({ show: false, message: "", onConfirm: null });
    const [banModal, setBanModal] = useState({ isOpen: false, user: null });

    const showAlert = (message) => setAlertInfo({ show: true, message });

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
            showAlert("데이터를 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

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
            showAlert("상태가 변경되었습니다.");
            fetchReports();
        } catch (error) {
            console.error("상태 변경 실패:", error);
            showAlert("처리 중 오류가 발생했습니다.");
        } finally {
            setConfirmInfo({ show: false, message: "", onConfirm: null });
        }
    };

    const handleBanUser = async (userId, days) => {
        try {
            await apiClient.post('/users/admin/suspend', { userId, days });
            showAlert("이용 제한이 적용되었습니다.");
            setBanModal({ isOpen: false, user: null });
        } catch (error) {
            console.error("제재 적용 실패:", error);
            showAlert("제재 적용 중 오류가 발생했습니다.");
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">신고 내역 관리</h2>
                <div className="bg-white rounded-lg border p-1 flex">
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'pending' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        처리 대기
                    </button>
                    <button 
                        onClick={() => setActiveTab('resolved')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'resolved' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        처리 완료
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">로딩 중...</div>
                ) : reports.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">신고 내역이 없습니다.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reports.map((report) => (
                            <div key={report.id} className="p-6 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-gray-500 rounded mr-2">
                                            {report.contextType?.toUpperCase() || 'ETC'}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {new Date(report.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {activeTab === 'pending' && (
                                            <button 
                                                onClick={() => handleStatusUpdate(report.id, 'resolved')}
                                                className="px-3 py-1 text-xs border border-blue-200 text-blue-600 rounded hover:bg-blue-50"
                                            >
                                                처리 완료
                                            </button>
                                        )}
                                        {report.reportedUser && (
                                            <button 
                                                onClick={() => setBanModal({ isOpen: true, user: report.reportedUser })}
                                                className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 font-semibold"
                                            >
                                                제재 적용
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{report.reason}</h3>
                                <p className="text-gray-600 text-sm mb-4">{report.details}</p>
                                
                                <div className="flex gap-6 text-sm bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <span className="font-semibold text-gray-500 mr-2">신고 대상:</span>
                                        <span className="text-gray-800">{getTargetInfo(report)}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold text-gray-500 mr-2">신고자:</span>
                                        <span className="text-gray-800">{report.reporter?.nickname || '알 수 없음'}</span>
                                    </div>
                                </div>
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

            <BanUserModal 
                isOpen={banModal.isOpen} 
                targetUser={banModal.user} 
                onClose={() => setBanModal({ isOpen: false, user: null })}
                onConfirm={handleBanUser}
            />
            
            {alertInfo.show && (
                <AlertModal 
                    message={alertInfo.message} 
                    onClose={() => setAlertInfo({ show: false, message: "" })} 
                />
            )}

            {confirmInfo.show && (
                <ConfirmModal 
                    message={confirmInfo.message} 
                    onConfirm={confirmInfo.onConfirm}
                    onCancel={() => setConfirmInfo({ show: false, message: "", onConfirm: null })}
                />
            )}
        </div>
    );
}