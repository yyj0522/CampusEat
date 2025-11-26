"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import { FaUserEdit, FaKey, FaUniversity, FaSignOutAlt, FaUserSlash, FaChevronRight, FaPen, FaCommentDots, FaStar, FaExclamationTriangle, FaCog } from "react-icons/fa";

const ModalOverlay = ({ children, onClose }) => (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
    >
        <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
            {children}
        </div>
    </div>
);

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Enter') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center animate-scaleUp border border-gray-100 transform transition-all">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <i className="fas fa-info text-2xl text-blue-500"></i>
                </div>
                <p className="text-gray-800 font-bold text-lg mb-8 break-keep leading-relaxed">{message}</p>
                <button 
                    onClick={onClose} 
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-black transition-all active:scale-[0.98]"
                >
                    확인
                </button>
            </div>
        </ModalOverlay>
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
        <ModalOverlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scaleUp border border-gray-100">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">닉네임 변경</h3>
                <p className="text-gray-500 text-sm mb-8">새로운 닉네임을 입력해주세요.</p>
                
                <input 
                    type="text" 
                    value={newNickname} 
                    onChange={(e) => setNewNickname(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-base font-medium focus:bg-white focus:border-blue-500 focus:outline-none transition-all mb-8 placeholder-gray-400" 
                    placeholder="새 닉네임 입력" 
                    autoFocus
                />
                
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-colors">취소</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isSaving ? '저장 중...' : '변경하기'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
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
        if (isSaved) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        }
    };

    if (!isOpen) return null;
    return (
        <ModalOverlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scaleUp border border-gray-100">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">비밀번호 변경</h3>
                <p className="text-gray-500 text-sm mb-8">안전한 비밀번호로 변경해주세요.</p>

                <div className="space-y-4 mb-8">
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all" placeholder="현재 비밀번호" />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all" placeholder="새 비밀번호 (4자 이상)" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-purple-500 focus:outline-none transition-all" placeholder="새 비밀번호 확인" />
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-colors">취소</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isSaving ? '변경 중...' : '변경하기'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
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
        <ModalOverlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scaleUp border border-gray-100 overflow-visible">
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">대학교 변경</h3>
                <p className="text-gray-500 text-sm mb-8">새로운 소속 대학교를 검색하세요.</p>

                <div className="relative mb-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-gray-400"></i>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-11 p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-base font-medium focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                        placeholder="대학교 검색"
                        disabled={isLoading}
                    />
                    {searchTerm && filteredUniversities.length > 0 && !selectedUniversity && (
                        <div className="absolute z-[1000] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredUniversities.map(uni => (
                                <div
                                    key={uni}
                                    onClick={() => handleSelectUniversity(uni)}
                                    className="p-4 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-gray-700 border-b border-gray-50 last:border-none transition-colors"
                                >
                                    {uni}
                                </div>
                            ))}
                        </div>
                    )}
                    {searchTerm && filteredUniversities.length === 0 && !selectedUniversity && (
                         <div className="absolute z-[1000] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 text-center text-sm text-gray-500">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-colors">취소</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving || !selectedUniversity} 
                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isSaving ? '저장 중...' : '변경하기'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
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
        <ModalOverlay onClose={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-scaleUp border border-gray-100">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <FaExclamationTriangle className="text-3xl text-red-500" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-red-600">회원 탈퇴</h3>
                </div>
                
                <div className="bg-red-50 p-5 rounded-2xl mb-6 border border-red-100">
                    <p className="font-bold text-red-800 mb-2 text-sm text-center">⚠️ 주의: 복구가 불가능합니다</p>
                    <ul className="space-y-1.5 text-xs text-red-700/80 list-disc list-inside">
                        <li>계정 정보 및 개인 프로필 삭제</li>
                        <li>작성한 모든 게시글 및 댓글 삭제</li>
                        <li>활동 포인트 및 내역 영구 소실</li>
                    </ul>
                </div>

                <p className="text-sm text-gray-600 mb-3 text-center">
                    아래 문구를 똑같이 입력해주세요.
                </p>
                <input 
                    type="text" 
                    value={confirmationText} 
                    onChange={(e) => setConfirmationText(e.target.value)} 
                    className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-red-500 focus:outline-none transition-all mb-8 text-center placeholder-gray-300" 
                    placeholder={requiredText}
                />

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-600 font-bold text-base hover:bg-gray-200 transition-colors">취소</button>
                    <button 
                        onClick={handleDelete} 
                        disabled={confirmationText !== requiredText || isDeleting} 
                        className="flex-[2] py-4 bg-red-600 text-white rounded-2xl font-bold text-base shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {isDeleting ? '처리 중...' : '탈퇴하기'}
                    </button>
                </div>
            </div>
        </ModalOverlay>
    );
};

const ActivityFeed = ({ filter, data, isLoading, router }) => {
    const ITEMS_PER_PAGE = 5; 
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const processContent = (content) => {
        if (!content) return "";
        let processed = content.replace(/<img[^>]*>/g, '');
        processed = processed.replace(/<[^>]+>/g, ''); 
        return processed;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium">활동 내역을 불러오는 중...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                <i className="far fa-folder-open text-4xl mb-3 opacity-30"></i>
                <p className="text-sm font-medium">활동 내역이 없습니다.</p>
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
                        className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer duration-300"
                        onClick={() => router.push(`/community/${item.id}`)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors mr-4">
                                {item.title}
                            </h3>
                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap pt-1">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed font-medium">{processContent(item.content)}</p>
                    </div>
                );

            case "my-comments":
                return (
                    <div
                        className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer duration-300"
                        onClick={() => router.push(`/community/${item.post?.id}`)}
                    >
                         <div className="flex justify-between items-center mb-2">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">COMMENT</span>
                            <span className="text-xs font-medium text-gray-400">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</span>
                        </div>
                        <p className="text-gray-800 text-sm mb-3 line-clamp-2 leading-relaxed font-semibold">"{processContent(item.content)}"</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-xl">
                            <span className="font-bold text-gray-400 shrink-0 uppercase">Original Post</span>
                            <span className="truncate font-medium">{item.post?.title || "삭제된 게시글"}</span>
                        </div>
                    </div>
                );

            case "my-reviews":
                return (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300">
                         <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide uppercase">REVIEW</span>
                                <span className="font-extrabold text-gray-900 text-sm">{item.restaurant?.name || "알 수 없음"}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                <FaStar className="text-yellow-400 text-xs" />
                                <span className="font-bold text-yellow-600 text-xs">{item.rating}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-2 font-medium">{processContent(item.content)}</p>
                        <p className="text-xs font-medium text-gray-300 text-right">{new Date(item.createdAt).toLocaleDateString("ko-KR")}</p>
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
                <div className="flex justify-center items-center gap-4 pt-8 pb-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${currentPage === 1 ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-black border-gray-200 hover:bg-black hover:text-white hover:border-black shadow-sm"}`}
                    >
                        <i className="fas fa-chevron-left text-xs"></i>
                    </button>
                    <span className="text-gray-900 text-sm font-bold font-mono">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${currentPage === totalPages ? "text-gray-300 border-gray-100 cursor-not-allowed" : "text-black border-gray-200 hover:bg-black hover:text-white hover:border-black shadow-sm"}`}
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

    const handleLogout = () => {
        if(window.confirm("정말 로그아웃 하시겠습니까?")) {
            logout();
        }
    };

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
        <div className="min-h-screen bg-[#FAFAFA] font-sans">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
                .animate-scaleUp { animation: scaleUp 0.2s ease-out forwards; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #E5E7EB; border-radius: 10px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            
            <main className="max-w-6xl mx-auto py-8 md:py-12 px-4 animate-fadeIn">
                <section className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8 border border-gray-100 relative">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
                    </div>
                    <div className="px-8 pb-10">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 relative">
                            <div className="relative -mt-20 md:-mt-24">
                                <div className="w-36 h-36 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl p-2 relative z-10">
                                    <div className="w-full h-full bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-300 border border-gray-100 overflow-hidden">
                                        <i className="fas fa-user text-6xl"></i>
                                    </div>
                                    {isAdmin && (
                                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-md border-2 border-white tracking-wider">ADMIN</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center md:text-left flex-1 mb-2 md:mb-4 mt-8">
                                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-1 tracking-tight">{user.nickname}</h1>
                                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 font-medium text-sm">
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                        <FaUniversity className="text-gray-400" />
                                        {user.university}
                                    </span>
                                    <span className="text-gray-400">{user.universityEmail || user.email}</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                {isAdmin && (
                                    <button
                                        onClick={() => router.push('/admin/timetable')}
                                        className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
                                    >
                                        <FaCog /> 관리자 페이지
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-2xl font-extrabold text-gray-900">나의 활동</h2>
                        </div>
                        
                        <div className="bg-white p-2 rounded-3xl shadow-sm border border-gray-100 inline-flex w-full md:w-auto overflow-x-auto no-scrollbar">
                             {activityTags.map(tag => (
                                <button
                                    key={tag.key}
                                    onClick={() => setActivityFilter(tag.key)}
                                    className={`flex-1 md:flex-none px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2.5 whitespace-nowrap ${activityFilter === tag.key ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                                >
                                    {tag.icon} {tag.label}
                                </button>
                            ))}
                        </div>

                        <div className="min-h-[300px]">
                            <ActivityFeed filter={activityFilter} data={activityData} isLoading={isActivityLoading} router={router} />
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="px-2">
                            <h2 className="text-2xl font-extrabold text-gray-900">계정 설정</h2>
                        </div>
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-6 space-y-3">
                            <button 
                                onClick={() => setShowNicknameModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 transition group text-left border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition shadow-sm">
                                        <FaUserEdit className="text-lg" />
                                    </div>
                                    <div>
                                        <span className="block text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">닉네임 변경</span>
                                        <span className="block text-xs font-medium text-gray-400 mt-0.5">활동명을 수정합니다</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                                    <FaChevronRight className="text-xs" />
                                </div>
                            </button>

                            <button 
                                onClick={() => setShowPasswordModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 transition group text-left border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition shadow-sm">
                                        <FaKey className="text-lg" />
                                    </div>
                                    <div>
                                        <span className="block text-base font-bold text-gray-900 group-hover:text-purple-600 transition-colors">비밀번호 변경</span>
                                        <span className="block text-xs font-medium text-gray-400 mt-0.5">보안을 위해 주기적으로 변경</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-purple-500 group-hover:border-purple-100 transition-all">
                                    <FaChevronRight className="text-xs" />
                                </div>
                            </button>

                            {isAdmin && (
                                <button 
                                    onClick={() => setShowUniversityModal(true)} 
                                    className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 transition group text-left border border-transparent hover:border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition shadow-sm">
                                            <FaUniversity className="text-lg" />
                                        </div>
                                        <div>
                                            <span className="block text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">대학교 변경</span>
                                            <span className="block text-xs font-medium text-gray-400 mt-0.5">관리자 전용 기능입니다</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-all">
                                        <FaChevronRight className="text-xs" />
                                    </div>
                                </button>
                            )}

                            <div className="h-px bg-gray-100 my-2 mx-4"></div>

                            <button 
                                onClick={handleLogout} 
                                className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-red-50 transition group text-left border border-transparent hover:border-red-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-500 transition shadow-sm">
                                        <FaSignOutAlt className="text-lg" />
                                    </div>
                                    <span className="block text-base font-bold text-gray-600 group-hover:text-red-600 transition-colors">로그아웃</span>
                                </div>
                            </button>

                            <button 
                                onClick={() => setShowDeleteModal(true)} 
                                className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-red-50 transition group text-left border border-transparent hover:border-red-100"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-500 transition shadow-sm">
                                        <FaUserSlash className="text-lg" />
                                    </div>
                                    <span className="block text-base font-bold text-gray-600 group-hover:text-red-600 transition-colors">회원 탈퇴</span>
                                </div>
                            </button>
                        </div>
                    </aside>
                </div>

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
            </main>
        </div>
    );
}