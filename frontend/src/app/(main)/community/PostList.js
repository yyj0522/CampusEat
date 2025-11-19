"use client";

export default function PostList({
  posts, openPost, currentCategory, setCurrentCategory,
  currentSort, setCurrentSort, searchQuery, setSearchQuery,
  formatDate, getCategoryName
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { key: 'all', name: '전체' },
            { key: 'free', name: '자유' },
            { key: 'question', name: '질문' },
            { key: 'info', name: '정보' },
            { key: 'trade', name: '거래' }
          ].map(category => (
            <button 
              key={category.key} 
              onClick={() => setCurrentCategory(category.key)} 
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                currentCategory === category.key 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select 
            value={currentSort} 
            onChange={(e) => setCurrentSort(e.target.value)} 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-gray-50"
          >
            <option value="latest">최신순</option>
            <option value="likes">추천순</option>
            <option value="views">조회순</option>
          </select>
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="검색어 입력" 
              className="w-full px-4 py-2 pl-9 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 bg-gray-50" 
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          </div>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 text-center">
        <div className="col-span-1">분류</div>
        <div className="col-span-6 text-left pl-2">제목</div>
        <div className="col-span-2">작성자</div>
        <div className="col-span-1">작성일</div>
        <div className="col-span-1">조회</div>
        <div className="col-span-1">추천</div>
      </div>

      <div className="divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <i className="fas fa-exclamation-circle text-4xl mb-3 text-gray-300"></i>
            <p>등록된 게시글이 없습니다.</p>
          </div>
        ) : (
          posts.map(post => {
            const displayName = post.authorDisplayName 
                ? post.authorDisplayName 
                : (post.isAnonymous ? '익명' : (post.user ? post.user.nickname : '알 수 없음'));
            
            return (
              <div 
                key={post.id} 
                onClick={() => openPost(post)}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-purple-50 cursor-pointer transition-colors items-center group"
              >
                <div className="col-span-1 md:col-span-1 flex md:justify-center">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600`}>
                    {getCategoryName(post.category)}
                  </span>
                </div>

                <div className="col-span-1 md:col-span-6 text-left md:pl-2 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm md:text-base font-medium text-gray-800 truncate group-hover:text-purple-700 max-w-[80%]">
                      {post.title}
                    </span>
                    {post.commentCount > 0 && (
                      <span className="ml-2 text-xs font-bold text-red-500 flex-shrink-0">
                        [{post.commentCount}]
                      </span>
                    )}
                    {post.imageUrl && <i className="fas fa-image ml-2 text-gray-400 text-xs flex-shrink-0"></i>}
                  </div>
                  <div className="md:hidden flex items-center text-xs text-gray-400 mt-1 gap-2">
                    <span>{displayName}</span>
                    <span>·</span>
                    <span>{formatDate(post.createdAt)}</span>
                    <span>·</span>
                    <span>조회 {post.views}</span>
                    <span>·</span>
                    <span>추천 {post.likeCount}</span>
                  </div>
                </div>

                <div className="hidden md:block col-span-2 text-center text-sm text-gray-600 truncate px-1">
                  {displayName}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-gray-400">
                  {formatDate(post.createdAt)}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-gray-500">
                  {post.views}
                </div>
                <div className="hidden md:block col-span-1 text-center text-xs text-gray-500 font-medium">
                  {post.likeCount}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}