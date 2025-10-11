"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import TextEditor from './TextEditor';
import { useUserInteraction } from "../../context/UserInteractionProvider";
import { db } from "../../../firebase"; 
import { doc, collection, writeBatch, increment, serverTimestamp, getDocs, query, where } from "firebase/firestore";

const formatAuthor = (nickname, isAnonymous) => {
    if (!nickname) return "";
    if (isAnonymous) {
        if (nickname.length > 1) {
            return `${nickname.substring(0, 1)}${'*'.repeat(nickname.length - 1)}`;
        }
        return nickname;
    }
    return nickname;
};

function ReplyInputForm({ authorNickname, onSubmit }) {
    const [replyText, setReplyText] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleSubmit = () => {
        if (!replyText.trim()) return;
        onSubmit({ text: replyText, isAnonymous });
        setReplyText("");
        setIsAnonymous(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="bg-gray-100 rounded-lg p-3 mt-4">
            <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`${authorNickname}님에게 답글 남기기...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block"
                style={{minHeight: '42px'}}
                autoFocus
            />
            <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400 border-2'}`}>
                        {isAnonymous && <i className="fas fa-check text-white text-xs"></i>}
                    </div>
                    <span className="text-sm text-gray-600">익명</span>
                </div>
                <button
                    onClick={handleSubmit}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm"
                >
                    등록
                </button>
            </div>
        </div>
    );
};

