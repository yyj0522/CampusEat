"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthProvider";
import { useUserInteraction } from "../../../context/UserInteractionProvider";
import apiClient from "../../../../lib/api";
import TextEditor from "../TextEditor";
import "@fortawesome/fontawesome-free/css/all.min.css";

function ReportModal({ onClose, onReport }) {
  const reportReasons = ["광고/상업적 게시글", "부적절/선정적", "욕설/비방", "개인정보 노출", "사기/불법"];
  const [reason, setReason] = useState(reportReasons[0]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
        <h3 className="text-xl font-bold mb-4 text-gray-900">신고하기</h3>
        <p className="text-sm text-gray-500 mb-4">신고 사유를 선택해주세요.</p>
        <div className="relative">
            <select className="w-full p-3 border border-gray-200 rounded-xl appearance-none outline-none focus:border-black bg-gray-50" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reportReasons.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="absolute right-3 top-3.5 text-gray-400 pointer-events-none">
                <i className="fas fa-chevron-down text-xs"></i>
            </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 font-medium transition">취소</button>
          <button onClick={() => onReport(reason)} className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-md transition">신고하기</button>
        </div>
      </div>
    </div>
  );
}

function ReplyInputForm({ authorNickname, onSubmit, onCancel }) {
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit({ content: text, isAnonymous });
    setText("");
    if(onCancel) onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 mt-3 border border-gray-100 ml-4">
        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <i className="fas fa-reply transform rotate-180"></i>
            <span className="font-bold text-gray-700">{authorNickname}</span>님에게 답글 작성
        </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        placeholder="답글을 입력하세요..."
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none resize-none bg-white text-sm"
        autoFocus
      />
      <div className="flex justify-between items-center mt-3">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
          onClick={() => setIsAnonymous(!isAnonymous)}
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              isAnonymous
                ? "bg-purple-600 border-purple-600"
                : "bg-white border-gray-300 border"
            }`}
          >
            {isAnonymous && <i className="fas fa-check text-white text-[10px]"></i>}
          </div>
          <span className="text-xs font-medium text-gray-600">익명</span>
        </div>
        <div className="flex gap-2">
             {onCancel && <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 rounded-lg transition">취소</button>}
             <button
              onClick={handleSubmit}
              className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition text-xs font-bold"
            >
              등록
            </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  user,
  post,
  onLikeComment,
  onReplySubmit,
  onToggleReply,
  onDeleteComment,
  replyingTo,
  formatDate,
  depth = 0,
  isBest = false,
}) {
  const { openContextMenu } = useUserInteraction();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';
  const canDelete = isAdmin || user?.id === comment.user?.id;

  if (comment.isDeleted) {
    return (
      <div
        style={{ paddingLeft: isBest ? 0 : `${depth * 20}px` }}
        className="mt-4"
      >
        <div className="flex items-start">
            {depth > 0 && !isBest && (
                <div className="mr-3 text-gray-300 mt-2">
                    <i className="fas fa-reply fa-rotate-180"></i>
                </div>
            )}
            <div className="flex-1 bg-gray-50 rounded-xl p-4 text-gray-400 text-sm italic border border-gray-100">
                삭제된 댓글입니다.
            </div>
        </div>
        {!isBest && comment.children && comment.children.length > 0 && (
          <div className="mt-1">
            {comment.children.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                user={user}
                post={post}
                onLikeComment={onLikeComment}
                onReplySubmit={onReplySubmit}
                onToggleReply={onToggleReply}
                onDeleteComment={onDeleteComment}
                replyingTo={replyingTo}
                formatDate={formatDate}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const authorTarget = comment.user
    ? {
        id: comment.user.id,
        nickname: comment.user.nickname,
        displayName: comment.displayName,
        role: comment.user.role,
      }
    : null;

  const context = { type: "comment", id: comment.id, postId: post.id };
  const isLiked = comment.likedBy?.split(",").includes(user?.id?.toString());

  return (
    <div
      style={{ paddingLeft: isBest ? 0 : `${depth * 20}px` }}
      className={`mt-3 transition-all duration-300`}
    >
        <div className={`relative ${isBest ? "bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 shadow-sm" : "bg-white hover:bg-gray-50"} rounded-xl p-4`}>
            {isBest && (
                <div className="absolute -top-2 -left-2 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                <i className="fas fa-crown text-xs"></i> BEST
                </div>
            )}
            
            <div className="flex items-start gap-3">
                {depth > 0 && !isBest && (
                    <div className="text-gray-300 mt-1">
                        <i className="fas fa-reply fa-rotate-180"></i>
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 mb-1">
                            {comment.displayName === "글쓴이" ? (
                                <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md">작성자</span>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                    <i className="fas fa-user"></i>
                                </div>
                            )}
                            
                            <span
                                className={`text-sm font-bold cursor-pointer ${comment.displayName === "글쓴이" ? "text-purple-700" : "text-gray-800"}`}
                                onContextMenu={(e) => authorTarget && openContextMenu(e, authorTarget, context)}
                            >
                                {comment.displayName}
                            </span>
                            
                            {comment.displayUniversity && (
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {comment.displayUniversity}
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                            {canDelete && (
                                <button
                                    onClick={() => onDeleteComment(comment.id)}
                                    className="text-gray-300 hover:text-red-500 transition"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed my-1.5 break-words">
                        {comment.content}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                        <button
                            onClick={() => onLikeComment(comment.id)}
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                            }`}
                        >
                            <i className={`${isLiked ? "fas" : "far"} fa-heart`}></i>
                            <span>{comment.likeCount || 0}</span>
                        </button>
                        
                        {!isBest && (
                            <button
                                onClick={() => onToggleReply(comment.id)}
                                className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors"
                            >
                                <i className="far fa-comment-dots"></i>
                                답글
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {replyingTo === comment.id && (
            <ReplyInputForm
                authorNickname={comment.displayName}
                onSubmit={(replyData) => onReplySubmit(replyData, comment.id)}
                onCancel={() => onToggleReply(comment.id)}
            />
        )}

      {!isBest && comment.children && comment.children.length > 0 && (
        <div className="mt-1">
          {comment.children.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              post={post}
              onLikeComment={onLikeComment}
              onReplySubmit={onReplySubmit}
              onToggleReply={onToggleReply}
              onDeleteComment={onDeleteComment}
              replyingTo={replyingTo}
              formatDate={formatDate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openContextMenu } = useUserInteraction(); 
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const menuRef = useRef(null);
  const dataFetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [postRes, commentRes] = await Promise.all([
        apiClient.get(`/posts/${id}`),
        apiClient.get(`/posts/${id}/comments`)
      ]);
      setPost(postRes.data);
      setComments(commentRes.data);
      setEditTitle(postRes.data.title);
      setEditContent(postRes.data.content);
    } catch (error) {
      window.alert("게시글을 불러올 수 없습니다.");
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchComments = useCallback(async () => {
      try {
        const res = await apiClient.get(`/posts/${id}/comments`);
        setComments(res.data);
      } catch (error) {
        console.error("댓글 로딩 실패", error);
      }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) {
        router.replace("/login"); 
        return;
    }
    if (user && !dataFetchedRef.current) {
        dataFetchedRef.current = true;
        fetchData();
    }
  }, [user, authLoading, fetchData, router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPostMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const authorIndexMap = useMemo(() => {
    if (!post) return {};
    const map = {};
    let currentIndex = 1;

    if (post.user) {
      const postAuthorKey = post.isAnonymous
        ? `anon_${post.user.id}`
        : post.user.id.toString();
      if (!(postAuthorKey in map)) {
        map[postAuthorKey] = 0;
      }
    }

    const sortedComments = [...comments].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    sortedComments.forEach((comment) => {
      if (comment.user) {
        const commentAuthorKey = comment.isAnonymous
          ? `anon_${comment.user.id}`
          : comment.user.id.toString();
        if (!(commentAuthorKey in map)) {
          map[commentAuthorKey] = currentIndex++;
        }
      }
    });
    return map;
  }, [comments, post]);

  const commentTree = useMemo(() => {
    if (!post) return [];
    const processedComments = comments.map((comment) => {
      let displayName, displayUniversity = null;

      if (!comment.isDeleted && comment.user) {
        const isAuthorAdmin =
          comment.user.role === "super_admin" ||
          comment.user.role === "sub_admin";
        const isPostAuthor = post.user && comment.user.id === post.user.id;
        displayUniversity = comment.user.university;

        if (comment.authorDisplayName) {
          displayName = comment.authorDisplayName;
          displayUniversity = null;
        } else if (isAuthorAdmin) {
          displayName = `[관리자] ${comment.user.nickname}`;
          displayUniversity = null;
        } else if (isPostAuthor) {
          displayName = "글쓴이";
        } else if (comment.isAnonymous) {
          const authorDisplayKey = `anon_${comment.user.id}`;
          const authorIndex = authorIndexMap[authorDisplayKey];
          displayName = `익명${authorIndex}`;
        } else {
          displayName = comment.user.nickname;
        }
      }

      return { ...comment, displayName, displayUniversity };
    });

    const map = {};
    const roots = [];
    processedComments.forEach((c) => {
      map[c.id] = { ...c, children: [] };
    });
    processedComments.forEach((c) => {
      if (c.parent && map[c.parent.id]) {
        map[c.parent.id].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [comments, post, authorIndexMap]);

  const bestComments = useMemo(() => {
    if (!post || comments.length === 0) return [];
    
    const sorted = [...comments]
      .filter(c => !c.isDeleted && c.likeCount >= 3)
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, 2);

    return sorted.map(comment => {
      let displayName = comment.user?.nickname;
      let displayUniversity = comment.user?.university;

      if (comment.user) {
           const isAuthorAdmin = comment.user.role === "super_admin" || comment.user.role === "sub_admin";
           const isPostAuthor = post.user && comment.user.id === post.user.id;
           
           if (comment.authorDisplayName) {
             displayName = comment.authorDisplayName;
             displayUniversity = null;
           } else if (isAuthorAdmin) {
             displayName = `[관리자] ${comment.user.nickname}`;
             displayUniversity = null;
           } else if (isPostAuthor) {
             displayName = "글쓴이";
           } else if (comment.isAnonymous) {
             const authorDisplayKey = `anon_${comment.user.id}`;
             const authorIndex = authorIndexMap[authorDisplayKey];
             displayName = `익명${authorIndex}`;
           }
      }
      return { ...comment, displayName, displayUniversity };
    });
  }, [comments, post, authorIndexMap]);

  const handleLikePost = async () => {
    try {
      const res = await apiClient.post(`/posts/${id}/like`);
      setPost(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error("추천 실패:", error);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm("게시글을 삭제하시겠습니까?")) {
        try {
            await apiClient.delete(`/posts/${id}`);
            router.replace("/community");
        } catch (error) {
            window.alert("삭제 중 오류가 발생했습니다.");
        }
    }
  };

  const handleUpdatePost = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
        window.alert("제목과 내용을 입력해주세요.");
        return;
    }
    try {
        const res = await apiClient.patch(`/posts/${id}`, { title: editTitle, content: editContent });
        setPost(prev => ({ ...prev, ...res.data }));
        setIsEditing(false);
        window.alert("수정되었습니다.");
    } catch (error) {
        window.alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleReportPost = async (reason) => {
    try {
        await apiClient.post(`/posts/${id}/report`, { reason });
        setShowReportModal(false);
        window.alert("신고가 접수되었습니다.");
    } catch (error) {
        window.alert("신고 중 오류가 발생했습니다.");
    }
  };

  const handleCommentSubmit = async (content, parentId = null) => {
    if (!content.trim()) return;
    try {
        await apiClient.post(`/posts/${id}/comments`, { content, isAnonymous: isCommentAnonymous, parentId });
        setCommentText("");
        setIsCommentAnonymous(false);
        fetchComments();
        setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
    } catch (error) {
        window.alert("댓글 작성 실패");
    }
  };

  const handleReplySubmit = async (replyData, parentId) => {
      try {
          await apiClient.post(`/posts/${id}/comments`, { ...replyData, parentId });
          setReplyingTo(null);
          fetchComments(); 
          setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      } catch(error) {
          window.alert("답글 작성 실패");
      }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("댓글을 삭제하시겠습니까?")) {
        try {
            await apiClient.delete(`/posts/${id}/comments/${commentId}`);
            fetchComments(); 
        } catch (error) {
            window.alert("댓글 삭제 실패");
        }
    }
  };

  const handleLikeComment = async (commentId) => {
      try {
          await apiClient.post(`/posts/${id}/comments/${commentId}/like`);
          fetchComments(); 
      } catch (error) {
          console.error("댓글 좋아요 실패", error);
      }
  }

  const handleToggleReply = (commentId) =>
    setReplyingTo((current) => (current === commentId ? null : commentId));
  
  const handleCommentKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCommentSubmit(commentText);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000;
    if(diff < 60) return "방금 전";
    if(diff < 3600) return `${Math.floor(diff/60)}분 전`;
    if(diff < 86400) return `${Math.floor(diff/3600)}시간 전`;
    return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;
  if (!post) return null;

  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';
  const isOwner = user?.id === post.user?.id;
  const canControlPost = isOwner || isAdmin;

  const postAuthorDisplayName = post.authorDisplayName
    ? post.authorDisplayName
    : post.isAnonymous
    ? "익명"
    : post.user?.nickname || "(알 수 없음)";

  const postAuthorTarget = post.user ? {
      id: post.user.id,
      nickname: post.user.nickname,
      displayName: postAuthorDisplayName,
      role: post.user.role
  } : null;

  const isPostLiked = post.likedByUsers?.some((u) => u.id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition flex items-center gap-2 text-sm font-bold">
            <i className="fas fa-arrow-left"></i> 뒤로가기
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 md:p-8">
            {isEditing ? (
                <div className="space-y-6 animate-fadeIn">
                      <div className="flex justify-between items-center border-b pb-4">
                        <h2 className="text-xl font-bold text-gray-900">게시글 수정</h2>
                        <button onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"><i className="fas fa-times"></i></button>
                      </div>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-lg font-bold border-b-2 border-gray-100 focus:border-black outline-none py-3 placeholder-gray-300 transition-colors"/>
                    <div className="min-h-[300px] border border-gray-200 rounded-xl overflow-hidden">
                        <TextEditor 
                            initialContent={editContent} 
                            onContentChange={setEditContent} 
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 bg-gray-100 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-200 transition">취소</button>
                        <button onClick={handleUpdatePost} className="px-5 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 font-bold text-sm transition shadow-lg">수정 완료</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-6 relative">
                        <div className="flex-1 pr-8">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold text-white mb-3 shadow-sm ${
                                post.category === "notice" ? "bg-red-500" : 
                                post.category === "free" ? "bg-green-500" :
                                post.category === "question" ? "bg-blue-500" : 
                                post.category === "info" ? "bg-yellow-500" : "bg-purple-500"
                            }`}>
                                {post.category === "free" ? "자유" : 
                                 post.category === "question" ? "질문" :
                                 post.category === "info" ? "정보" :
                                 post.category === "trade" ? "거래" :
                                 post.category === "notice" ? "공지" : post.category}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight break-words">{post.title}</h1>
                        </div>

                        <div className="relative" ref={menuRef}>
                            <button onClick={() => setShowPostMenu(!showPostMenu)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                                <i className="fas fa-ellipsis-v"></i>
                            </button>
                            {showPostMenu && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl z-20 border border-gray-100 py-1 overflow-hidden animate-fadeIn">
                                    {canControlPost && (
                                        <>
                                            {isOwner && (
                                                 <button onClick={() => { setIsEditing(true); setShowPostMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">수정하기</button>
                                            )}
                                            <button onClick={() => { handleDeletePost(); setShowPostMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition">삭제하기</button>
                                        </>
                                    )}
                                    <button onClick={() => { setShowReportModal(true); setShowPostMenu(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition">신고하기</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8">
                        <div className="flex items-center gap-3 cursor-pointer group" onContextMenu={(e) => postAuthorTarget && openContextMenu(e, postAuthorTarget, { type: 'post', id: post.id })}>
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-gray-200 transition">
                                <i className="fas fa-user"></i>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                    {postAuthorDisplayName}
                                    {post.user?.university && <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{post.user.university}</span>}
                                </div>
                                <div className="text-xs text-gray-400 font-medium">{formatDate(post.createdAt)} · 조회 {post.views}</div>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed mb-12 min-h-[150px]">
                         <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    <div className="flex justify-center mb-10">
                        <button 
                            onClick={handleLikePost} 
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 ${isPostLiked ? "bg-red-500 text-white ring-4 ring-red-100" : "bg-white text-gray-500 border border-gray-200 hover:border-red-200 hover:text-red-500"}`}
                        >
                            <i className={`${isPostLiked ? "fas" : "far"} fa-thumbs-up text-lg`}></i>
                            <span className="font-bold text-lg">{post.likeCount || 0}</span>
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
                         <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-lg font-extrabold text-gray-900">댓글</h3>
                            <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{comments.length}</span>
                            <button onClick={() => fetchComments()} className="ml-auto text-gray-400 hover:text-gray-600 transition"><i className="fas fa-sync-alt"></i></button>
                         </div>
                         
                         <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm focus-within:ring-2 focus-within:ring-black/5 transition-shadow">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleCommentKeyDown}
                                rows={2}
                                placeholder="댓글을 남겨보세요 (존중과 배려를 부탁드립니다)"
                                className="w-full outline-none resize-none text-sm placeholder-gray-400"
                            />
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}>
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isCommentAnonymous ? "bg-black border-black" : "bg-white border-gray-300 border"}`}>
                                        {isCommentAnonymous && <i className="fas fa-check text-white text-[10px]"></i>}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600">익명</span>
                                </div>
                                <button onClick={() => handleCommentSubmit(commentText)} className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition text-xs font-bold shadow-md">등록</button>
                            </div>
                         </div>

                         <div className="space-y-1">
                           {bestComments.length > 0 && (
                             <div className="mb-8 bg-white/50 rounded-xl p-2">
                               <div className="text-xs font-extrabold text-yellow-500 mb-2 px-2 flex items-center gap-1"><i className="fas fa-star"></i> 베스트 댓글</div>
                               {bestComments.map(comment => (
                                 <CommentItem 
                                   key={`best-${comment.id}`}
                                   comment={comment}
                                   user={user}
                                   post={post}
                                   onLikeComment={handleLikeComment}
                                   onReplySubmit={handleReplySubmit}
                                   onToggleReply={handleToggleReply}
                                   onDeleteComment={(cid) => handleDeleteComment(cid)}
                                   replyingTo={replyingTo}
                                   formatDate={formatDate}
                                   isBest={true}
                                   depth={0}
                                 />
                               ))}
                             </div>
                           )}

                           {commentTree.map((rootComment) => (
                               <CommentItem
                                   key={rootComment.id}
                                   comment={rootComment}
                                   user={user}
                                   post={post}
                                   onLikeComment={handleLikeComment}
                                   onReplySubmit={handleReplySubmit}
                                   onToggleReply={handleToggleReply}
                                   onDeleteComment={(cid) => handleDeleteComment(cid)}
                                   replyingTo={replyingTo}
                                   formatDate={formatDate}
                               />
                           ))}
                           {comments.length === 0 && (
                               <div className="text-center py-10 text-gray-400 text-sm">
                                   <i className="far fa-comment-dots text-2xl mb-2 block opacity-50"></i>
                                   첫 번째 댓글을 남겨주세요!
                               </div>
                           )}
                         </div>
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
      {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onReport={handleReportPost} />}
    </div>
  );
}