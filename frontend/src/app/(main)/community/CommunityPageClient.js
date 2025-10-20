"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../../lib/api";
import { useAuth } from "../../context/AuthProvider";

import PostList from './PostList';
import CreatePostModal from './CreatePostModal';
import PostModal from './PostModal';
import '../../styles/style.css';

// ---------------------- 모달 컴포넌트 ----------------------
function AlertModal({ message, onClose }) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') {
                onClose();
            }
        };
        if (message) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
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

function ConfirmModal({ message, onConfirm, onCancel, confirmText = "삭제" }) {
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
                        className={`text-white px-8 py-2 rounded-lg transition w-1/2 ${confirmText === '삭제' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ReportModal({ postId, onClose, onReport }) {
    const reportReasons = [
        "광고/상업적 게시글이에요.",
        "부적절하거나 선정적인 게시글이에요.",
        "욕설/비방 등 불쾌한 표현이 있어요.",
        "개인정보 노출 위험이 있어요.",
        "사기/불법적인 내용을 담고 있어요.",
    ];
    const [selectedReason, setSelectedReason] = useState("direct");
    const [directReason, setDirectReason] = useState("");

    const handleConfirm = () => {
        const reason = selectedReason === 'direct' ? directReason.trim() : selectedReason;
        if (!reason) {
            alert("신고 사유를 선택하거나 입력해주세요.");
            return;
        }
        onReport(postId, reason);
        onClose();
    };

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 w-full max-w-[500px]">
                <h3 className="text-xl font-bold mb-4 text-gray-800">게시글 신고하기</h3>
                
                <select 
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-purple-500 focus:border-purple-500"
                >
                    <option value="direct">직접 입력할게요.</option>
                    {reportReasons.map(reason => (
                        <option key={reason} value={reason}>{reason}</option>
                    ))}
                </select>
                
                {selectedReason === 'direct' && (
                    <textarea
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 mb-6 transition-all duration-300 ease-in-out"
                        placeholder="신고 사유를 구체적으로 입력해주세요."
                        value={directReason}
                        onChange={(e) => setDirectReason(e.target.value)}
                        autoFocus
                    ></textarea>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                        신고
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------- 메인 컴포넌트 ----------------------

export default function CommunityPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();

    const [posts, setPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [comments, setComments] = useState({});
    const [currentSort, setCurrentSort] = useState('latest');
    const [selectedPost, setSelectedPost] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [postToDelete, setPostToDelete] = useState(null);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [postToReport, setPostToReport] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [alertMessage, setAlertMessage] = useState("");
    const postsPerPage = 10;
    const helpRef = useRef(null);
    const isModalClosingRef = useRef(false);

    const [currentCategory, setCurrentCategory] = useState(() => {
        const categoryFromUrl = searchParams.get('category');
        const validCategories = ['notice', 'free', 'question', 'info', 'trade'];
        return validCategories.includes(categoryFromUrl) ? categoryFromUrl : 'all';
    });
    
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [currentCategory, currentSort, searchQuery]);

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

    const fetchPosts = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoadingPosts(true);
        try {
            const response = await apiClient.get('/posts');
            setPosts(response.data);
        } catch (error) {
            console.error("게시글 목록 로딩 실패:", error);
            setAlertMessage("게시글을 불러오는 데 실패했습니다.");
        } finally {
            if (showLoading) setIsLoadingPosts(false);
        }
    }, []);

    useEffect(() => {
        if(user) {
            fetchPosts(true);
        }
    }, [user, fetchPosts]);

    const openPost = useCallback(async (post, updateUrl = true) => {
        try {
            const response = await apiClient.get(`/posts/${post.id}`);
            const updatedPost = response.data;
            
            setSelectedPost(updatedPost);
            
            if (updateUrl) {
                router.push(`/community?postId=${post.id}`, { scroll: false });
            }

            setPosts(prevPosts => prevPosts.map(p => 
                p.id === post.id ? { ...p, views: updatedPost.views } : p
            ));

        } catch (error) {
             console.error("게시글 열기 실패:", error);
             setAlertMessage("게시글을 불러오는 데 실패했습니다.");
        }
    }, [router]);
    
    useEffect(() => {
        const postIdFromUrl = searchParams.get('postId');
        if (postIdFromUrl && posts.length > 0 && !selectedPost && !isModalClosingRef.current) {
            const postToOpen = posts.find(p => p.id.toString() === postIdFromUrl);
            if (postToOpen) {
                openPost(postToOpen, false);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts, searchParams]);

    const fetchComments = useCallback(async (postId) => {
        try {
            const response = await apiClient.get(`/posts/${postId}/comments`);
            setComments(prev => ({ ...prev, [postId]: response.data }));
        } catch (error) {
            console.error(`댓글 로딩 실패 (postId: ${postId}):`, error);
        }
    }, []);

    useEffect(() => {
        if (selectedPost?.id) {
            fetchComments(selectedPost.id);
        }
    }, [selectedPost, fetchComments]);

    const closePost = () => {
        isModalClosingRef.current = true;
        setSelectedPost(null);
        router.replace('/community', { scroll: false });
        fetchPosts();

        setTimeout(() => {
            isModalClosingRef.current = false;
        }, 50);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}분 전`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}시간 전`;
        } else {
            return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        }
    };

    const getCategoryName = (category) => {
        const categoryNames = { notice: "공지사항", free: "자유게시판", question: "질문", info: "정보공유", trade: "거래" };
        return categoryNames[category] || category;
    };

    const filteredPosts = posts
        .filter(post => {
            const categoryMatch = currentCategory === 'all' || post.category === currentCategory;
            const searchMatch = !searchQuery ||
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
            return categoryMatch && searchMatch;
        })
        .sort((a, b) => {
            switch (currentSort) {
                case 'latest': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'likes': return (b.likeCount || 0) - (a.likeCount || 0);
                case 'views': return (b.views || 0) - (a.views || 0);
                case 'comments': return (b.commentCount || 0) - (a.commentCount || 0);
                default: return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    
    const pageCount = Math.ceil(filteredPosts.length / postsPerPage);
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

    const handleCreatePost = async (postData) => {
        if (!user) return;
        if (!postData.title || !postData.category || !postData.content.trim()) {
            setAlertMessage("모든 필수 필드를 입력해주세요.");
            return;
        }
        const formData = new FormData();
        Object.keys(postData).forEach(key => {
            if (postData[key] !== null) {
                formData.append(key, postData[key]);
            }
        });

        try {
            await apiClient.post('/posts', formData);
            setShowCreateModal(false);
            setSuccessMessage("게시글이 성공적으로 작성되었습니다!");
            setShowSuccessModal(true);
            fetchPosts();
        } catch (error) {
            console.error("글 작성 오류:", error);
            setAlertMessage("글 작성 중 오류가 발생했습니다.");
        }
    };

    const handleAddComment = async (postId, commentData) => {
        if (!user || !commentData.content.trim()) return;
        try {
            await apiClient.post(`/posts/${postId}/comments`, commentData);
            await fetchComments(postId);
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p));
        } catch (error) {
            console.error(error);
            setAlertMessage("댓글 작성 중 오류가 발생했습니다.");
        }
    };

    const handleDeleteComment = (postId, commentId) => {
        setCommentToDelete({ postId, commentId });
    };

    const executeDeleteComment = async () => {
        if (!commentToDelete) return;
        const { postId, commentId } = commentToDelete;
        try {
            await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
            setCommentToDelete(null);
            setSuccessMessage("댓글이 삭제되었습니다.");
            setShowSuccessModal(true);
            await fetchComments(postId);
        } catch (error) {
            console.error("댓글 삭제 중 오류 발생:", error);
            setAlertMessage("댓글 삭제 중 오류가 발생했습니다.");
            setCommentToDelete(null);
        }
    };

    const handleLikePost = async (postId) => {
        if (!user) return;
        const originalPosts = JSON.parse(JSON.stringify(posts));
        const originalSelectedPost = selectedPost ? JSON.parse(JSON.stringify(selectedPost)) : null;

        const optimisticUpdate = (post) => {
            const isLiked = post.likedByUsers.some(u => u.id === user.id);
            return {
                ...post,
                likeCount: isLiked ? (post.likeCount || 1) - 1 : (post.likeCount || 0) + 1,
                likedByUsers: isLiked 
                    ? post.likedByUsers.filter(u => u.id !== user.id) 
                    : [...post.likedByUsers, { id: user.id }]
            };
        };

        setPosts(prev => prev.map(p => p.id === postId ? optimisticUpdate(p) : p));
        if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(prev => prev ? optimisticUpdate(prev) : null);
        }

        try {
            const response = await apiClient.post(`/posts/${postId}/like`);
            const updatedPostFromServer = response.data;
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedPostFromServer } : p));
            if (selectedPost && selectedPost.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, ...updatedPostFromServer } : null);
            }
        } catch (error) {
            console.error("게시글 추천 처리 실패:", error);
            setPosts(originalPosts);
            if(originalSelectedPost) setSelectedPost(originalSelectedPost);
        }
    };

    const handleLikeComment = async (postId, commentId) => {
        if (!user) return;
        try {
            await apiClient.post(`/posts/${postId}/comments/${commentId}/like`);
            fetchComments(postId);
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
            await apiClient.delete(`/posts/${postToDelete}`);
            closePost();
            setPostToDelete(null);
            setSuccessMessage("게시글이 삭제되었습니다.");
            setShowSuccessModal(true);
        } catch (error) {
            console.error("게시글 삭제 실패:", error);
            setAlertMessage("게시글 삭제 중 오류가 발생했습니다.");
            setPostToDelete(null);
        }
    };
    
    const handleEditPost = async (postId, updatedData) => {
        if (!updatedData.title || !updatedData.content.trim()) {
            setAlertMessage("제목과 내용을 모두 입력해주세요.");
            return;
        }
        try {
            const response = await apiClient.patch(`/posts/${postId}`, updatedData);
            const updatedPostFromServer = response.data;
            setSuccessMessage("게시글이 수정되었습니다.");
            setShowSuccessModal(true);
            
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedPostFromServer } : p));
            setSelectedPost(prev => prev ? { ...prev, ...updatedPostFromServer } : null);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            const message = error.response?.data?.message || "게시글 수정 중 오류가 발생했습니다.";
            setAlertMessage(message);
        }
    };

    const handleReportPost = async (postId, reason) => {
        if (!user) return;
        try {
            await apiClient.post(`/posts/${postId}/report`, { reason });
            setSuccessMessage("게시글이 성공적으로 신고되었습니다.");
            setShowSuccessModal(true);
        } catch (error) {
            console.error("게시글 신고 실패:", error);
            const errorMessage = error.response?.data?.message || "게시글 신고 중 오류가 발생했습니다.";
            setAlertMessage(errorMessage);
        } finally {
            setPostToReport(null);
        }
    };

    const popularPosts = posts
        .filter(p => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5);

    const topLikedPosts = [...posts]
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 5);

    if (authLoading || !user || isLoadingPosts) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-purple-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">로딩중...</p>
                </div>
            </div>
        );
    }

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
                                    <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
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
                                posts={currentPosts}
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
                            {pageCount > 1 && (
                                <div className="flex justify-center items-center mt-8 space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-gray-700 bg-white rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        이전
                                    </button>
                                    {Array.from({ length: pageCount }, (_, i) => i + 1).map(number => (
                                        <button
                                            key={number}
                                            onClick={() => setCurrentPage(number)}
                                            className={`px-4 py-2 rounded-md border ${currentPage === number ? 'bg-purple-600 text-white' : 'text-gray-700 bg-white hover:bg-gray-100'}`}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                                        disabled={currentPage === pageCount}
                                        className="px-4 py-2 text-gray-700 bg-white rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        다음
                                    </button>
                                </div>
                            )}
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
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium truncate">{post.title}</h4>
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
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium truncate">{post.title}</h4>
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
                    onReportPost={() => setPostToReport(selectedPost.id)}
                    formatDate={formatDate}
                    getCategoryName={getCategoryName}
                    onFetchComments={fetchComments}
                />
            )}
            
            <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />
            {showSuccessModal && (<SuccessModal message={successMessage} onClose={() => setShowSuccessModal(false)} />)}
            {postToDelete && (<ConfirmModal message="정말 삭제하시겠습니까? 관련 댓글도 모두 삭제됩니다." onConfirm={executeDeletePost} onCancel={() => setPostToDelete(null)} />)}
            {commentToDelete && (<ConfirmModal message="정말 댓글을 삭제하시겠습니까?" onConfirm={executeDeleteComment} onCancel={() => setCommentToDelete(null)} />)}
            {postToReport && (<ReportModal postId={postToReport} onClose={() => setPostToReport(null)} onReport={handleReportPost} />)}
        </div>
    );
}