"use client";

import { useState, useMemo } from "react";
import TextEditor from './TextEditor';
import { useUserInteraction } from "../../context/UserInteractionProvider";

// 익명 닉네임 처리 헬퍼 함수
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

// 답글 입력창 컴포넌트
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

// 댓글 + 대댓글 렌더링 컴포넌트
function Comment({ 
  comment, user, post, authorIndexMap, onLikeComment, onReplySubmit, 
  onToggleReply, onDeleteComment, replyingTo, formatDate, depth = 0 
}) {
  const { openContextMenu } = useUserInteraction();
  const isPostAuthor = comment.authorId === post.authorId;
  const authorIndex = authorIndexMap[comment.authorId];

  const authorTarget = { id: comment.authorId, nickname: comment.authorNickname };
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
              {isPostAuthor ? (
                <span className="text-purple-600 font-bold">글쓴이</span>
              ) : (
                <span>익명{authorIndex}</span>
              )}
              
              {(isPostAuthor && !post.isAnonymous) || (!isPostAuthor && !comment.isAnonymous) ? (
                <span className="text-xs text-gray-400 font-light">
                  ({formatAuthor(comment.authorNickname, false)} · {comment.university})
                </span>
              ) : (
                 <span className="text-xs text-gray-400 font-light">· {comment.university}</span>
              )}
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
              authorIndexMap={authorIndexMap}
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

      {replyingTo === comment.id && (
        <ReplyInputForm
            authorNickname={comment.authorNickname}
            onSubmit={(replyData) => onReplySubmit(replyData, comment.id)}
        />
      )}
    </div>
  );
}

export default function PostModal({
  post, comments, user, onClose, onAddComment, onLikePost,
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

  const authorIndexMap = useMemo(() => {
    const map = {};
    let currentIndex = 1;
    map[post.authorId] = 0;

    const sortedComments = [...comments].sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);

    sortedComments.forEach(comment => {
      if (!(comment.authorId in map)) {
        map[comment.authorId] = currentIndex++;
      }
    });
    return map;
  }, [comments, post.authorId]);
  
  const commentTree = useMemo(() => {
    const map = {};
    const roots = [];
    comments.forEach(comment => {
      map[comment.id] = { ...comment, children: [] };
    });
    comments.forEach(comment => {
      if (comment.parentId && map[comment.parentId]) {
        map[comment.parentId].children.push(map[comment.id]);
      } else {
        roots.push(map[comment.id]);
      }
    });
    return roots;
  }, [comments]);


  const handleEnterEditMode = () => {
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setIsEditingAnonymous(post.isAnonymous || false);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
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

  const authorTarget = { id: post.authorId, nickname: post.authorNickname };
  const context = { type: 'post', id: post.id };
  
  return (
    // 수정: Portal을 제거하고, 레이아웃을 위한 Tailwind CSS 클래스를 다시 추가합니다.
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" onClick={onClose}>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">익명</label>
                <div 
                  onClick={() => setIsEditingAnonymous(!isEditingAnonymous)}
                  className="w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 cursor-pointer transition-colors"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isEditingAnonymous ? 'translate-x-4 bg-red-500' : ''}`}></div>
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
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`category-badge px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'notice' ? 'bg-red-500' : post.category === 'free' ? 'bg-blue-500' : post.category === 'question' ? 'bg-green-500' : post.category === 'info' ? 'bg-yellow-500' : post.category === 'trade' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                      {getCategoryName(post.category)}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">{post.title}</h2>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                        <span>{formatAuthor(post.authorNickname, post.isAnonymous)}</span>
                        <span className="text-xs text-gray-400 font-light">·</span>
                        <span className="text-xs text-gray-400 font-light">{post.university}</span>
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
                      authorIndexMap={authorIndexMap}
                      onLikeComment={handleLikeCommentInternal}
                      onReplySubmit={handleReplySubmit}
                      onToggleReply={handleToggleReply}
                      onDeleteComment={handleDeleteCommentInternal} 
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
  );
}