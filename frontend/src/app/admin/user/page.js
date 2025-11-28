"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";

const Toast = ({ message, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    return (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
            <div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                {message}
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-full max-w-sm animate-scale-up">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-xl"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">확인 필요</h3>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-md">확인</button>
            </div>
        </div>
    </div>
);

export default function UserAdminPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('활성');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [toast, setToast] = useState({ show: false, message: "" });
    const [confirmInfo, setConfirmInfo] = useState({ show: false, message: "", onConfirm: null });
    const [now, setNow] = useState(new Date());

    const showToast = (message) => setToast({ show: true, message });

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
            showToast("사용자 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, activeTab]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { setPage(1); }, [activeTab]);

    const handleUnsuspend = (userId, nickname) => {
        setConfirmInfo({
            show: true,
            message: `'${nickname}' 님의 제재를 해제하시겠습니까?`,
            onConfirm: () => executeUnsuspend(userId)
        });
    };

    const executeUnsuspend = async (userId) => {
        try {
            await apiClient.patch(`/users/admin/${userId}/unsuspend`);
            showToast("제재가 해제되었습니다.");
            fetchUsers();
        } catch {
            showToast("오류가 발생했습니다.");
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
        return `${diffDays}일 ${diffHours}시간`;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">사용자 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">전체 사용자 목록 및 제재 현황을 관리합니다.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-xl flex">
                    <button 
                        onClick={() => setActiveTab('활성')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === '활성' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        일반 사용자
                    </button>
                    <button 
                        onClick={() => setActiveTab('정지')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === '정지' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        제재된 사용자
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">이메일 / 닉네임</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">학교</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">가입일</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">권한</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">상태</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">데이터를 불러오는 중...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5} className="p-10 text-center text-gray-400">데이터가 없습니다.</td></tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                                                <i className="fas fa-user"></i>
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{user.nickname}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.university}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : user.role === 'sub_admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {user.role === 'user' ? '일반' : user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {activeTab === '정지' ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded border border-red-100">
                                                    {getSuspensionTimeLeft(user.suspensionEndDate)}
                                                </span>
                                                <button 
                                                    onClick={() => handleUnsuspend(user.id, user.nickname)}
                                                    className="text-xs text-green-600 font-bold hover:underline"
                                                >
                                                    해제
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-green-600 text-xs font-bold flex items-center gap-1">
                                                <i className="fas fa-check-circle"></i> 정상
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">이전</button>
                    <span className="px-3 py-1 text-xs font-medium text-gray-600">{page} / {totalPages}</span>
                    <button onClick={() => setPage(prev => Math.min(totalPages, prev + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50 text-xs font-bold">다음</button>
                </div>
            )}
            
            {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />}
            {confirmInfo.show && <ConfirmModal message={confirmInfo.message} onConfirm={confirmInfo.onConfirm} onCancel={() => setConfirmInfo({ show: false, message: "", onConfirm: null })} />}
        </div>
    );
}