function Comment({ 
    comment, user, post, onLikeComment, onReplySubmit, 
    onToggleReply, onDeleteComment, replyingTo, formatDate, authorDataMap, depth = 0 
}) {
    const { openContextMenu } = useUserInteraction();
    
    const authorTarget = { 
        id: comment.authorId, 
        nickname: comment.authorNickname,
        displayName: comment.displayName,
        role: authorDataMap[comment.authorId]?.role
    };
    const context = { type: 'comment', id: comment.id, postId: post.id };

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
                            onContextMenu={(e) => openContextMenu(e, authorTarget, context)}
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
                                className={`flex items-center transition ${
                                    comment.likedBy?.includes(user?.uid) ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'
                                }`}
                            >
                                <i className="fas fa-thumbs-up mr-1"></i>{comment.likes || 0}
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
                        {user?.uid === comment.authorId && (
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
                            user={user}
                            post={post}
                            onLikeComment={onLikeComment}
                            onReplySubmit={onReplySubmit}
                            onToggleReply={onToggleReply}
                            onDeleteComment={onDeleteComment}
                            replyingTo={replyingTo}
                            formatDate={formatDate}
                            authorDataMap={authorDataMap}
                            depth={depth + 1} 
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

const AlertModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
                <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
                <button onClick={onClose} className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700 transition w-full">
                    확인
                </button>
            </div>
        </div>
    );
};

const ReportPostModal = ({ isOpen, onClose, post, user, nickname, onShowAlert }) => {
    const [reason, setReason] = useState('direct');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportReasons = {
        direct: '직접 작성할게요.',
        explicit: '부정적이거나 선정적인 게시물이에요.',
        spam: '스팸 또는 광고성 게시물이에요.',
        illegal: '불법 정보 또는 활동을 포함하고 있어요.',
        doxxing: '개인정보 노출 또는 사생활 침해 우려가 있어요.',
        abuse: '욕설, 비방, 혐오 표현을 담고 있어요.'
    };

    useEffect(() => {
        if (!isOpen) {
            setReason('direct');
            setCustomReason('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const finalReason = reason === 'direct' ? customReason.trim() : reportReasons[reason];
        if (!finalReason) {
            onShowAlert('신고 사유를 입력하거나 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const postDocRef = doc(db, "posts", post.id);
            const reportColRef = collection(postDocRef, "reports");
            
            const batch = writeBatch(db);
            
            const newReportRef = doc(reportColRef);
            batch.set(newReportRef, {
                reporterId: user.uid,
                reporterNickname: nickname || null,
                reason: finalReason,
                createdAt: serverTimestamp(),
            });

            batch.update(postDocRef, { reportCount: increment(1) });
            
            await batch.commit();

            onShowAlert('신고가 성공적으로 접수되었습니다.');
            onClose();
        } catch (error) {
            console.error('신고 접수 오류:', error);
            onShowAlert('신고 접수 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40" onClick={onClose}>
            <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">게시글 신고하기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 사유</label>
                        <select
                            id="report-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border p-2 rounded-lg"
                        >
                            {Object.entries(reportReasons).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                    </div>
                    {reason === 'direct' && (
                        <div>
                            <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 내용 작성</label>
                            <textarea
                                id="custom-reason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                rows="3"
                                className="w-full border p-2 rounded-lg"
                                placeholder="신고 사유를 자세히 적어주세요."
                            ></textarea>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition" disabled={isSubmitting}>취소</button>
                        <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition" disabled={isSubmitting}>
                            {isSubmitting ? '접수 중...' : '접수하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function PostModal({
    post, comments, user, nickname, onClose, onAddComment, onLikePost,
    onLikeComment, onDeletePost, onEditPost, onDeleteComment, 
    formatDate, getCategoryName
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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const menuRef = useRef(null);
    const [authorDataMap, setAuthorDataMap] = useState({});

    useEffect(() => {
        const fetchAuthorData = async () => {
            if (!comments || comments.length === 0) {
                setAuthorDataMap({});
                return;
            }
            const authorIds = [...new Set(comments.map(c => c.authorId).filter(Boolean))];
            if (authorIds.length === 0) return;

            const usersRef = collection(db, "users");
            const q = query(usersRef, where('__name__', 'in', authorIds));
            try {
                const userSnapshot = await getDocs(q);
                const newAuthorMap = {};
                userSnapshot.forEach(doc => {
                    newAuthorMap[doc.id] = doc.data();
                });
                setAuthorDataMap(newAuthorMap);
            } catch (error) {
                console.error("Error fetching comment authors:", error);
            }
        };
        fetchAuthorData();
    }, [comments]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowPostMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const authorIndexMap = useMemo(() => {
        const map = {};
        let currentIndex = 1;
        
        const postAuthorKey = post.isAnonymous ? `anon_${post.authorId}` : post.authorId;
        if (!(postAuthorKey in map)) {
            map[postAuthorKey] = 0;
        }

        const sortedComments = [...comments].sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

        sortedComments.forEach(comment => {
            const commentAuthorKey = comment.isAnonymous ? `anon_${comment.authorId}` : comment.authorId;
            if (!(commentAuthorKey in map)) {
                map[commentAuthorKey] = currentIndex++;
            }
        });
        return map;
    }, [comments, post.authorId, post.isAnonymous]);
    
    const commentTree = useMemo(() => {
        const map = {};
        const roots = [];

        const processedComments = comments.map(comment => {
            const authorData = authorDataMap[comment.authorId];
            const isAuthorAdmin = authorData && (authorData.role === 'super_admin' || authorData.role === 'sub_admin');
            const isPostAuthor = comment.authorId === post.authorId;

            let displayName;
            let displayUniversity = comment.university;

            if (isAuthorAdmin) {
                displayName = `[관리자] ${authorData.nickname || comment.authorNickname}`;
                displayUniversity = null;
            } else if (isPostAuthor) {
                displayName = '글쓴이';
            } else if (comment.isAnonymous) {
                const authorDisplayKey = `anon_${comment.authorId}`;
                const authorIndex = authorIndexMap[authorDisplayKey];
                displayName = `익명${authorIndex}`;
            } else {
                displayName = comment.authorNickname;
            }
            
            return { ...comment, displayName, displayUniversity };
        });

        processedComments.forEach(comment => {
            map[comment.id] = { ...comment, children: [] };
        });
        processedComments.forEach(comment => {
            if (comment.parentId && map[comment.parentId]) {
                map[comment.parentId].children.push(map[comment.id]);
            } else {
                roots.push(map[comment.id]);
            }
        });
        return roots.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
    }, [comments, authorDataMap, post.authorId, authorIndexMap]);

    const handleEnterEditMode = () => {
        setEditedTitle(post.title);
        setEditedContent(post.content);
        setIsEditingAnonymous(post.isAnonymous || false);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        if (!editedTitle.trim() || !editedContent.trim()) {
            setAlertMessage("제목과 내용을 모두 입력해주세요.");
            return;
        }
        onEditPost(post.id, {
            title: editedTitle,
            content: editedContent,
            isAnonymous: isEditingAnonymous,
        });
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleCommentSubmit = (text, parentId = null) => {
        if (!text.trim()) return;
        onAddComment(post.id, { text, isAnonymous: isCommentAnonymous, parentId });
        setCommentText("");
        setIsCommentAnonymous(false);
    };

    const handleReplySubmit = (replyData, parentId) => {
        onAddComment(post.id, { ...replyData, parentId });
        setReplyingTo(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommentSubmit(commentText);
        }
    };
    
    const handleToggleReply = (commentId) => {
        setReplyingTo(current => (current === commentId ? null : commentId));
    };

    const handleLikeCommentInternal = (commentId) => {
        onLikeComment(post.id, commentId);
    }
    
    const handleDeleteCommentInternal = (commentId) => {
        onDeleteComment(post.id, commentId);
    };

    const postAuthorDisplayName = formatAuthor(post.authorNickname, post.isAnonymous);
    const authorTarget = { 
        id: post.authorId, 
        nickname: post.authorNickname,
        displayName: postAuthorDisplayName
    };
    const context = { type: 'post', id: post.id };
    
    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30" onClick={onClose}>
            <div className="modal-content bg-white rounded-xl w-[90%] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    {isEditing ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">게시글 수정</h2>
                                <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                                <input 
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
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
                                <TextEditor 
                                    initialContent={editedContent}
                                    onContentChange={setEditedContent}
                                />
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
                                    <div className="flex items-center space-x-2 mb-3">
                                        <span className={`category-badge px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'notice' ? 'bg-red-500' : post.category === 'free' ? 'bg-blue-500' : post.category === 'question' ? 'bg-green-500' : post.category === 'info' ? 'bg-yellow-500' : post.category === 'trade' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                                            {getCategoryName(post.category)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-gray-800 truncate">{post.title}</h2>
                                        <div className="relative flex-shrink-0" ref={menuRef}>
                                            <button onClick={() => setShowPostMenu(!showPostMenu)} className="text-gray-500 hover:text-gray-800 p-1 ml-2">
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                            {showPostMenu && (
                                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                                                    <button
                                                        onClick={() => {
                                                            setIsReportModalOpen(true);
                                                            setShowPostMenu(false);
                                                        }}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        신고하기
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            <div className="flex items-center justify-between mb-6 pb-6 border-b">
                                <div 
                                    className="flex items-center space-x-3 cursor-pointer"
                                    onContextMenu={(e) => openContextMenu(e, authorTarget, context)}
                                >
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><i className="fas fa-user text-gray-600"></i></div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            <span>{postAuthorDisplayName}</span>
                                            {post.university && <>
                                                <span className="text-xs text-gray-400 font-light">·</span>
                                                <span className="text-xs text-gray-400 font-light">{post.university}</span>
                                            </>}
                                        </div>
                                        <div className="text-sm text-gray-500">{formatDate(post.createdAt)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span><i className="fas fa-eye mr-1"></i>{post.views || 0}</span>
                                    <button onClick={() => onLikePost(post.id)} className={`flex items-center transition ${post.likedBy?.includes(user?.uid) ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-blue-600'}`}>
                                        <i className="fas fa-thumbs-up mr-1"></i>{post.likeCount || 0}
                                    </button>
                                </div>
                            </div>
                            <div className="prose max-w-none mb-8">
                                <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
                            </div>

                            <div className="border-t pt-6 mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">댓글 {comments.length || 0}개</h3>
                                    {post.authorId === user?.uid && (
                                        <div className="flex gap-2">
                                            <button onClick={handleEnterEditMode} className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition">수정</button>
                                            <button onClick={() => onDeletePost(post.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition">삭제</button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="댓글을 입력하세요..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none block" style={{ minHeight: '42px' }}/>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCommentAnonymous(!isCommentAnonymous)}>
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isCommentAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400 border-2'}`}>
                                                {isCommentAnonymous && <i className="fas fa-check text-white text-xs"></i>}
                                            </div>
                                            <span className="text-sm text-gray-600">익명</span>
                                        </div>
                                        <button onClick={() => handleCommentSubmit(commentText)} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition text-sm">등록</button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {commentTree.map(rootComment => (
                                        <Comment 
                                            key={rootComment.id}
                                            comment={rootComment}
                                            user={user}
                                            post={post}
                                            onLikeComment={handleLikeCommentInternal}
                                            onReplySubmit={handleReplySubmit}
                                            onToggleReply={handleToggleReply}
                                            onDeleteComment={handleDeleteCommentInternal} 
                                            replyingTo={replyingTo}
                                            formatDate={formatDate}
                                            authorDataMap={authorDataMap}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <AlertModal message={alertMessage} onClose={() => setAlertMessage("")} />
            <ReportPostModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                post={post}
                user={user}
                nickname={nickname}
                onShowAlert={setAlertMessage}
            />
        </div>
    );
}