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

const ConfirmModal = ({ message, onConfirm, onCancel, confirmText = "확인" }) => {
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
                    <button onClick={onConfirm} className="px-4 py-2 w-full bg-green-600 text-white rounded-lg hover:bg-green-700">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function UserAdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('활성');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });
    const [confirmInfo, setConfirmInfo] = useState({ show: false, message: "", onConfirm: null });
    const [now, setNow] = useState(new Date());

    const showAlert = (message) => setAlertInfo({ show: true, message });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users/admin', {
                params: { page, limit: 10, status: activeTab }
            });
            setUsers(response.data.data);
            setTotalPages(response.data.meta.lastPage);
        } catch (error) {
            console.error("사용자 목록 로드 실패:", error);
            showAlert("사용자 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    const handleUnsuspend = (userId, nickname) => {
        setConfirmInfo({
            show: true,
            message: `[${nickname}] 사용자의 제재를 해제하시겠습니까?`,
            onConfirm: () => executeUnsuspend(userId)
        });
    };

    const executeUnsuspend = async (userId) => {
        try {
            await apiClient.patch(`/users/admin/${userId}/unsuspend`);
            showAlert("사용자 제재가 해제되었습니다.");
            fetchUsers();
        } catch (error) {
            console.error("제재 해제 실패:", error);
            showAlert("제재 해제 중 오류가 발생했습니다.");
        } finally {
            setConfirmInfo({ show: false, message: "", onConfirm: null });
        }
    };

    const getSuspensionTimeLeft = (endDate) => {
        if (!endDate) return "영구 정지";
        const end = new Date(endDate);
        const diffMs = end.getTime() - now.getTime();
        if (diffMs <= 0) return "만료됨";

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        
        return `${diffDays}일 ${diffHours}시간 남음`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">사용자 관리</h2>
                <div className="bg-white rounded-lg border p-1 flex">
                    <button 
                        onClick={() => setActiveTab('활성')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === '활성' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        일반 사용자
                    </button>
                    <button 
                        onClick={() => setActiveTab('정지')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === '정지' ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        제재된 사용자
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">이메일</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">닉네임</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">대학교</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">가입일</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">권한</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">제재 관리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">로딩 중...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">해당 상태의 사용자가 없습니다.</td></tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.nickname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.university}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`font-bold ${user.role === 'super_admin' ? 'text-red-600' : (user.role === 'sub_admin' ? 'text-blue-600' : 'text-gray-500')}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {activeTab === '정지' && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-500 font-medium">
                                                        {getSuspensionTimeLeft(user.suspensionEndDate)}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleUnsuspend(user.id, user.nickname)}
                                                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                                    >
                                                        제재 해제
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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