"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthProvider";
import { useUserInteraction } from "../../../context/UserInteractionProvider";
import apiClient from "../../../../lib/api";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../../../styles/style.css";

function ReportModal({ onClose, onReport }) {
  const reportReasons = ["광고/상업적 게시글", "부적절/선정적", "욕설/비방", "개인정보 노출", "사기/불법"];
  const [reason, setReason] = useState(reportReasons[0]);
  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 w-full max-w-[400px]">
        <h3 className="text-xl font-bold mb-4 text-gray-800">신고하기</h3>
        <select className="w-full p-2 border rounded mb-6" value={reason} onChange={(e) => setReason(e.target.value)}>
          {reportReasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">취소</button>
          <button onClick={() => onReport(reason)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">신고</button>
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
    <div className="bg-gray-100 rounded-lg p-3 mt-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={`${authorNickname}님에게 답글 남기기...`}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block"
        style={{ minHeight: "42px" }}
        autoFocus
      />
      <div className="flex justify-between items-center mt-2">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsAnonymous(!isAnonymous)}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
              isAnonymous
                ? "bg-red-500 border-red-500"
                : "bg-white border-gray-400 border-2"
            }`}
          >
            {isAnonymous && <i className="fas fa-check text-white text-xs"></i>}
          </div>
          <span className="text-sm text-gray-600">익명</span>
        </div>
        <div className="flex gap-2">
             {onCancel && <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">취소</button>}
             <button
              onClick={handleSubmit}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
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
        style={{ marginLeft: isBest ? 0 : `${depth * 32}px` }}
        className="mt-4"
      >
        <div className="flex">
            {depth > 0 && !isBest && (
                <div className="mr-3 flex-shrink-0 text-gray-400 pt-1">
                    <i className="fas fa-level-up-alt rotate-90 fa-lg"></i>
                </div>
            )}
            <div className="flex-1">
                <p className="text-gray-500 italic text-sm">
                {comment.content}
                </p>
            </div>
        </div>
        {!isBest && comment.children && comment.children.length > 0 && (
          <div className="mt-2">
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
      style={{ marginLeft: isBest ? 0 : `${depth * 32}px` }}
      className={`mt-4 ${isBest ? "bg-red-50 p-4 rounded-lg border border-red-100" : ""}`}
    >
      {isBest && (
        <div className="flex items-center gap-1 text-red-500 font-bold text-xs mb-2">
          <i className="fas fa-crown"></i>
          <span>베스트 댓글</span>
        </div>
      )}
      <div className="flex">
        {depth > 0 && !isBest && (
            <div className="mr-3 flex-shrink-0 text-gray-800 pt-1 pl-1">
                <i className="fas fa-level-up-alt rotate-90 fa-lg"></i>
            </div>
        )}
        <div className="flex-1">
            <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-user text-gray-600 text-sm"></i>
                </div>
                <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <div
                    className="font-medium text-sm flex items-center gap-2 cursor-pointer"
                    onContextMenu={(e) =>
                        authorTarget && openContextMenu(e, authorTarget, context)
                    }
                    >
                    <span
                        className={
                        comment.displayName === "글쓴이"
                            ? "text-purple-600 font-bold"
                            : ""
                        }
                    >
                        {comment.displayName}
                    </span>
                    {comment.displayUniversity && (
                        <span className="text-xs text-gray-400 font-light">
                        · {comment.displayUniversity}
                        </span>
                    )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    <button
                        onClick={() => onLikeComment(comment.id)}
                        className={`flex items-center transition ${
                        isLiked
                            ? "text-blue-600 font-semibold"
                            : "text-gray-500 hover:text-blue-600"
                        }`}
                    >
                        <i className="fas fa-thumbs-up mr-1"></i>
                        {comment.likeCount || 0}
                    </button>
                    </div>
                </div>
                <div className="text-gray-700 text-sm whitespace-pre-wrap">
                    {comment.content}
                </div>
                <div className="flex items-center gap-4 mt-2">
                    {!isBest && (
                    <button
                        onClick={() => onToggleReply(comment.id)}
                        className="text-xs font-semibold text-gray-600 hover:underline"
                    >
                        답글 달기
                    </button>
                    )}
                    {canDelete && (
                    <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="text-xs font-semibold text-red-500 hover:underline"
                    >
                        삭제
                    </button>
                    )}
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
        </div>
      </div>

      {!isBest && comment.children && comment.children.length > 0 && (
        <div className="mt-2">
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
    return new Date(dateString).toLocaleString("ko-KR", {
      month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">로딩중...</div>;
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
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-purple-600 flex items-center gap-2 font-medium transition">
            <i className="fas fa-arrow-left"></i> 목록으로 돌아가기
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            {isEditing ? (
                <div className="space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">게시글 수정</h2>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
                      </div>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full text-2xl font-bold border-b border-gray-300 focus:border-purple-500 outline-none py-2"/>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-200 outline-none"/>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700">취소</button>
                        <button onClick={handleUpdatePost} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">저장</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <span className={`category-badge px-2 py-1 rounded text-xs font-medium text-white ${post.category === "notice" ? "bg-red-500" : "bg-gray-500"}`}>
                                    {post.category === "free" ? "자유" : post.category === "info" ? "정보" : post.category}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 truncate">{post.title}</h2>
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0 space-y-2">
                             <div className="relative" ref={menuRef}>
                                <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-500 hover:text-gray-800 p-1">
                                    <i className="fas fa-ellipsis-v"></i>
                                </button>
                                {showPostMenu && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                                        {canControlPost && (
                                            <>
                                                {isOwner && (
                                                     <button onClick={() => { setIsEditing(true); setShowPostMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">수정하기</button>
                                                )}
                                                <button onClick={() => { handleDeletePost(); setShowPostMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">삭제하기</button>
                                            </>
                                        )}
                                        <button onClick={() => { setShowReportModal(true); setShowPostMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">신고하기</button>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6 pb-6 border-b">
                        <div className="flex items-center space-x-3 cursor-pointer" onContextMenu={(e) => postAuthorTarget && openContextMenu(e, postAuthorTarget, { type: 'post', id: post.id })}>
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><i className="fas fa-user text-gray-600"></i></div>
                            <div>
                                <div className="font-medium flex items-center gap-2">
                                    <span>{postAuthorDisplayName}</span>
                                </div>
                                <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                             <span><i className="fas fa-eye mr-1"></i>{post.views || 0}</span>
                             <button onClick={handleLikePost} className={`flex items-center transition ${isPostLiked ? "text-blue-600 font-semibold" : "text-gray-500 hover:text-blue-600"}`}>
                                <i className="fas fa-thumbs-up mr-1"></i> {post.likeCount || 0}
                             </button>
                        </div>
                    </div>

                    <div className="prose max-w-none mb-8">
                         <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    <div className="border-t pt-6 mt-8">
                         <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">댓글 {comments.length || 0}개</h3>
                                <button onClick={() => fetchComments()} className="text-gray-400 hover:text-gray-600 transition" title="댓글 새로고침">
                                    <i className="fas fa-sync-alt"></i>
                                </button>
                            </div>
                         </div>
                         
                         <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleCommentKeyDown}
                                rows={1}
                                placeholder="댓글을 입력하세요..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block"
                                style={{ minHeight: "42px" }}
                            />
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isCommentAnonymous ? "bg-red-500 border-red-500" : "bg-white border-gray-400 border-2"}`}>
                                        {isCommentAnonymous && <i className="fas fa-check text-white text-xs"></i>}
                                    </div>
                                    <span className="text-sm text-gray-600">익명</span>
                                </div>
                                <button onClick={() => handleCommentSubmit(commentText)} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm">등록</button>
                            </div>
                         </div>

                         <div className="space-y-4">
                           {bestComments.length > 0 && (
                             <div className="mb-6 space-y-4">
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