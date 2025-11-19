"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../../lib/api";
import { useAuth } from "../../context/AuthProvider";

import PostList from "./PostList";
import "../../styles/style.css";

export default function CommunityPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentSort, setCurrentSort] = useState("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  
  const postsPerPage = 30;
  const helpRef = useRef(null);

  const [currentCategory, setCurrentCategory] = useState(() => {
    const categoryFromUrl = searchParams.get("category");
    const validCategories = ["free", "question", "info", "trade"];
    return validCategories.includes(categoryFromUrl) ? categoryFromUrl : "all";
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => setCurrentPage(1), [currentCategory, currentSort, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (helpRef.current && !helpRef.current.contains(event.target)) setShowHelp(false);
    }
    if (showHelp) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHelp]);

  const fetchPosts = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingPosts(true);
    try {
      const response = await apiClient.get("/posts");
      setPosts(response.data);
    } catch (error) {
      console.error("게시글 목록 로딩 실패:", error);
    } finally {
      if (showLoading) setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchPosts(true);
  }, [user, fetchPosts]);

  const openPost = useCallback(
    (post) => {
      router.push(`/community/${post.id}`);
    },
    [router]
  );

  const handleCreatePostClick = () => {
    router.push("/community/create");
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
      return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
    }
  };

  const getCategoryName = (category) => {
    const categoryNames = {
      free: "자유",
      question: "질문",
      info: "정보",
      trade: "거래",
    };
    return categoryNames[category] || category;
  };

  const filteredPosts = posts
    .filter((post) => {
      const isNotNotice = post.category !== "notice";
      const categoryMatch = currentCategory === "all" || post.category === currentCategory;
      const searchMatch =
        !searchQuery ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
      return isNotNotice && categoryMatch && searchMatch;
    })
    .sort((a, b) => {
      switch (currentSort) {
        case "latest": return new Date(b.createdAt) - new Date(a.createdAt);
        case "likes": return (b.likeCount || 0) - (a.likeCount || 0);
        case "views": return (b.views || 0) - (a.views || 0);
        case "comments": return (b.commentCount || 0) - (a.commentCount || 0);
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const pageCount = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  const popularPosts = posts
    .filter((p) => p.category !== "notice")
    .filter((p) => new Date(p.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000))
    .sort((a, b) => (b.views || 0) - (a.views || 0))
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
    <div className="min-h-screen bg-white">
      <main className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center px-4 bg-white space-y-6 mb-8">
            <div ref={helpRef} className="relative flex justify-center items-center gap-2">
              <h1 className="text-4xl font-bold text-gray-800">커뮤니티</h1>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fa-solid fa-circle-question fa-lg"></i>
              </button>
              {showHelp && (
                <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                  <h4 className="font-bold text-md mb-2 text-gray-800">커뮤니티 이용 수칙</h4>
                  <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>타인에 대한 비방, 비난, 욕설 등은 금지됩니다.</li>
                    <li>광고성, 상업적 목적의 게시물은 제재 대상입니다.</li>
                    <li>음란물, 불법 등 부적절한 콘텐츠는 게시할 수 없습니다.</li>
                    <li className="font-semibold text-red-600">
                      위반 시 서비스 이용이 제한되거나 관련 법령에 따라 처벌받을 수 있습니다.
                    </li>
                  </ul>
                  <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xl text-gray-600">학우들과 자유롭게 소통하는 공간입니다.</p>
            
            <button
              onClick={handleCreatePostClick}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 mt-4 md:mt-0"
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
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-600 bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>

                  {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => {
                    if (pageCount > 10 && Math.abs(currentPage - number) > 4 && number !== 1 && number !== pageCount) return null;
                    return (
                      <button
                        key={number}
                        onClick={() => setCurrentPage(number)}
                        className={`px-3 py-1 rounded border ${
                          currentPage === number
                            ? "bg-purple-600 text-white border-purple-600"
                            : "text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {number}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                    disabled={currentPage === pageCount}
                    className="px-3 py-1 text-gray-600 bg-white rounded border hover:bg-gray-50 disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>

            <aside className="space-y-6 hidden lg:block">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-fire text-red-500"></i> 실시간 인기글
                  </h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {popularPosts.length === 0 ? (
                    <p className="text-gray-400 text-xs text-center py-4">인기글이 없습니다.</p>
                  ) : (
                    popularPosts.map((post, index) => (
                      <div
                        key={post.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openPost(post)}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0 ${
                            index < 3 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm text-gray-700 font-medium truncate mb-1">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span><i className="fas fa-heart mr-1"></i>{post.likeCount}</span>
                              <span><i className="fas fa-comment mr-1"></i>{post.commentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}