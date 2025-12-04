"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import RestaurantCard from "./RestaurantCard";
import ReviewModal from "./ReviewModal";
import SubmissionModal from "./SubmissionModal";
import ReportModal from "./ReportModal";
import { FaDice, FaSpinner, FaBullhorn, FaList, FaCrown, FaCheckCircle } from "react-icons/fa";

const SkeletonCard = () => (
  <div className="bg-gray-100 rounded-3xl h-[400px] animate-pulse"></div>
);

const AlertModal = ({ message, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center flex flex-col items-center animate-scaleUp" onClick={(e) => e.stopPropagation()}>
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
          <FaCheckCircle className="text-3xl text-green-500" />
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">알림</h3>
        <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8 break-keep">{message}</p>
        <button onClick={onClose} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-gray-800 transition active:scale-95">확인</button>
      </div>
    </div>
  );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp">
        <h3 className="text-xl font-extrabold text-gray-900 mb-4">확인</h3>
        <p className="text-gray-600 font-medium mb-8 break-keep">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition">취소</button>
          <button onClick={onConfirm} className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-700 transition shadow-md">확인</button>
        </div>
      </div>
    </div>
  );
};

export default function RestaurantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [userLikes, setUserLikes] = useState(new Set());
  const [reviewsByRestaurant, setReviewsByRestaurant] = useState({});
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedReviews, setExpandedReviews] = useState(new Set());
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [alertModal, setAlertModal] = useState({ show: false, message: "" });
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewCurrentPages, setReviewCurrentPages] = useState({});
  const [isShuffling, setIsShuffling] = useState(false);
  const restaurantsPerPage = 5;
  const recommendationsRef = useRef(null);
  const showAlert = (message) => setAlertModal({ show: true, message });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user || !user.university) return;
    setRestaurantsLoading(true);
    try {
      const [restaurantRes, likesRes] = await Promise.all([
        apiClient.get(`/restaurants/university/${encodeURIComponent(user.university)}`),
        apiClient.get('/users/me/likes')
      ]);

      const fetchedRestaurants = restaurantRes.data;
      setAllRestaurants(fetchedRestaurants);
      setUserLikes(new Set(likesRes.data.map(like => like.restaurant.id)));

      const sortedByLikes = [...fetchedRestaurants].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      setTopRestaurants(sortedByLikes.slice(0, 10));

    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    } finally {
      setRestaurantsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchReviewsForRestaurant = async (restaurantId) => {
    try {
      const response = await apiClient.get(`/restaurants/${restaurantId}/reviews?cachebuster=${Date.now()}`);
      const fetchedReviews = Array.isArray(response.data) ? response.data : [];
      setReviewsByRestaurant(prev => ({ ...prev, [restaurantId]: fetchedReviews }));
    } catch (error) {
      console.error(`${restaurantId} 리뷰 로딩 오류:`, error);
    }
  };

  const handleToggleReviews = (restaurantId) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(restaurantId)) {
        newSet.delete(restaurantId);
      } else {
        newSet.add(restaurantId);
        fetchReviewsForRestaurant(restaurantId);
      }
      return newSet;
    });
  };

  const handleReviewSubmitted = (newReview) => {
    const restId = newReview.restaurantId;
    setAllRestaurants(prev => prev.map(r => r.id === restId ? { ...r, reviewCount: (r.reviewCount || 0) + 1 } : r));
    setReviewsByRestaurant(prev => ({ ...prev, [restId]: [newReview, ...(prev[restId] || [])] }));
    setExpandedReviews(prev => new Set(prev).add(restId));
    setReviewCurrentPages(prev => ({ ...prev, [restId]: 1 }));
  };

  const handleGetRecommendations = () => {
    if (!allRestaurants.length) return showAlert("추천할 맛집이 아직 없습니다.");
    setIsShuffling(true);
    setRecommendations([]);
    setTimeout(() => {
      const shuffled = [...allRestaurants].sort(() => 0.5 - Math.random());
      setRecommendations(shuffled.slice(0, 3));
      setIsShuffling(false);
      setTimeout(() => recommendationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }, 300);
  };

  const openReviewModal = (restaurant) => {
    if (!user) return showAlert("리뷰 작성을 위해 로그인이 필요합니다.");
    setSelectedRestaurant(restaurant);
    setIsReviewModalOpen(true);
  };

  const openReportModal = (restaurant) => {
    if (!user) return showAlert("신고를 위해 로그인이 필요합니다.");
    setSelectedRestaurant(restaurant);
    setIsReportModalOpen(true);
  };

  const handleLikeToggle = async (restaurantId) => {
    if (!user) return;
    try {
      const response = await apiClient.post(`/restaurants/${restaurantId}/like`);
      const { isLiked: newIsLiked, likeCount: newLikeCount } = response.data;
      setUserLikes(prev => {
        const newLikes = new Set(prev);
        if (newIsLiked) {
          newLikes.add(restaurantId);
        } else {
          newLikes.delete(restaurantId);
        }
        return newLikes;
      });
      setAllRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, likeCount: newLikeCount } : r));
    } catch (error) {
      showAlert(error.response?.data?.message || "좋아요 처리 실패");
    }
  };

  const handleDeleteReview = (reviewId, restaurantId) => setReviewToDelete({ reviewId, restaurantId });

  const executeDeleteReview = async () => {
    if (!reviewToDelete || !user) return;
    const { reviewId, restaurantId } = reviewToDelete;
    try {
      await apiClient.delete(`/restaurants/${restaurantId}/reviews/${reviewId}`);
      setReviewsByRestaurant(prev => ({ ...prev, [restaurantId]: prev[restaurantId].filter(r => r.id !== reviewId) }));
      setAllRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, reviewCount: Math.max((r.reviewCount || 0) - 1, 0) } : r));
      showAlert("리뷰가 삭제되었습니다.");
    } catch {
      showAlert("삭제 중 오류 발생");
    } finally {
      setReviewToDelete(null);
    }
  };

  const handleReviewPageChange = (restaurantId, page) => {
    setReviewCurrentPages(prev => ({ ...prev, [restaurantId]: page }));
  };

  const indexOfLastRestaurant = currentPage * restaurantsPerPage;
  const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
  const currentRestaurants = allRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
  const totalPages = Math.ceil(allRestaurants.length / restaurantsPerPage);

  const generatePageNumbers = () => {
    if (totalPages <= 1) return [];
    const pages = new Set([1, totalPages, Math.max(1, currentPage - 1), Math.min(totalPages, currentPage + 1)]);
    const sorted = Array.from(pages).sort((a, b) => a - b);
    const final = [];
    let last = 0;
    sorted.forEach(p => {
      if (last !== 0 && p - last > 1) final.push('...');
      final.push(p);
      last = p;
    });
    return final;
  };
  const pageNumbers = generatePageNumbers();

  return (
    <div>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.8) translateY(10px); } 70% { transform: scale(1.02) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popIn { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleUp { animation: scaleUp 0.2s ease-out forwards; }
      `}</style>

      <div className="flex flex-col sm:flex-row gap-4 mb-12 -mt-6 relative z-10 items-center justify-center">
        <button onClick={handleGetRecommendations} disabled={isShuffling} className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold shadow-md border border-gray-100 hover:bg-gray-50 transition flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto">
          {isShuffling ? <FaSpinner className="animate-spin text-lg" /> : <FaDice className="text-lg" />}
          <span>점심 추천받기</span>
        </button>
        <button onClick={() => setShowSubmissionModal(true)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-md active:scale-95 w-full sm:w-auto">
          <FaBullhorn className="text-lg" /> 맛집 제보하기
        </button>
      </div>

      {recommendations.length > 0 && (
        <section ref={recommendationsRef} className="mb-16 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500 font-medium md:hidden">옆으로 넘겨보세요</span>
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-0 px-1 snap-x snap-mandatory scrollbar-hide">
            {recommendations.map((resto, index) =>
              <div key={resto.id} className="min-w-[85vw] md:min-w-0 snap-center animate-popIn" style={{ animationDelay: `${index * 150}ms` }}>
                <RestaurantCard
                  restaurant={resto} user={user} reviewsByRestaurant={reviewsByRestaurant} expandedReviews={expandedReviews}
                  userLikes={userLikes} handleToggleReviews={handleToggleReviews} handleLikeToggle={handleLikeToggle}
                  openReviewModal={openReviewModal} openReportModal={openReportModal} handleDeleteReview={handleDeleteReview}
                  reviewCurrentPage={reviewCurrentPages[resto.id] || 1} onReviewPageChange={handleReviewPageChange}
                  priority={true}
                />
              </div>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaList className="text-gray-400" />
              {user?.university ? `${user.university} 주변 맛집` : '맛집 목록'}
            </h3>
          </div>

          <div className="space-y-6">
            {restaurantsLoading ? (
              <>
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </>
            ) : (
              currentRestaurants.map((restaurant, index) => (
                <RestaurantCard
                  key={restaurant.id} restaurant={restaurant} user={user} reviewsByRestaurant={reviewsByRestaurant}
                  expandedReviews={expandedReviews} userLikes={userLikes} handleToggleReviews={handleToggleReviews}
                  handleLikeToggle={handleLikeToggle} openReviewModal={openReviewModal} openReportModal={openReportModal}
                  handleDeleteReview={handleDeleteReview} reviewCurrentPage={reviewCurrentPages[restaurant.id] || 1}
                  onReviewPageChange={handleReviewPageChange}
                  priority={index < 2}
                />
              ))
            )}
          </div>

          {totalPages > 1 && !restaurantsLoading && (
            <div className="flex justify-center items-center mt-12 gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">&lt;</button>
              {pageNumbers.map((page, index) => (
                typeof page === 'number' ? (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-full text-sm font-bold transition ${currentPage === page ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}>
                    {page}
                  </button>
                ) : <span key={`ellipsis-${index}`} className="w-10 text-center text-gray-400">...</span>
              ))}
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">&gt;</button>
            </div>
          )}
        </div>

        <aside className="space-y-6 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <FaCrown className="text-yellow-500" /> 인기 맛집 TOP 10
            </h3>
            <div className="space-y-4">
              {restaurantsLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg w-full"></div>)}
                </div>
              ) : (
                topRestaurants.map((resto, index) => (
                  <div key={resto.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white ${index < 3 ? 'bg-rose-500' : 'bg-gray-300'}`}>{index + 1}</div>
                      <div className="font-medium text-sm text-gray-700 truncate group-hover:text-black">{resto.name}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} restaurant={selectedRestaurant} user={user} onReviewSubmitted={handleReviewSubmitted} onShowAlert={showAlert} />
      <SubmissionModal isOpen={showSubmissionModal} onClose={() => setShowSubmissionModal(false)} user={user} onShowAlert={showAlert} />
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} restaurant={selectedRestaurant} user={user} onShowAlert={showAlert} />

      {reviewToDelete && (
        <ConfirmModal message="정말 이 리뷰를 삭제하시겠습니까?" onConfirm={executeDeleteReview} onCancel={() => setReviewToDelete(null)} />
      )}
      {alertModal.show && (
        <AlertModal message={alertModal.message} onClose={() => setAlertModal({ show: false, message: "" })} />
      )}
    </div>
  );
}