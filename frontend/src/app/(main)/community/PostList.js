// src/app/(main)/community/PostList.js
"use client";

import UserDisplay from '../../components/UserDisplay'; 

export default function PostList({
  posts, openPost, user, currentCategory, setCurrentCategory,
  currentSort, setCurrentSort, searchQuery, setSearchQuery,
  formatDate, getCategoryName
}) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {[ { key: 'all', name: '전체' }, { key: 'notice', name: '공지사항' }, { key: 'free', name: '자유게시판' }, { key: 'question', name: '질문' }, { key: 'info', name: '정보공유' }, { key: 'trade', name: '거래' } ].map(category => (
              <button key={category.key} onClick={() => setCurrentCategory(category.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${currentCategory === category.key ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {category.name}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">정렬:</span>
            <select value={currentSort} onChange={(e) => setCurrentSort(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm">
              <option value="latest">최신순</option>
              <option value="likes">추천순</option>
              <option value="views">조회순</option>
              <option value="comments">댓글순</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="제목, 내용으로 검색..." className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          </div>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">검색</button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <i className="fas fa-search text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{searchQuery ? "검색 결과가 없습니다" : "게시글이 없습니다"}</h3>
            <p className="text-gray-500">{searchQuery ? "다른 키워드로 검색해보세요." : "첫 번째 게시글을 작성해보세요!"}</p>
          </div>
        ) : (
          posts.map(post => {
            const displayName = post.isAnonymous ? '익명' : (post.user ? post.user.nickname : '알 수 없음');
            const userTarget = post.user ? { id: post.user.id, nickname: post.user.nickname, displayName } : null;
            const isLiked = post.likedByUsers?.some(likeUser => likeUser.id === user?.id);

            return (
              <div key={post.id} className="post-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <div onClick={() => openPost(post)} className="cursor-pointer">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'notice' ? 'bg-red-500' : 'bg-gray-500'}`}>{getCategoryName(post.category)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-800 mb-2 hover:text-purple-600 transition">{post.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content.replace(/<[^>]*>/g, '')}</p>
                </div>
                <div className="flex justify-between items-center text-sm pt-4 border-t mt-4">
                  {/* ✅ 오류 수정: context 객체에 title: post.title을 추가합니다. */}
                  <UserDisplay userTarget={userTarget} context={{ type: 'post', id: post.id, title: post.title }}>
                    <div className="flex items-center space-x-2 text-gray-500 cursor-pointer">
                      <i className="fas fa-user-circle"></i>
                      <span>{displayName}</span>
                      {post.user?.university && <span className="text-xs text-gray-400">({post.user.university})</span>}
                    </div>
                  </UserDisplay>
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center text-gray-500"><i className="fas fa-eye mr-1"></i>{post.views || 0}</span>
                    <span className={`flex items-center transition ${isLiked ? 'text-blue-500 font-semibold' : 'text-gray-500'}`}><i className="fas fa-thumbs-up mr-1"></i>{post.likeCount || 0}</span>
                    <span className="flex items-center text-gray-500"><i className="fas fa-comments mr-1 text-green-500"></i>{post.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

