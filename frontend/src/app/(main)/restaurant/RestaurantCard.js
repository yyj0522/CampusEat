"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import UserDisplay from '../../components/UserDisplay';

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

const WalkingDistance = ({ uniLocation, restLocation }) => {
  if (!uniLocation?.latitude || !uniLocation?.longitude || !restLocation?.latitude || !restLocation?.longitude) return null;
  const distanceKm = getDistanceFromLatLonInKm(uniLocation.latitude, uniLocation.longitude, restLocation.latitude, restLocation.longitude);
  const walkingSpeedKmh = 4.5;
  const timeMinutes = Math.round((distanceKm / walkingSpeedKmh) * 60);
  if (timeMinutes < 1) return <span className="ml-2 text-xs font-semibold text-blue-600">(바로 앞)</span>;
  return <span className="ml-2 text-xs font-semibold text-blue-600">(도보 {timeMinutes}분)</span>;
};

export default function RestaurantCard({
  restaurant, user, reviewsByRestaurant, expandedReviews, userLikes,
  universityLocation, handleToggleReviews, handleLikeToggle,
  openReviewModal, openReportModal, handleDeleteReview,
  reviewCurrentPage, onReviewPageChange
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReviewImage, setShowReviewImage] = useState({});
  const menuRef = useRef(null);
  const restaurantReviews = Array.isArray(reviewsByRestaurant[restaurant.id]) ? reviewsByRestaurant[restaurant.id] : [];
  const isExpanded = expandedReviews.has(restaurant.id);
  const isLiked = userLikes.has(restaurant.id);
  const reviewCount = restaurant.reviewCount || 0;
  const reviewsPerPage = 5;
  const totalReviewPages = Math.ceil(restaurantReviews.length / reviewsPerPage);
  const indexOfLastReview = reviewCurrentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = restaurantReviews.slice(indexOfFirstReview, indexOfLastReview);
  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const toggleReviewImage = (reviewId) => {
    setShowReviewImage(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };

  const generatePageNumbers = () => {
    if (totalReviewPages <= 1) return [];
    const pageWindow = 1;
    const pages = new Set();
    pages.add(1);
    pages.add(totalReviewPages);
    for (let i = 0; i <= pageWindow; i++) {
      pages.add(Math.max(1, reviewCurrentPage - i));
      pages.add(Math.min(totalReviewPages, reviewCurrentPage + i));
    }
    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const finalPages = [];
    let lastPage = 0;
    for (const page of sortedPages) {
      if (lastPage !== 0 && page - lastPage > 1) {
        finalPages.push('...');
      }
      finalPages.push(page);
      lastPage = page;
    }
    return finalPages;
  };
  const pageNumbers = generatePageNumbers();

  return (
    <div className="restaurant-card bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative">
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 font-semibold">이미지 준비중</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold mb-2 pr-2">{restaurant.name}</h3>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-gray-800 p-1">
              <i className="fas fa-ellipsis-v"></i>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    openReportModal(restaurant);
                    setShowMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  신고하기
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <i className="fas fa-map-marker-alt mr-1"></i>
          <span>{restaurant.vicinity}</span>
          <WalkingDistance uniLocation={universityLocation} restLocation={restaurant} />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center cursor-pointer" onClick={() => handleLikeToggle(restaurant.id, isLiked)}>
              <i className={`${isLiked ? 'fas text-red-500' : 'far'} fa-heart mr-1`}></i>
              {restaurant.likeCount || 0}
            </span>
            <span className="flex items-center">
              <i className="fas fa-comment text-blue-400 mr-1"></i>
              {reviewCount}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => handleToggleReviews(restaurant.id)} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm">리뷰보기</button>
          <button onClick={() => openReviewModal(restaurant)} className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition text-sm">리뷰작성</button>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          <h4 className="font-semibold mb-3">리뷰 ({reviewCount}개)</h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {currentReviews.length > 0 ? currentReviews.map(review => {
              const author = review.author;
              const isAuthorAdmin = author?.role === 'super_admin' || author?.role === 'sub_admin';

              return (
                <div key={review.id} className="relative group p-3 border rounded-lg bg-white">
                  <div className="flex items-center mb-2">
                    <div className="text-sm mr-2 text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                    <UserDisplay
                      userTarget={{ id: author?.id, nickname: author?.nickname }}
                      context={{ type: 'review', id: review.id, restaurantId: restaurant.id }}
                    >
                      <span className="text-xs text-gray-500 cursor-pointer hover:underline">
                        {formatDate(review.createdAt)} by {' '}
                        {isAuthorAdmin && <span className="font-bold text-blue-500">[관리자] </span>}
                        {author?.nickname || '탈퇴한 사용자'}
                      </span>
                    </UserDisplay>
                  </div>
                  <p className="text-sm text-gray-700 pr-8 mb-2">{review.content}</p>

                  {review.imageUrl && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleReviewImage(review.id)}
                        className="text-blue-500 hover:underline text-sm mb-2"
                      >
                        {showReviewImage[review.id] ? '사진 숨기기' : '사진 보기'}
                      </button>
                      {showReviewImage[review.id] && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden">
                          <Image
                            src={review.imageUrl}
                            alt="리뷰 사진"
                            layout="fill"
                            objectFit="contain"
                            className="bg-gray-100"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* [수정] 관리자이거나 작성자 본인이면 삭제 버튼 표시 */}
                  {(user && (user.id === author?.id || isAdmin)) && (
                    <button
                      onClick={() => handleDeleteReview(review.id, restaurant.id)}
                      className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="삭제"
                    >
                      <i className="fas fa-trash-alt fa-sm"></i>
                    </button>
                  )}
                </div>
              );
            }) : <p className="text-gray-500 text-sm text-center py-4">리뷰가 없습니다.</p>}
          </div>
          {totalReviewPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-1 sm:space-x-2">
              <button
                onClick={() => onReviewPageChange(restaurant.id, reviewCurrentPage - 1)}
                disabled={reviewCurrentPage === 1}
                className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <i className="fas fa-chevron-left fa-sm"></i>
              </button>
              {pageNumbers.map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 text-gray-500">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onReviewPageChange(restaurant.id, page)}
                    className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-sm font-medium border transition-colors duration-200 ${reviewCurrentPage === page ? 'bg-blue-600 text-white border-blue-600 shadow-md cursor-default' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => onReviewPageChange(restaurant.id, reviewCurrentPage + 1)}
                disabled={reviewCurrentPage === totalReviewPages}
                className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <i className="fas fa-chevron-right fa-sm"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}