// src/app/(main)/community/PostModal.js
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import TextEditor from './TextEditor';
import { useUserInteraction } from "../../context/UserInteractionProvider";

function ReplyInputForm({ authorNickname, onSubmit }) {
    const [replyText, setReplyText] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const handleSubmit = () => { if (!replyText.trim()) return; onSubmit({ content: replyText, isAnonymous }); setReplyText(""); setIsAnonymous(false); };
    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };
    return ( <div className="bg-gray-100 rounded-lg p-3 mt-4"> <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder={`${authorNickname}님에게 답글 남기기...`} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block" style={{minHeight: '42px'}} autoFocus /> <div className="flex justify-between items-center mt-2"> <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}> <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400 border-2'}`}> {isAnonymous && <i className="fas fa-check text-white text-xs"></i>} </div> <span className="text-sm text-gray-600">익명</span> </div> <button onClick={handleSubmit} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm" > 등록 </button> </div> </div> );
};

function Comment({ 
    comment, user, post, onLikeComment, onReplySubmit, 
    onToggleReply, onDeleteComment, replyingTo, formatDate, depth = 0 
}) {
    const { openContextMenu } = useUserInteraction();
    
    if (comment.isDeleted) {
        return (
            <div style={{ marginLeft: `${depth * 32}px` }} className={`mt-4 ${depth > 0 ? 'border-l-2 border-gray-200 pl-4' : ''}`}>
                <p className="text-gray-500 italic text-sm">작성자에 의해 삭제된 댓글입니다.</p>
                {comment.children && comment.children.length > 0 && (
                    <div className="mt-2">
                        {comment.children.map(reply => (
                            <Comment 
                                key={reply.id} 
                                comment={reply}
                                user={user} post={post} onLikeComment={onLikeComment}
                                onReplySubmit={onReplySubmit} onToggleReply={onToggleReply}
                                onDeleteComment={onDeleteComment} replyingTo={replyingTo}
                                formatDate={formatDate} depth={depth + 1} 
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }
    
    const authorTarget = comment.user ? { 
        id: comment.user.id, 
        nickname: comment.user.nickname,
        displayName: comment.displayName,
        role: comment.user.role
    } : null;

    const context = { type: 'comment', id: comment.id, postId: post.id };
    const isLiked = comment.likedBy?.split(',').includes(user?.id.toString());

    return (
        <div style={{ marginLeft: `${depth * 32}px` }} className={`mt-4 ${depth > 0 ? 'border-l-2 border-gray-200 pl-4' : ''}`}>
            <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-gray-600 text-sm"></i>
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <div 
                            className="font-medium text-sm flex items-center gap-2 cursor-pointer"
                            onContextMenu={(e) => authorTarget && openContextMenu(e, authorTarget, context)}
                        >
                            <span className={comment.displayName === '글쓴이' ? 'text-purple-600 font-bold' : ''}>
                                {comment.displayName}
                            </span>
                            {comment.displayUniversity && <span className="text-xs text-gray-400 font-light">· {comment.displayUniversity}</span>}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{formatDate(comment.createdAt)}</span>
                            <button 
                                onClick={() => onLikeComment(comment.id)} 
                                className={`flex items-center transition ${ isLiked ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600' }`}
                            >
                                <i className="fas fa-thumbs-up mr-1"></i>{comment.likeCount || 0}
                            </button>
                        </div>
                    </div>
                    <div className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</div>
                    <div className="flex items-center gap-4 mt-2">
                        {depth === 0 && (
                            <button onClick={() => onToggleReply(comment.id)} className="text-xs font-semibold text-gray-600 hover:underline">
                                답글 달기
                            </button>
                        )}
                        {user?.id === comment.user?.id && (
                            <button onClick={() => onDeleteComment(comment.id)} className="text-xs font-semibold text-red-500 hover:underline">
                                삭제
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {comment.children && comment.children.length > 0 && (
                <div className="mt-2">
                    {comment.children.map(reply => (
                        <Comment 
                            key={reply.id} 
                            comment={reply}
                            user={user} post={post} onLikeComment={onLikeComment}
                            onReplySubmit={onReplySubmit} onToggleReply={onToggleReply}
                            onDeleteComment={onDeleteComment} replyingTo={replyingTo}
                            formatDate={formatDate} depth={depth + 1} 
                        />
                    ))}
                </div>
            )}

            {replyingTo === comment.id && (
                <ReplyInputForm
                    authorNickname={comment.displayName}
                    onSubmit={(replyData) => onReplySubmit(replyData, comment.id)}
                />
            )}
        </div>
    );
}

export default function PostModal({
    post, comments, user, onClose, onAddComment, onLikePost,
    onLikeComment, onDeletePost, onEditPost, onDeleteComment, 
    onReportPost, formatDate, getCategoryName, onFetchComments
}) {
    const { openContextMenu } = useUserInteraction();
    const [commentText, setCommentText] = useState("");
    const [isCommentAnonymous, setIsCommentAnonymous] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState("");
    const [editedContent, setEditedContent] = useState("");
    const [isEditingAnonymous, setIsEditingAnonymous] = useState(false);
    const [showPostMenu, setShowPostMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => { const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) { setShowPostMenu(false); } }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);

    const authorIndexMap = useMemo(() => {
        const map = {};
        let currentIndex = 1;
        
        if (post.user) {
            const postAuthorKey = post.isAnonymous ? `anon_${post.user.id}` : post.user.id.toString();
            if (!(postAuthorKey in map)) {
                map[postAuthorKey] = 0;
            }
        }

        const sortedComments = [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        sortedComments.forEach(comment => {
            if (comment.user) {
                const commentAuthorKey = comment.isAnonymous ? `anon_${comment.user.id}` : comment.user.id.toString();
                if (!(commentAuthorKey in map)) {
                    map[commentAuthorKey] = currentIndex++;
                }
            }
        });
        return map;
    }, [comments, post.user, post.isAnonymous]);
    
    const commentTree = useMemo(() => {
        const processedComments = comments.map(comment => {
            let displayName, displayUniversity = null;

            if (comment.isDeleted || !comment.user) {
                // Do nothing
            } else {
                const isAuthorAdmin = comment.user.role === 'super_admin' || comment.user.role === 'sub_admin';
                const isPostAuthor = post.user && comment.user.id === post.user.id;
                displayUniversity = comment.user.university;

                if (isAuthorAdmin) {
                    displayName = `[관리자] ${comment.user.nickname}`;
                    displayUniversity = null;
                } else if (isPostAuthor) {
                    displayName = '글쓴이';
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
        processedComments.forEach(c => { map[c.id] = { ...c, children: [] }; });
        processedComments.forEach(c => {
            if (c.parent && map[c.parent.id]) {
                map[c.parent.id].children.push(map[c.id]);
            } else {
                roots.push(map[c.id]);
            }
        });
        return roots.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [comments, post.user, authorIndexMap]);

    const handleEnterEditMode = () => { setEditedTitle(post.title); setEditedContent(post.content); setIsEditingAnonymous(post.isAnonymous || false); setIsEditing(true); };
    const handleSaveEdit = () => { onEditPost(post.id, { title: editedTitle, content: editedContent, isAnonymous: isEditingAnonymous }); setIsEditing(false); };
    const handleCancelEdit = () => setIsEditing(false);
    
    const handleCommentSubmit = (content, parentId = null) => { if (!content.trim()) return; onAddComment(post.id, { content, isAnonymous: isCommentAnonymous, parentId }); setCommentText(""); setIsCommentAnonymous(false); };
    const handleReplySubmit = (replyData, parentId) => { onAddComment(post.id, { ...replyData, parentId }); setReplyingTo(null); };

    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(commentText); } };
    const handleToggleReply = (commentId) => setReplyingTo(current => (current === commentId ? null : commentId));
    const handleLikeCommentInternal = (commentId) => onLikeComment(post.id, commentId);
    const handleDeleteCommentInternal = (commentId) => onDeleteComment(post.id, commentId);

    const postAuthorDisplayName = post.isAnonymous ? "익명" : post.user?.nickname || "(알수없음)";
    const authorTarget = post.user ? { id: post.user.id, nickname: post.user.nickname, displayName: postAuthorDisplayName } : null;
    const context = { type: 'post', id: post.id, title: post.title };
    const isPostLiked = post.likedByUsers?.some(likeUser => likeUser.id === user?.id);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30" onClick={onClose}>
            <div className="modal-content bg-white rounded-xl w-[90%] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    {isEditing ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">게시글 수정</h2>
                                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                                <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"/>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">익명</label>
                                <div className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => setIsEditingAnonymous(!isEditingAnonymous)}>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isEditingAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400 border-2'}`}>
                                        {isEditingAnonymous && <i className="fas fa-check text-white text-xs"></i>}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                                <TextEditor initialContent={editedContent} onContentChange={setEditedContent} />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">취소</button>
                                <button onClick={handleSaveEdit} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">저장</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center space-x-2 mb-3"> <span className={`category-badge px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'notice' ? 'bg-red-500' : 'bg-gray-500'}`}>{getCategoryName(post.category)}</span> </div>
                                    <h2 className="text-2xl font-bold text-gray-800 truncate">{post.title}</h2>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 space-y-2">
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"> <i className="fas fa-times text-xl"></i> </button>
                                    <div className="relative" ref={menuRef}> <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-500 hover:text-gray-800 p-1"> <i className="fas fa-ellipsis-v"></i> </button> {showPostMenu && ( <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border"> <button onClick={() => { onReportPost(); setShowPostMenu(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"> 신고하기 </button> </div> )} </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mb-6 pb-6 border-b">
                                <div className="flex items-center space-x-3 cursor-pointer" onContextMenu={(e) => authorTarget && openContextMenu(e, authorTarget, context)}>
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><i className="fas fa-user text-gray-600"></i></div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2"><span>{postAuthorDisplayName}</span>{post.user?.university && <span className="text-xs text-gray-400 font-light">({post.user.university})</span>}</div>
                                        <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span><i className="fas fa-eye mr-1"></i>{post.views || 0}</span>
                                    <button onClick={() => onLikePost(post.id)} className={`flex items-center transition ${isPostLiked ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'}`}> <i className="fas fa-thumbs-up mr-1"></i>{post.likeCount || 0} </button>
                                </div>
                            </div>
                            <div className="prose max-w-none mb-8"> <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} /> </div>
                            <div className="border-t pt-6 mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-lg font-semibold">댓글 {comments.length || 0}개</h3>
                                      <button onClick={() => onFetchComments(post.id)} className="text-gray-400 hover:text-gray-600 transition" title="댓글 새로고침">
                                        <i className="fas fa-sync-alt"></i>
                                      </button>
                                    </div>
                                    {post.user?.id === user?.id && ( <div className="flex gap-2"> <button onClick={handleEnterEditMode} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition">수정</button> <button onClick={() => onDeletePost(post.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">삭제</button> </div> )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="댓글을 입력하세요..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block" style={{ minHeight: '42px' }}/>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}> <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isCommentAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400 border-2'}`}> {isCommentAnonymous && <i className="fas fa-check text-white text-xs"></i>} </div> <span className="text-sm text-gray-600">익명</span> </div>
                                        <button onClick={() => handleCommentSubmit(commentText)} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm">등록</button>
                                    </div>
                                </div>
                                <div className="space-y-4"> {commentTree.map(rootComment => ( <Comment key={rootComment.id} comment={rootComment} user={user} post={post} onLikeComment={handleLikeCommentInternal} onReplySubmit={handleReplySubmit} onToggleReply={handleToggleReply} onDeleteComment={handleDeleteCommentInternal} replyingTo={replyingTo} formatDate={formatDate} /> ))} </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

