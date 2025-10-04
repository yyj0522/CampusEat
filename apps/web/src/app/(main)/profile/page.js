"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, functions } from "../../../firebase";
import { onAuthStateChanged, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, collectionGroup, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import Image from "next/image";
import '../../styles/style.css'; 

// --- 모달 컴포넌트들 ---
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

const ChangePasswordModal = ({ isOpen, onClose, showAlert }) => {
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
        if (newPassword.length < 6) {
            showAlert("새 비밀번호는 6자 이상이어야 합니다."); return;
        }
        setIsSaving(true);
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            showAlert("비밀번호가 성공적으로 변경되었습니다.");
            onClose();
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showAlert("현재 비밀번호가 올바르지 않습니다.");
            } else {
                showAlert("비밀번호 변경 중 오류가 발생했습니다.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>
                <div className="space-y-3">
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="현재 비밀번호"/>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="새 비밀번호 (6자 이상)"/>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="새 비밀번호 확인"/>
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
                    <li>작성한 모든 맛집 리뷰</li>
                    <li>기타 모든 활동 내역</li>
                </ul>
                <p className="text-gray-600 mb-2">탈퇴를 원하시면, 아래 입력창에 <strong className="text-red-600">"{requiredText}"</strong>를 정확히 입력해주세요.</p>
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
    if (isLoading) {
        return <div className="text-center py-8"><div className="loading mx-auto"></div></div>;
    }
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500 py-8">활동 내역이 없습니다.</p>;
    }

    const renderItem = (item) => {
        switch (filter) {
            case 'my-posts':
                return (
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/community?postId=${item.id}`)}>
                        <p className="font-semibold line-clamp-1">{item.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.content}</p>
                    </div>
                );
            case 'my-comments':
                return (
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/community?postId=${item.postId}`)}>
                        <p className="text-sm text-gray-700">"{item.content}"</p>
                        <p className="text-xs text-gray-400 mt-1">원문: {item.postTitle || "게시글"}</p>
                    </div>
                );
            case 'my-reviews':
                return (
                     <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/restaurant')}>
                        <p className="font-semibold">{item.restaurantName} <span className="text-yellow-500">{'★'.repeat(item.rating)}</span></p>
                        <p className="text-sm text-gray-700 mt-1">"{item.content}"</p>
                    </div>
                );
            case 'liked-restaurants':
                 return (
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/restaurant')}>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.vicinity}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {data.map(item => <div key={item.id}>{renderItem(item)}</div>)}
        </div>
    );
};


export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [activityFilter, setActivityFilter] = useState('my-posts');
    const [activityData, setActivityData] = useState([]);
    const [isActivityLoading, setIsActivityLoading] = useState(true);

    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alertInfo, setAlertInfo] = useState({ show: false, message: "" });

    const showAlert = (message) => setAlertInfo({ show: true, message });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login");
                return;
            }
            setUser(currentUser);
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                setUserData({ nickname: "사용자", email: currentUser.email, university: "미인증", universityEmail: "" });
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user || !userData) return;
        const fetchData = async () => {
            setIsActivityLoading(true);
            setActivityData([]);
            try {
                if (activityFilter === 'my-posts') {
                    const q = query(collection(db, "posts"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
                    const querySnapshot = await getDocs(q);
                    setActivityData(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                } else if (activityFilter === 'my-comments') {
                    // [최종 수정] orderBy를 다시 추가합니다.
                    const q = query(collectionGroup(db, 'comments'), where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const commentsData = await Promise.all(querySnapshot.docs.map(async (d) => {
                        const comment = { id: d.id, ...d.data() };
                        const postRef = d.ref.parent.parent;
                        const postSnap = await getDoc(postRef);
                        return { ...comment, postId: postRef.id, postTitle: postSnap.exists() ? postSnap.data().title : "삭제된 게시글" };
                    }));
                    setActivityData(commentsData);
                } else if (activityFilter === 'my-reviews') {
                    const q = query(collection(db, "reviews"), where("authorId", "==", user.uid), orderBy("createdAt", "desc"));
                    const querySnapshot = await getDocs(q);
                    setActivityData(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                } else if (activityFilter === 'liked-restaurants' && userData.university) {
                    const userSnap = await getDoc(doc(db, "users", user.uid));
                    const likedIds = userSnap.data()?.likedRestaurants || [];
                    if (likedIds.length > 0) {
                        const restaurantCol = collection(db, `newUniversities/${userData.university}/newRestaurants`);
                        const results = [];
                        for (let i = 0; i < likedIds.length; i += 10) {
                            const chunk = likedIds.slice(i, i + 10);
                            const q = query(restaurantCol, where('__name__', 'in', chunk));
                            const querySnapshot = await getDocs(q);
                            querySnapshot.forEach(d => results.push({ id: d.id, ...d.data() }));
                        }
                        setActivityData(results);
                    } else {
                        setActivityData([]);
                    }
                }
            } catch (error) {
                console.error("활동 데이터 로드 오류:", error);
                showAlert("데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setIsActivityLoading(false);
            }
        };

        fetchData();
    }, [user, activityFilter, userData]);

    const handleLogout = async () => {
        if (confirm("정말 로그아웃 하시겠습니까?")) {
            try {
                await signOut(auth);
                router.push("/login");
            } catch (error) {
                console.error("로그아웃 실패:", error);
                showAlert("로그아웃 중 오류가 발생했습니다.");
            }
        }
    };

    const handleUpdateNickname = async (newNickname) => {
        if (newNickname === userData.nickname) {
            showAlert("현재 닉네임과 동일합니다.");
            return false;
        }
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("nickname", "==", newNickname));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                showAlert("이미 사용 중인 닉네임입니다.");
                return false;
            }
            await updateDoc(doc(db, "users", user.uid), { nickname: newNickname });
            setUserData(prev => ({ ...prev, nickname: newNickname }));
            showAlert("닉네임이 변경되었습니다.");
            return true;
        } catch (error) {
            console.error("닉네임 업데이트 실패:", error);
            showAlert("닉네임 변경 중 오류가 발생했습니다.");
            return false;
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
            await deleteUserAccount();
            await signOut(auth);
            showAlert("회원 탈퇴 처리가 완료되었습니다. 이용해주셔서 감사합니다.");
            router.push("/login");
        } catch (error) {
            console.error("회원 탈퇴 처리 실패:", error);
            showAlert("회원 탈퇴 중 심각한 오류가 발생했습니다. 관리자에게 문의해주세요.");
        }
    };

    const activityTags = [
        { key: 'my-posts', label: '작성한 글' },
        { key: 'my-comments', label: '작성한 댓글' },
        { key: 'my-reviews', label: '맛집 리뷰' },
        { key: 'liked-restaurants', label: '추천한 맛집' },
    ];

    if (!userData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading mx-auto"></div>
                    <p className="mt-4 text-gray-600">사용자 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

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
                        <h1 className="text-4xl font-bold text-gray-800">{userData.nickname}</h1>
                        <p className="mt-2 text-lg text-gray-600">{userData.university}</p>
                        <p className="mt-1 text-sm text-gray-500">{userData.universityEmail || userData.email}</p>
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
                    currentNickname={userData.nickname}
                    onSave={handleUpdateNickname}
                    showAlert={showAlert}
                />
                <ChangePasswordModal 
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
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