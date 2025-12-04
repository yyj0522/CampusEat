"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { FaMapMarkerAlt, FaHeart, FaRegHeart, FaRegComment, FaSearch, FaRoute, FaEllipsisV, FaTrashAlt, FaImage } from "react-icons/fa";

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
  if (timeMinutes < 1) return <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">바로 앞</span>;
  return <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">도보 {timeMinutes}분</span>;
};

export default function RestaurantCard({
  restaurant, user, reviewsByRestaurant, expandedReviews, userLikes,
  universityLocation, handleToggleReviews, handleLikeToggle,
  openReviewModal, openReportModal, handleDeleteReview,
  reviewCurrentPage, onReviewPageChange, priority = false
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
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const toggleReviewImage = (reviewId) => setShowReviewImage(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("ko-KR") : "";

  const handleOpenNaverSearch = () => {
    const query = encodeURIComponent(restaurant.name);
    const url = restaurant.latitude && restaurant.longitude
        ? `https://map.naver.com/p/search/${query}?c=15.00,${restaurant.longitude},${restaurant.latitude},0,0,0,dh`
        : `https://search.naver.com/search.naver?query=${query}`;
    window.open(url, '_blank');
  };

  const handleFindRoute = () => {
    if (!navigator.geolocation) {
        alert("위치 정보를 사용할 수 없습니다.");
        return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const destLat = restaurant.latitude || '';
        const destLng = restaurant.longitude || '';
        const destName = encodeURIComponent(restaurant.name);
        const url = `https://map.naver.com/p/directions/${longitude},${latitude},내위치/${destLng},${destLat},${destName}/-/transit?c=15.00,0,0,0,dh`;
        window.open(url, '_blank');
    }, () => {
        alert("위치 정보 접근을 허용해주세요.");
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
      <div className="relative h-52 w-full bg-gray-200 flex-shrink-0">
        {restaurant.photoUrl ? (
           <Image 
             src={restaurant.photoUrl} 
             alt={restaurant.name} 
             fill 
             className="object-cover" 
             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             priority={priority}
           />
        ) : (
           <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100"><FaImage className="text-4xl" /></div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
                <h3 className="text-xl font-extrabold text-gray-900 leading-tight mb-1 truncate pr-2">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 font-medium">{restaurant.category || "음식점"}</p>
            </div>
            <div className="relative flex-shrink-0" ref={menuRef}>
                <button onClick={() => setShowMenu(!showMenu)} aria-label="메뉴 더보기" className="text-gray-400 hover:text-gray-800 transition p-1">
                    <FaEllipsisV />
                </button>
                {showMenu && (
                    <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-10">
                        <button onClick={() => { openReportModal(restaurant); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition">신고하기</button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-4 min-h-[20px]">
          <FaMapMarkerAlt className="mr-2 text-rose-500 flex-shrink-0" />
          <span className="truncate mr-1">{restaurant.vicinity}</span>
          <WalkingDistance uniLocation={universityLocation} restLocation={restaurant} />
        </div>

        <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100 mt-auto">
            <div className="flex gap-4">
                <button onClick={() => handleLikeToggle(restaurant.id)} aria-label="좋아요" className={`flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`}>
                    {isLiked ? <FaHeart className="text-lg" /> : <FaRegHeart className="text-lg" />}
                    <span className="text-sm font-bold">{restaurant.likeCount || 0}</span>
                </button>
                <div className="flex items-center gap-1.5 text-gray-400">
                    <FaRegComment className="text-lg" />
                    <span className="text-sm font-bold">{reviewCount}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={handleOpenNaverSearch} aria-label="네이버 검색" className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition shadow-sm">
                    <FaSearch className="text-sm" />
                </button>
                <button onClick={handleFindRoute} aria-label="길찾기" className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition shadow-sm">
                    <FaRoute className="text-sm" />
                </button>
            </div>
        </div>

        <div className="flex gap-2">
             <button onClick={() => handleToggleReviews(restaurant.id)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${isExpanded ? 'bg-gray-100 text-gray-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                {isExpanded ? '리뷰 닫기' : '리뷰 보기'}
            </button>
            <button onClick={() => openReviewModal(restaurant)} className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition shadow-md">
                리뷰 작성
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-5 border-t border-gray-100">
            {currentReviews.length > 0 ? currentReviews.map(review => (
                <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{review.author?.nickname?.[0] || '익'}</div>
                            <div>
                                <span className="text-sm font-bold text-gray-900">{review.author?.nickname || '탈퇴한 사용자'}</span>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <span className="text-yellow-400">{'★'.repeat(review.rating)}</span>
                                    <span>{formatDate(review.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                        {(user && (user.id === review.author?.id || isAdmin)) && (
                            <button onClick={() => handleDeleteReview(review.id, restaurant.id)} aria-label="리뷰 삭제" className="text-gray-300 hover:text-red-500 transition px-2">
                                <FaTrashAlt />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-10">{review.content}</p>
                    {review.imageUrl && (
                        <div className="mt-3 pl-10">
                            <button onClick={() => toggleReviewImage(review.id)} className="text-xs font-bold text-blue-500 hover:underline mb-2 flex items-center gap-1">
                                <FaImage /> {showReviewImage[review.id] ? '사진 접기' : '사진 보기'}
                            </button>
                            {showReviewImage[review.id] && (
                                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-100">
                                    <Image src={review.imageUrl} alt="리뷰 사진" fill className="object-contain bg-gray-50" sizes="100vw" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )) : <div className="text-center py-8 text-gray-400 text-sm font-medium">아직 리뷰가 없습니다.</div>}
            <div className="flex justify-center items-center mt-6 gap-1">
                <button onClick={() => onReviewPageChange(restaurant.id, reviewCurrentPage - 1)} disabled={reviewCurrentPage === 1} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-50 transition">&lt;</button>
                <button onClick={() => onReviewPageChange(restaurant.id, reviewCurrentPage + 1)} disabled={reviewCurrentPage === totalReviewPages} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-50 transition">&gt;</button>
            </div>
        </div>
      )}
    </div>
  );
}