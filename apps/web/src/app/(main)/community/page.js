"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection, query, orderBy, doc, getDoc, addDoc, serverTimestamp,
    updateDoc, increment, deleteDoc, onSnapshot, runTransaction, getDocs,
    arrayUnion, arrayRemove
} from "firebase/firestore";

import PostList from './PostList';
import CreatePostModal from './CreatePostModal';
import PostModal from './PostModal';
import '../../styles/style.css';

function SuccessModal({ message, onClose }) {
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
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition w-full"
                >
                    확인
                </button>
            </div>
        </div>
    );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                onConfirm();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onConfirm]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-8">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 text-white px-8 py-2 rounded-lg hover:bg-red-600 transition w-1/2"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CommunityPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");
    const [university, setUniversity] = useState("");
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [currentSort, setCurrentSort] = useState('latest');
    const [currentCategory, setCurrentCategory] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    
    const [postToDelete, setPostToDelete] = useState(null);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const docRef = doc(db, "users", currentUser.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setNickname(snap.data().nickname);
                    setUniversity(snap.data().university);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        }
        if (showHelp) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showHelp]);

    useEffect(() => {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));
            setPosts(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (selectedPost && posts.length > 0) {
            const updatedPost = posts.find(post => post.id === selectedPost.id);
            if (updatedPost) {
                setSelectedPost(updatedPost);
            }
        }
    }, [posts, selectedPost]); 

    useEffect(() => {
        if (!selectedPost) return;
        const commentsRef = collection(db, "posts", selectedPost.id, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(prev => ({
                ...prev,
                [selectedPost.id]: postComments
            }));
        });
        return () => unsubscribe();
    }, [selectedPost]); 

    useEffect(() => {
        const postIdFromUrl = searchParams.get('postId');
        if (postIdFromUrl && posts.length > 0 && !selectedPost) {
            const postToOpen = posts.find(p => p.id === postIdFromUrl);
            if (postToOpen) {
                openPost(postToOpen);
            }
        }
    }, [posts, searchParams, selectedPost]);

    const formatDate = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate();
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}분 전`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}시간 전`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) return "1일 전";
            return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        }
    };

    const getCategoryName = (category) => {
        const categoryNames = {
            notice: "공지사항", free: "자유게시판", question: "질문",
            info: "정보공유", trade: "거래"
        };
        return categoryNames[category] || category;
    };

    const filteredPosts = posts
        .filter(post => {
            const categoryMatch = currentCategory === 'all' || post.category === currentCategory;
            const searchMatch = !searchQuery ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase());
            return categoryMatch && searchMatch;
        })
        .sort((a, b) => {
            switch (currentSort) {
                case 'latest': return b.createdAt?.seconds - a.createdAt?.seconds;
                case 'likes': return (b.likeCount || 0) - (a.likeCount || 0);
                case 'views': return (b.views || 0) - (a.views || 0);
                case 'comments': return (b.commentCount || 0) - (a.commentCount || 0);
                default: return b.createdAt?.seconds - a.createdAt?.seconds;
            }
        });

    const handleCreatePost = async (postData) => {
        if (!postData.title || !postData.category || !postData.content.trim()) {
            alert("모든 필드를 입력해주세요.");
            return;
        }
        try {
            await addDoc(collection(db, "posts"), {
                title: postData.title,
                category: postData.category,
                content: postData.content,
                isAnonymous: postData.isAnonymous,
                authorId: user.uid,
                authorNickname: nickname,
                university,
                views: 0,
                likeCount: 0,
                likedBy: [],
                commentCount: 0,
                createdAt: serverTimestamp(),
                status: 'active'
            });
            setShowCreateModal(false);
            setSuccessMessage("게시글이 성공적으로 작성되었습니다!");
            setShowSuccessModal(true);
        } catch (error) {
            console.error(error);
            alert("글 작성 중 오류가 발생했습니다.");
        }
    };

    const openPost = async (post) => {
        setSelectedPost(post);
        const postRef = doc(db, "posts", post.id);
        try {
            await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(postRef);
                if (!snap.exists()) return;
                transaction.update(postRef, { views: increment(1) });
            });
        } catch (error) {
            console.error("조회수 증가 실패:", error);
        }
    };

    const closePost = () => {
        setSelectedPost(null);
        router.replace('/community', { scroll: false });
    };

    const handleAddComment = async (postId, commentData) => {
        if (!commentData.text.trim()) return;
        try {
            const commentRef = collection(db, "posts", postId, "comments");
            await addDoc(commentRef, {
                authorId: user.uid,
                authorNickname: nickname,
                university: university,
                content: commentData.text,
                isAnonymous: commentData.isAnonymous,
                likes: 0,
                likedBy: [],
                createdAt: serverTimestamp(),
                parentId: commentData.parentId || null,
            });
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, { commentCount: increment(1) });
        } catch (error) {
            console.error(error);
            alert("댓글 작성 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteComment = (postId, commentId) => {
        setCommentToDelete({ postId, commentId });
    };
    
    const executeDeleteComment = async () => {
        if (!commentToDelete) return;
        const { postId, commentId } = commentToDelete;
        
        try {
            const commentRef = doc(db, "posts", postId, "comments", commentId);
            await deleteDoc(commentRef);

            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, { commentCount: increment(-1) });
            
            setCommentToDelete(null); 
            setSuccessMessage("댓글이 삭제되었습니다.");
            setShowSuccessModal(true);
        } catch (error) {
            console.error("댓글 삭제 중 오류 발생:", error);
            alert("댓글 삭제 중 오류가 발생했습니다.");
            setCommentToDelete(null);
        }
    };

    const handleLikePost = async (postId) => {
        if (!user) return;
        const postRef = doc(db, "posts", postId);
        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) { throw "문서가 존재하지 않습니다!"; }
                const likedBy = postDoc.data().likedBy || [];
                if (likedBy.includes(user.uid)) {
                    transaction.update(postRef, { likedBy: arrayRemove(user.uid), likeCount: increment(-1) });
                } else {
                    transaction.update(postRef, { likedBy: arrayUnion(user.uid), likeCount: increment(1) });
                }
            });
        } catch (error) {
            console.error("게시글 추천 처리 실패:", error);
        }
    };

    const handleLikeComment = async (postId, commentId) => {
        if (!user) return;
        const commentRef = doc(db, "posts", postId, "comments", commentId);
        try {
            await runTransaction(db, async (transaction) => {
                const commentDoc = await transaction.get(commentRef);
                if (!commentDoc.exists()) { throw "댓글이 존재하지 않습니다!"; }
                const likedBy = commentDoc.data().likedBy || [];
                if (likedBy.includes(user.uid)) {
                    transaction.update(commentRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) });
                } else {
                    transaction.update(commentRef, { likedBy: arrayUnion(user.uid), likes: increment(1) });
                }
            });
        } catch (error) {
            console.error("댓글 추천 처리 실패:", error);
        }
    };

    const handleDeletePost = (postId) => {
        setPostToDelete(postId);
    };

    const executeDeletePost = async () => {
        if (!postToDelete) return;
        try {
            const postId = postToDelete;
            const commentsRef = collection(db, "posts", postId, "comments");
            const commentsSnapshot = await getDocs(commentsRef);
        
            const deletePromises = [];
            commentsSnapshot.forEach((commentDoc) => {
                deletePromises.push(deleteDoc(commentDoc.ref));
            });
            await Promise.all(deletePromises);
        
            const postRef = doc(db, "posts", postId);
            await deleteDoc(postRef);
        
            setSelectedPost(null);
            setPostToDelete(null); 
            setSuccessMessage("게시글과 관련 댓글이 모두 삭제되었습니다.");
            setShowSuccessModal(true);

        } catch (error) {
            console.error("게시글 삭제 실패:", error);
            alert("게시글 삭제 중 오류가 발생했습니다.");
            setPostToDelete(null); 
        }
    };

    const handleEditPost = async (postId, updatedData) => {
        if (updatedData.title && updatedData.content) {
            try {
                const postRef = doc(db, "posts", postId);
                await updateDoc(postRef, { 
                    title: updatedData.title, 
                    content: updatedData.content,
                    isAnonymous: updatedData.isAnonymous
                });
                setSuccessMessage("게시글이 수정되었습니다.");
                setShowSuccessModal(true);
            } catch (error) {
                console.error("게시글 수정 실패:", error);
                alert("게시글 수정 중 오류가 발생했습니다.");
            }
        }
    };

    const popularPosts = posts
        .filter(p => p.createdAt && p.createdAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    const topLikedPosts = [...posts]
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 5);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">로딩중...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center justify-center px-4 bg-gray-50 space-y-6">
                        <div ref={helpRef} className="relative flex justify-center items-center gap-2">
                            <h1 className="text-4xl font-bold text-gray-800">자유게시판</h1>
                            <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <i className="fa-solid fa-circle-question fa-lg"></i>
                            </button>
                            {showHelp && (
                                <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                    <h4 className="font-bold text-md mb-2 text-gray-800">📋 커뮤니티 이용 수칙</h4>
                                    <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                                        <li>타인에 대한 비방, 비난, 욕설 등은 금지됩니다.</li>
                                        <li>광고성, 상업적 목적의 게시물은 제재 대상입니다.</li>
                                        <li>음란물, 불법 등 부적절한 콘텐츠는 게시할 수 없습니다.</li>
                                        <li className="font-semibold text-red-600">위반 시 서비스 이용이 제한되거나 관련 법령에 따라 처벌받을 수 있습니다.</li>
                                    </ul>
                                    <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                        <i className="fa-solid fa-times"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xl text-gray-600">전국에 있는 학우들과 자유롭게 소통하세요</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 mt-4 md:mt-0 mb-8"
                        >
                            <i className="fas fa-edit mr-2"></i>
                            글 작성하기
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <PostList
                                posts={filteredPosts}
                                openPost={openPost}
                                user={user}
                                currentCategory={currentCategory}
                                setCurrentCategory={setCurrentCategory}
                                currentSort={currentSort}
                                setCurrentSort={setCurrentSort}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                formatDate={formatDate}
                                getCategoryName={getCategoryName}
                            />
                        </div>

                        <aside className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <i className="fas fa-fire text-red-500 mr-2"></i> 24시간 인기글
                                </h3>
                                <div className="space-y-3">
                                    {popularPosts.length === 0 ? <p className="text-gray-500 text-sm">인기글이 없습니다.</p> :
                                        popularPosts.map((post, index) => (
                                            <div key={post.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => openPost(post)}>
                                                <div className="bg-red-100 text-red-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium line-clamp-1">{post.title}</h4>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                        <span><i className="fas fa-eye mr-1"></i>{post.views || 0}</span>
                                                        <span><i className="fas fa-thumbs-up mr-1"></i>{post.likeCount || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center">
                                    <i className="fas fa-thumbs-up text-blue-500 mr-2"></i> 추천글 TOP 5
                                </h3>
                                <div className="space-y-3">
                                    {topLikedPosts.length === 0 ? <p className="text-gray-500 text-sm">추천글이 없습니다.</p> :
                                        topLikedPosts.map((post, index) => (
                                            <div key={post.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => openPost(post)}>
                                                <div className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{index + 1}</div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-medium line-clamp-1">{post.title}</h4>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                        <span><i className="fas fa-thumbs-up mr-1"></i>{post.likeCount || 0}</span>
                                                        <span>{formatDate(post.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {showCreateModal && (
                <CreatePostModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreatePost}
                />
            )}

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    comments={comments[selectedPost.id] || []}
                    user={user}
                    onClose={closePost}
                    onAddComment={handleAddComment}
                    onLikePost={handleLikePost}
                    onLikeComment={handleLikeComment}
                    onDeletePost={handleDeletePost}
                    onEditPost={handleEditPost}
                    onDeleteComment={handleDeleteComment}
                    formatDate={formatDate}
                    getCategoryName={getCategoryName}
                />
            )}

            {showSuccessModal && (
                <SuccessModal
                    message={successMessage}
                    onClose={() => setShowSuccessModal(false)}
                />
            )}

            {postToDelete && (
                <ConfirmModal
                    message="정말 삭제하시겠습니까? 관련 댓글도 모두 삭제됩니다."
                    onConfirm={executeDeletePost}
                    onCancel={() => setPostToDelete(null)}
                />
            )}

            {commentToDelete && (
                <ConfirmModal
                    message="정말 댓글을 삭제하시겠습니까?"
                    onConfirm={executeDeleteComment}
                    onCancel={() => setCommentToDelete(null)}
                />
            )}
        </div>
    );
}