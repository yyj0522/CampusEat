"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import { FaUserEdit, FaKey, FaUniversity, FaSignOutAlt, FaUserSlash, FaChevronRight, FaPen, FaCommentDots, FaStar } from "react-icons/fa";


const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Enter') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4" onClick={onClose}>
             <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp border border-gray-100" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <i className="fas fa-info text-2xl text-blue-500"></i>
                </div>
                <p className="text-gray-800 font-medium text-lg mb-8 break-keep">{message}</p>
                <button onClick={onClose} className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-sm shadow-md hover:bg-gray-800 transition active:scale-95">확인</button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel, isDestructive = false }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200] p-4">
            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp border border-gray-100">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">확인</h3>
                <p className="text-gray-600 font-medium mb-8 break-keep">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition">취소</button>
                    <button onClick={onConfirm} className={`flex-1 text-white py-3.5 rounded-2xl font-bold text-sm transition shadow-md ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-black hover:bg-gray-800'}`}>확인</button>
                </div>
            </div>
        </div>
    );
};

const ChangeNicknameModal = ({ isOpen, onClose, currentNickname, onSave, showAlert }) => {
    const [newNickname, setNewNickname] = useState(currentNickname);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { if (isOpen) setNewNickname(currentNickname); }, [isOpen, currentNickname]);

    const handleSave = async () => {
        if (!newNickname.trim() || newNickname.trim().length < 2) {
            showAlert("닉네임은 2자 이상 입력해주세요.");
            return;
        }
        setIsSaving(true);
        const isSaved = await onSave(newNickname);
        setIsSaving(false);
        if (isSaved) onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleUp border border-gray-100">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">닉네임 변경</h3>
                <input 
                    type="text" 
                    value={newNickname} 
                    onChange={(e) => setNewNickname(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all font-medium mb-6" 
                    placeholder="새 닉네임을 입력하세요" 
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition disabled:opacity-70">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ChangePasswordModal = ({ isOpen, onClose, showAlert, onSave }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert("모든 필드를 입력해주세요."); return;
        }
        if (newPassword !== confirmPassword) {
            showAlert("새 비밀번호가 일치하지 않습니다."); return;
        }
        if (newPassword.length < 4) {
            showAlert("새 비밀번호는 4자 이상이어야 합니다."); return;
        }
        setIsSaving(true);
        const isSaved = await onSave(currentPassword, newPassword);
        setIsSaving(false);
        if (isSaved) onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleUp border border-gray-100">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">비밀번호 변경</h3>
                <div className="space-y-4 mb-8">
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all" placeholder="현재 비밀번호" />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all" placeholder="새 비밀번호 (4자 이상)" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all" placeholder="새 비밀번호 확인" />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                    <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition disabled:opacity-70">
                        {isSaving ? '변경 중...' : '변경하기'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ChangeUniversityModal = ({ isOpen, onClose, onSave, showAlert }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [allUniversities, setAllUniversities] = useState([]);
    const [filteredUniversities, setFilteredUniversities] = useState([]);
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const response = await apiClient.get('/universities');
                let data = [];
                if (Array.isArray(response.data)) {
                    data = response.data.map(item => typeof item === 'object' && item.name ? item.name : item);
                } else if (response.data && Array.isArray(response.data.universities)) {
                    data = response.data.universities.map(item => typeof item === 'object' && item.name ? item.name : item);
                }
                setAllUniversities(data.sort());
            } catch (error) {
                console.error("대학교 목록 로딩 오류:", error);
                showAlert("대학교 목록을 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        if (isOpen) {
            fetchUniversities();
            setSearchTerm("");
            setSelectedUniversity(null);
        }
    }, [isOpen, showAlert]);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setSelectedUniversity(null);

        if (value.trim()) {
            const filtered = allUniversities.filter(uni => 
                uni.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredUniversities(filtered);
        } else {
            setFilteredUniversities([]);
        }
    };

    const handleSelectUniversity = (university) => {
        setSearchTerm(university);
        setSelectedUniversity(university);
        setFilteredUniversities([]);
    };
    
    const handleSave = async () => {
        if (!selectedUniversity || !allUniversities.includes(selectedUniversity)) {
            showAlert("목록에서 대학교를 선택해주세요.");
            return;
        }
        setIsSaving(true);
        await onSave(selectedUniversity);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleUp overflow-visible border border-gray-100">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">대학교 변경</h3>
                <div className="relative mb-8">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-black transition-all"
                        placeholder="대학교 이름을 검색하세요"
                        disabled={isLoading}
                    />
                    {searchTerm && filteredUniversities.length > 0 && !selectedUniversity && (
                        <div className="absolute z-[9999] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
                            {filteredUniversities.map(uni => (
                                <div
                                    key={uni}
                                    onClick={() => handleSelectUniversity(uni)}
                                    className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none"
                                >
                                    {uni}
                                </div>
                            ))}
                        </div>
                    )}
                    {searchTerm && filteredUniversities.length === 0 && !selectedUniversity && (
                         <div className="absolute z-[9999] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-3 text-center text-sm text-gray-500">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                    <button onClick={handleSave} disabled={isSaving || !selectedUniversity} className="flex-[2] py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition disabled:opacity-70">
                        {isSaving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteAccountModal = ({ isOpen, onClose, onDelete }) => {
    const [confirmationText, setConfirmationText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const requiredText = "네 회원탈퇴하겠습니다.";
    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-scaleUp border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                    </div>
                    <h3 className="text-xl font-extrabold text-red-600">회원 탈퇴</h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-gray-600 leading-relaxed">
                    <p className="font-bold mb-2 text-gray-800">다음 데이터가 모두 삭제되며 복구할 수 없습니다.</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                        <li>계정 정보 (닉네임, 이메일 등)</li>
                        <li>작성한 모든 게시글 및 댓글</li>
                        <li>활동 내역 및 포인트</li>
                    </ul>
                </div>

                <p className="text-sm text-gray-600 mb-3 text-center">
                    탈퇴를 원하시면, 아래 입력창에 <strong className="text-gray-900 select-all">"{requiredText}"</strong>를 정확히 입력해주세요.
                </p>
                <input 
                    type="text" 
                    value={confirmationText} 
                    onChange={(e) => setConfirmationText(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all mb-8 text-center font-bold" 
                    placeholder={requiredText}
                />

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                    <button onClick={handleDelete} disabled={confirmationText !== requiredText || isDeleting} className="flex-[2] py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                        {isDeleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActivityFeed = ({ filter, data, isLoading, router }) => {
    const ITEMS_PER_PAGE = 5; 
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p>활동 내역을 불러오는 중...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <i className="far fa-folder-open text-4xl mb-3 opacity-50"></i>
                <p>활동 내역이 없습니다.</p>
            </div>
        );
    }

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = data.slice(startIndex, endIndex);

    const handlePrev = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
    const handleNext = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };

    const renderItem = (item) => {
        switch (filter) {
            case "my-posts":
                return (
                    <div
                        className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                        onClick={() => router.push(`/community/${item.id}`)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold">게시글</span>
                            <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{item.content}</p>
                    </div>
                );

            case "my-comments":
                return (
                    <div
                        className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                        onClick={() => router.push(`/community/${item.post?.id}`)}
                    >
                         <div className="flex justify-between items-start mb-2">
                            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold">댓글</span>
                            <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p className="text-gray-800 text-sm mb-3 line-clamp-2 leading-relaxed font-medium">“{item.content}”</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            <span className="font-bold text-gray-400 shrink-0">원문</span>
                            <span className="truncate">{item.post?.title || "삭제된 게시글"}</span>
                        </div>
                    </div>
                );

            case "my-reviews":
                return (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold">리뷰</span>
                                <span className="font-bold text-gray-800 text-sm">{item.restaurant?.name || "알 수 없음"}</span>
                            </div>
                            <div className="flex items-center gap-0.5 text-xs">
                                <i className="fas fa-star text-yellow-400"></i>
                                <span className="font-bold text-gray-700">{item.rating}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2">{item.content}</p>
                        <p className="text-xs text-gray-400 text-right">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-4 animate-fadeIn">
            {currentItems.map((item) => (
                <div key={item.id}>{renderItem(item)}</div>
            ))}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${currentPage === 1 ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm"}`}
                    >
                        <i className="fas fa-chevron-left text-xs"></i>
                    </button>
                    <span className="text-gray-600 text-sm font-medium font-mono">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition ${currentPage === totalPages ? "text-gray-300 border-gray-200 cursor-not-allowed" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-sm"}`}
                    >
                        <i className="fas fa-chevron-right text-xs"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [activityFilter, setActivityFilter] = useState('my-posts');
    const [activityData, setActivityData] = useState([]);
    const [isActivityLoading, setIsActivityLoading] = useState(true);

    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUniversityModal, setShowUniversityModal] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const showAlert = (message) => setAlertInfo({ show: true, message });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setIsActivityLoading(true);
            setActivityData([]);
            try {
                let response;
                if (activityFilter === 'my-posts') {
                    response = await apiClient.get('/users/me/posts');
                } else if (activityFilter === 'my-comments') {
                    response = await apiClient.get('/users/me/comments');
                } else if (activityFilter === 'my-reviews') {
                    response = await apiClient.get('/users/me/reviews');
                }
                setActivityData(response.data);
            } catch (error) {
                console.error("활동 데이터 로드 오류:", error);
                showAlert("데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setIsActivityLoading(false);
            }
        };
        fetchData();
    }, [user, activityFilter]);

    const handleLogout = () => setShowLogoutConfirm(true);
    const executeLogout = () => { logout(); setShowLogoutConfirm(false); };

    const handleUpdateNickname = async (newNickname) => {
        if (newNickname === user?.nickname) {
            showAlert("현재 닉네임과 동일합니다.");
            return false;
        }
        try {
            await apiClient.patch('/users/profile', { nickname: newNickname });
            showAlert("닉네임이 변경되었습니다. 변경사항은 새로고침 시 적용됩니다.");
            return true;
        } catch (error) {
            showAlert(error.response?.data?.message || "닉네임 변경 중 오류가 발생했습니다.");
            return false;
        }
    };
    
    const handleUpdatePassword = async (currentPassword, newPassword) => {
        try {
            await apiClient.patch('/users/password', { currentPassword, newPassword });
            showAlert("비밀번호가 성공적으로 변경되었습니다.");
            return true;
        } catch (error) {
            showAlert(error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다.");
            return false;
        }
    };

    const handleUpdateUniversity = async (newUniversity) => {
        try {
            await apiClient.patch('/users/profile', { university: newUniversity });
            showAlert("대학교 정보가 성공적으로 변경되었습니다. 페이지를 새로고침합니다.");
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            showAlert(error.response?.data?.message || "대학교 변경 중 오류가 발생했습니다.");
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            await apiClient.delete('/users/me');
            showAlert("회원 탈퇴 처리가 완료되었습니다. 이용해주셔서 감사합니다.");
            logout(); 
        } catch (error) {
            showAlert("회원 탈퇴 중 오류가 발생했습니다.");
        }
    };

    const activityTags = [
        { key: 'my-posts', label: '작성한 글', icon: <FaPen /> },
        { key: 'my-comments', label: '작성한 댓글', icon: <FaCommentDots /> },
        { key: 'my-reviews', label: '맛집 리뷰', icon: <FaStar /> },
    ];

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }
    
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
            `}</style>
            
            <main className="max-w-5xl mx-auto py-12 px-4 animate-fadeIn">
                {/* Profile Header Card */}
                <section className="bg-white rounded-3xl shadow-xl overflow-visible mb-8">
                    <div className="h-32 bg-gradient-to-r from-violet-600 to-fuchsia-600 relative rounded-t-3xl md:hidden"></div>
                    <div className="px-8 py-8">
                        <div className="flex flex-col md:flex-row items-center gap-6 md:items-center">
                            <div className="relative -mt-16 md:mt-0">
                                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-lg p-1">
                                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                        <i className="fas fa-user text-5xl"></i>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <span className="absolute bottom-1 right-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border-2 border-white">ADMIN</span>
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{user.nickname}</h1>
                                <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
                                    <i className="fas fa-university text-gray-400"></i> {user.university}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{user.universityEmail || user.email}</p>
                            </div>
                            <div className="flex gap-2">
                                {isAdmin && (
                                    <button
                                        onClick={() => router.push('/admin/timetable')}
                                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-md flex items-center gap-2"
                                    >
                                        <i className="fas fa-cog"></i> 관리자 페이지
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Activity Feed Section */}
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-extrabold text-gray-900">나의 활동</h2>
                        </div>
                        
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full md:w-auto overflow-x-auto">
                             {activityTags.map(tag => (
                                <button
                                    key={tag.key}
                                    onClick={() => setActivityFilter(tag.key)}
                                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activityFilter === tag.key ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    {tag.icon} {tag.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[300px]">
                            <ActivityFeed filter={activityFilter} data={activityData} isLoading={isActivityLoading} router={router} />
                        </div>
                    </section>

                    {/* Settings Sidebar */}
                    <aside className="space-y-6">
                        <h2 className="text-xl font-extrabold text-gray-900">계정 설정</h2>
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden p-4 space-y-2">
                            <button 
                                onClick={() => setShowNicknameModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition">
                                        <FaUserEdit />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">닉네임 변경</span>
                                        <span className="block text-xs text-gray-500">활동명을 수정합니다</span>
                                    </div>
                                </div>
                                <FaChevronRight className="text-gray-300 group-hover:text-gray-500" />
                            </button>

                            <button 
                                onClick={() => setShowPasswordModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition">
                                        <FaKey />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-800">비밀번호 변경</span>
                                        <span className="block text-xs text-gray-500">보안을 위해 주기적으로 변경하세요</span>
                                    </div>
                                </div>
                                <FaChevronRight className="text-gray-300 group-hover:text-gray-500" />
                            </button>

                            {isAdmin && (
                                <button 
                                    onClick={() => setShowUniversityModal(true)} 
                                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition">
                                            <FaUniversity />
                                        </div>
                                        <div>
                                            <span className="block text-sm font-bold text-gray-800">대학교 변경</span>
                                            <span className="block text-xs text-gray-500">관리자 전용 기능입니다</span>
                                        </div>
                                    </div>
                                    <FaChevronRight className="text-gray-300 group-hover:text-gray-500" />
                                </button>
                            )}

                            <div className="my-2 border-t border-gray-100"></div>

                            <button 
                                onClick={handleLogout} 
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-500 transition">
                                        <FaSignOutAlt />
                                    </div>
                                    <span className="block text-sm font-bold text-gray-600 group-hover:text-red-600">로그아웃</span>
                                </div>
                            </button>

                            <button 
                                onClick={() => setShowDeleteModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-red-50 transition group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-500 transition">
                                        <FaUserSlash />
                                    </div>
                                    <span className="block text-sm font-bold text-gray-600 group-hover:text-red-600">회원 탈퇴</span>
                                </div>
                            </button>
                        </div>
                    </aside>
                </div>

                {/* Modals */}
                <ChangeNicknameModal
                    isOpen={showNicknameModal}
                    onClose={() => setShowNicknameModal(false)}
                    currentNickname={user.nickname}
                    onSave={handleUpdateNickname}
                    showAlert={showAlert}
                />
                <ChangePasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    showAlert={showAlert}
                    onSave={handleUpdatePassword}
                />
                <ChangeUniversityModal
                    isOpen={showUniversityModal}
                    onClose={() => setShowUniversityModal(false)}
                    onSave={handleUpdateUniversity}
                    showAlert={showAlert}
                />
                <DeleteAccountModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onDelete={handleDeleteAccount}
                />
                {alertInfo.show && <AlertModal message={alertInfo.message} onClose={() => setAlertInfo({ show: false, message: "" })} />}
                {showLogoutConfirm && <ConfirmModal message="정말 로그아웃 하시겠습니까?" onConfirm={executeLogout} onCancel={() => setShowLogoutConfirm(false)} />}
            </main>
        </div>
    );
}