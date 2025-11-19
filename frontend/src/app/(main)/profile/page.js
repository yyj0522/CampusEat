"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import '../../styles/style.css';

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Enter') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-sm text-center">
                <p className="text-lg mb-6">{message}</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full hover:bg-blue-700 transition">확인</button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-sm text-center">
                <p className="text-lg mb-8">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="px-4 py-2 w-full border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700">확인</button>
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
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">닉네임 변경</h3>
                <input type="text" value={newNickname} onChange={(e) => setNewNickname(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="새 닉네임을 입력하세요" />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
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
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>
                <div className="space-y-3">
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="현재 비밀번호" />
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="새 비밀번호 (4자 이상)" />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="새 비밀번호 확인" />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
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
                setAllUniversities(response.data.sort());
            } catch (error) {
                console.error("대학교 목록 로딩 오류:", error);
                showAlert("대학교 목록을 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        if (isOpen) {
            fetchUniversities();
        }
    }, [isOpen, showAlert]);

    useEffect(() => {
        if (searchTerm) {
            setFilteredUniversities(
                allUniversities.filter(uni => uni.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        } else {
            setFilteredUniversities([]);
        }
    }, [searchTerm, allUniversities]);

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
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">대학교 변경</h3>
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setSelectedUniversity(null);
                        }}
                        className="w-full border p-2 rounded-lg"
                        placeholder="대학교 이름을 검색하세요"
                        disabled={isLoading}
                    />
                    {searchTerm && filteredUniversities.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredUniversities.map(uni => (
                                <div
                                    key={uni}
                                    onClick={() => handleSelectUniversity(uni)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                >
                                    {uni}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={handleSave} disabled={isSaving || !selectedUniversity} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
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
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-lg">
                <h3 className="text-xl font-bold text-red-600 mb-4">회원 탈퇴</h3>
                <p className="text-gray-600 mb-4">정말로 회원 탈퇴를 진행하시겠습니까? 탈퇴 시 아래의 모든 데이터가 영구적으로 삭제되며, 복구할 수 없습니다.</p>
                <ul className="list-disc list-inside bg-yellow-50 p-3 rounded-lg text-yellow-800 text-sm mb-4">
                    <li>계정 정보 (닉네임, 이메일 등)</li>
                    <li>작성한 모든 게시글 및 댓글</li>
                    <li>기타 모든 활동 내역</li>
                </ul>
                <p className="text-gray-600 mb-2">탈퇴를 원하시면, 아래 입력창에 <strong className="text-red-600">&quot;{requiredText}&quot;</strong>를 정확히 입력해주세요.</p>
                <input type="text" value={confirmationText} onChange={(e) => setConfirmationText(e.target.value)} className="w-full border p-2 rounded-lg" />
                <div className="flex justify-end gap-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">취소</button>
                    <button onClick={handleDelete} disabled={confirmationText !== requiredText || isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
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
            <div className="text-center py-8">
                <div className="loading mx-auto"></div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500 py-8">활동 내역이 없습니다.</p>;
    }

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = data.slice(startIndex, endIndex);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const renderItem = (item) => {
        switch (filter) {
            case "my-posts":
                return (
                    <div
                        className="p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition cursor-pointer"
                        onClick={() => router.push(`/community?postId=${item.id}`)}
                    >
                        <p className="text-sm text-gray-500 mb-1">제목 :</p>
                        <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-1">
                            {item.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">본문 :</p>
                        <p className="text-gray-700 text-sm line-clamp-2">{item.content}</p>
                        <p className="text-xs text-gray-400 mt-3">
                            {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                    </div>
                );

            case "my-comments":
                return (
                    <div
                        className="p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition cursor-pointer"
                        onClick={() => router.push(`/community?postId=${item.post?.id}`)}
                    >
                        <p className="text-sm text-gray-500 mb-1">댓글 내용 :</p>
                        <p className="text-gray-800 text-sm mb-3 line-clamp-2">“{item.content}”</p>
                        <p className="text-sm text-gray-500 mb-1">원문 게시글 :</p>
                        <p className="text-blue-600 text-sm font-medium line-clamp-1">
                            {item.post?.title || "게시글"}
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                    </div>
                );

            case "my-reviews":
                return (
                    <div className="p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition">
                        <div className="flex items-center justify-start gap-2 mb-1">
                            <p className="font-semibold text-gray-800">
                                {item.restaurant?.name || "리뷰한 식당"}
                            </p>
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                        key={star}
                                        className={`fas fa-star text-sm ${
                                            star <= item.rating
                                                ? "text-yellow-400"
                                                : "text-gray-300"
                                        }`}
                                    ></i>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                            {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {currentItems.map((item) => (
                <div key={item.id}>{renderItem(item)}</div>
            ))}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-6">
                    <button
                        onClick={handlePrev}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                            currentPage === 1
                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                : "text-blue-600 border-blue-300 hover:bg-blue-50"
                        }`}
                    >
                        이전
                    </button>

                    <span className="text-gray-600 text-sm">
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition ${
                            currentPage === totalPages
                                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                                : "text-blue-600 border-blue-300 hover:bg-blue-50"
                        }`}
                    >
                        다음
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

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const executeLogout = () => {
        logout(); 
        setShowLogoutConfirm(false);
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
            console.error("닉네임 업데이트 실패:", error);
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
            console.error("비밀번호 변경 실패:", error);
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
            console.error("대학교 업데이트 실패:", error);
            showAlert(error.response?.data?.message || "대학교 변경 중 오류가 발생했습니다.");
        }
    };
    
    const handleDeleteAccount = async () => {
        try {
            await apiClient.delete('/users/me');
            showAlert("회원 탈퇴 처리가 완료되었습니다. 이용해주셔서 감사합니다.");
            logout(); 
        } catch (error) {
            console.error("회원 탈퇴 처리 실패:", error);
            showAlert("회원 탈퇴 중 오류가 발생했습니다.");
        }
    };

    const activityTags = [
        { key: 'my-posts', label: '작성한 글' },
        { key: 'my-comments', label: '작성한 댓글' },
        { key: 'my-reviews', label: '맛집 리뷰' },
    ];

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading mx-auto"></div>
                    <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }
    
    const isAdmin = user.role === 'super_admin' || user.role === 'sub_admin';

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-4xl mx-auto py-12 px-4">
                <section className="bg-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row items-center gap-8 mb-8 animate-fadeIn">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <i className="fas fa-user text-5xl text-white"></i>
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-gray-800 flex items-center">
                            {isAdmin && <span className="text-blue-500 mr-2">[관리자]</span>}
                            {user.nickname}
                        </h1>
                        <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                            <p className="text-lg text-gray-600">{user.university}</p>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowUniversityModal(true)}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 font-semibold rounded-full hover:bg-blue-200 transition"
                                    >
                                        변경
                                    </button>
                                    <button
                                        onClick={() => router.push('/admin/timetable')}
                                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition"
                                    >
                                        관리
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{user.universityEmail || user.email}</p>
                    </div>
                </section>

                <div className="space-y-10">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">내 활동</h2>
                        <div className="bg-white rounded-lg p-2 shadow-md flex flex-wrap gap-2 mb-6">
                            {activityTags.map(tag => (
                                <button
                                    key={tag.key}
                                    onClick={() => setActivityFilter(tag.key)}
                                    className={`px-4 py-2 rounded-md font-semibold transition-colors text-sm ${activityFilter === tag.key ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                        <div className="bg-white rounded-2xl shadow-lg p-6 min-h-[200px]">
                            <ActivityFeed filter={activityFilter} data={activityData} isLoading={isActivityLoading} router={router} />
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">계정 설정</h2>
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <ul className="space-y-2">
                                <li onClick={() => setShowNicknameModal(true)} className="profile-list-item">
                                    <i className="fas fa-user-edit w-6 text-gray-500"></i>
                                    <span>닉네임 변경</span>
                                    <i className="fas fa-chevron-right text-gray-400"></i>
                                </li>
                                <li onClick={() => setShowPasswordModal(true)} className="profile-list-item">
                                    <i className="fas fa-key w-6 text-gray-500"></i>
                                    <span>비밀번호 변경</span>
                                    <i className="fas fa-chevron-right text-gray-400"></i>
                                </li>
                                <li onClick={handleLogout} className="profile-list-item text-red-600 hover:bg-red-50 font-semibold">
                                    <i className="fas fa-sign-out-alt w-6"></i>
                                    <span>로그아웃</span>
                                    <i className="fas fa-chevron-right"></i>
                                </li>
                                <li onClick={() => setShowDeleteModal(true)} className="profile-list-item text-gray-500 hover:bg-gray-100">
                                    <i className="fas fa-user-slash w-6"></i>
                                    <span>회원 탈퇴</span>
                                    <i className="fas fa-chevron-right"></i>
                                </li>
                            </ul>
                        </div>
                    </section>
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
                {showLogoutConfirm && <ConfirmModal message="정말 로그아웃 하시겠습니까?" onConfirm={executeLogout} onCancel={() => setShowLogoutConfirm(false)} />}
            </main>
        </div>
    );
}