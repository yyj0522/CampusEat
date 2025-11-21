"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "../../../lib/api";
import { useAuth } from "../../context/AuthProvider";
import PostList from "./PostList";

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
    const validCategories = ["all", "popular", "free", "question", "info", "trade"];
    return validCategories.includes(categoryFromUrl) ? categoryFromUrl : "all";
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => setCurrentPage(1), [currentCategory, currentSort, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (helpRef.current && !helpRef.current.contains(event.target)) {
        setShowHelp(false);
      }
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
      console.error(error);
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
      popular: "인기",
      notice: "공지"
    };
    return categoryNames[category] || category;
  };

  const filteredPosts = posts
    .filter((post) => {
      const isNotNotice = post.category !== "notice";
      
      let categoryMatch = true;
      if (currentCategory === "popular") {
        categoryMatch = (post.likeCount || 0) >= 10;
      } else if (currentCategory !== "all") {
        categoryMatch = post.category === currentCategory;
      }

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

  const categories = [
    { id: "all", label: "전체" },
    { id: "popular", label: "🔥 인기글" },
    { id: "free", label: "자유" },
    { id: "question", label: "질문" },
    { id: "info", label: "정보" },
    { id: "trade", label: "거래" },
  ];

  if (authLoading || !user || isLoadingPosts) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
        <style>{`
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fadeIn {
                animation: fadeIn 0.2s ease-out forwards;
            }
        `}</style>

      <main className="max-w-6xl mx-auto px-4 py-10 pb-24">
        <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg relative">
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-extrabold">커뮤니티</h1>
                <div ref={helpRef} className="relative">
                    <button onClick={() => setShowHelp(!showHelp)} className="text-white/70 hover:text-white transition-colors">
                        <i className="fa-solid fa-circle-question fa-lg"></i>
                    </button>
                    {showHelp && (
                        <>
                            <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowHelp(false)} />
                            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 text-left z-50 animate-fadeIn md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-0 md:mt-3 md:w-80 md:shadow-xl text-gray-800">
                                <h4 className="font-bold text-md mb-2 text-gray-800">커뮤니티 이용 수칙</h4>
                                <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                    <li>타인에 대한 비방, 비난, 욕설 등은 금지됩니다.</li>
                                    <li>광고성, 상업적 목적의 게시물은 제재 대상입니다.</li>
                                    <li>음란물, 불법 등 부적절한 콘텐츠는 게시할 수 없습니다.</li>
                                    <li className="font-bold text-red-500">위반 시 서비스 이용이 제한될 수 있습니다.</li>
                                </ul>
                                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <p className="text-lg opacity-90">학우들과 자유롭게 소통하고 정보를 공유하는 공간입니다.</p>
        </div>

        <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 p-1 rounded-full z-10 justify-center overflow-x-auto max-w-full scrollbar-hide">
                {categories.map((cat) => (
                    <button 
                        key={cat.id} 
                        onClick={() => setCurrentCategory(cat.id)} 
                        className={`px-3 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${currentCategory === cat.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="w-full">
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
            <div className="flex justify-center items-center mt-12 gap-2">
                <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
                >
                <i className="fas fa-chevron-left text-xs"></i>
                </button>

                {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => {
                if (pageCount > 10 && Math.abs(currentPage - number) > 4 && number !== 1 && number !== pageCount) return null;
                return (
                    <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`w-10 h-10 rounded-full text-sm font-bold transition ${
                        currentPage === number
                        ? "bg-black text-white shadow-lg"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                    >
                    {number}
                    </button>
                );
                })}

                <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                disabled={currentPage === pageCount}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
                >
                <i className="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
            )}
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50">
        <button 
            onClick={handleCreatePostClick} 
            className="bg-black text-white shadow-xl px-6 py-4 rounded-full hover:bg-gray-800 transition flex items-center gap-2 relative"
        >
            <i className="fas fa-pen"></i>
            <span className="font-bold">글 작성하기</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
        </button>
      </div>
    </div>
  );
}