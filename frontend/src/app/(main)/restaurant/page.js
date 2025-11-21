"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import RestaurantCard from "./RestaurantCard";
import ReviewModal from "./ReviewModal";
import SubmissionModal from "./SubmissionModal";
import ReportModal from "./ReportModal";

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
            onClick={onClose}
        >
            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-sm">
                    <i className="fas fa-check text-2xl text-green-500"></i>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-2">알림</h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed mb-8 break-keep">
                    {message}
                </p>
                <button 
                    onClick={onClose} 
                    className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-sm shadow-md hover:bg-gray-800 transition active:scale-95"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.2s ease-out forwards;
                }
            `}</style>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scaleUp">
                <h3 className="text-xl font-extrabold text-gray-900 mb-4">확인</h3>
                <p className="text-gray-600 font-medium mb-8 break-keep">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-200 transition">취소</button>
                    <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-red-600 transition shadow-md">확인</button>
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
    const [showHelp, setShowHelp] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [reviewCurrentPages, setReviewCurrentPages] = useState({});
    const [isShuffling, setIsShuffling] = useState(false);
    const restaurantsPerPage = 5;

    const recommendationsRef = useRef(null);
    const helpRef = useRef(null);

    const showAlert = (message) => setAlertModal({ show: true, message });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);
    
    const fetchData = useCallback(async () => {
        if (!user || !user.university) return;
        setRestaurantsLoading(true);
        try {
            const restaurantRes = await apiClient.get(`/restaurants/university/${encodeURIComponent(user.university)}`);
            setAllRestaurants(restaurantRes.data);

            const likesRes = await apiClient.get('/users/me/likes'); 
            const likedRestaurantIds = likesRes.data.map(like => like.restaurant.id); 
            setUserLikes(new Set(likedRestaurantIds));
            
        } catch (error) {
            console.error("맛집 데이터 로딩 실패:", error);
        } finally {
            setRestaurantsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        }
        if (showHelp) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showHelp]);

    useEffect(() => {
        if (allRestaurants.length > 0) {
            const sortedByLikes = [...allRestaurants].sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
            setTopRestaurants(sortedByLikes.slice(0, 10));
        }
    }, [allRestaurants]);

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

        setAllRestaurants(prevRestaurants => 
            prevRestaurants.map(r => 
                r.id === restId ? { ...r, reviewCount: (r.reviewCount || 0) + 1 } : r
            )
        );

        setReviewsByRestaurant(prevReviews => {
            const currentReviews = Array.isArray(prevReviews[restId]) ? prevReviews[restId] : [];
            return {
                ...prevReviews,
                [restId]: [newReview, ...currentReviews],
            };
        });

        setExpandedReviews(prev => new Set(prev).add(restId));
        setReviewCurrentPages(prev => ({ ...prev, [restId]: 1 }));
    };

    const handleGetRecommendations = () => {
        if (!allRestaurants || allRestaurants.length === 0) {
            showAlert("추천할 맛집이 아직 없습니다.");
            return;
        }
        setIsShuffling(true);
        setRecommendations([]);
        
        setTimeout(() => {
            const shuffled = [...allRestaurants].sort(() => 0.5 - Math.random());
            setRecommendations(shuffled.slice(0, 3));
            setIsShuffling(false);
            setTimeout(() => {
                recommendationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }, 300);
    };

    const openReviewModal = (restaurant) => {
        if (!user) {
            showAlert("리뷰 작성을 위해 로그인이 필요합니다.");
            return;
        }
        setSelectedRestaurant(restaurant);
        setIsReviewModalOpen(true);
    };

    const openReportModal = (restaurant) => {
        if (!user) {
            showAlert("신고를 위해 로그인이 필요합니다.");
            return;
        }
        setSelectedRestaurant(restaurant);
        setIsReportModalOpen(true);
    };

    const handleLikeToggle = async (restaurantId) => {
        if (!user) return;
        try {
            const response = await apiClient.post(`/restaurants/${restaurantId}/like`);
            const { isLiked: newIsLiked, likeCount: newLikeCount } = response.data; 
            
            setUserLikes(prevLikes => {
                const newLikes = new Set(prevLikes);
                if (newIsLiked) newLikes.add(restaurantId);
                else newLikes.delete(restaurantId);
                return newLikes;
            });
            
            setAllRestaurants(prev => prev.map(r => 
                r.id === restaurantId ? { ...r, likeCount: newLikeCount } : r
            ));
            
        } catch (error) {
            console.error("'좋아요' 처리 실패:", error);
            showAlert(error.response?.data?.message || "'좋아요' 처리에 실패했습니다. (서버 응답 확인 필요)");
        }
    };

    const executeDeleteReview = async () => {
        if (!reviewToDelete || !user) return;
        const { reviewId, restaurantId } = reviewToDelete;
        
        try {
            await apiClient.delete(`/restaurants/${restaurantId}/reviews/${reviewId}`);

            setReviewsByRestaurant(prev => ({
                ...prev,
                [restaurantId]: Array.isArray(prev[restaurantId]) 
                    ? prev[restaurantId].filter(review => review.id !== reviewId)
                    : [],
            }));
            
            setAllRestaurants(prev => prev.map(r => 
                r.id === restaurantId ? { ...r, reviewCount: Math.max((r.reviewCount || 0) - 1, 0) } : r
            ));
            
            showAlert("리뷰가 성공적으로 삭제되었습니다.");
        } catch (error) {
            console.error("리뷰 삭제 오류:", error);
            showAlert(error.response?.data?.message || "리뷰 삭제 중 오류가 발생했습니다.");
        } finally {
            setReviewToDelete(null);
        }
    };

    const handleDeleteReview = (reviewId, restaurantId) => {
        setReviewToDelete({ reviewId, restaurantId });
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
        const pageWindow = 1;
        const pages = new Set();
        pages.add(1);
        pages.add(totalPages);
        for (let i = 0; i <= pageWindow; i++) {
            pages.add(Math.max(1, currentPage - i));
            pages.add(Math.min(totalPages, currentPage + i));
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

    if (authLoading || restaurantsLoading || !user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.8) translateY(10px); }
                    70% { transform: scale(1.02) translateY(-2px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-popIn {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            
            <main className="max-w-6xl mx-auto px-4 py-10">
                <div className="mb-12 p-8 rounded-3xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white shadow-lg relative">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl font-extrabold">맛집 추천</h1>
                        <div ref={helpRef} className="relative">
                            <button onClick={() => setShowHelp(!showHelp)} className="text-white/70 hover:text-white transition-colors">
                                <i className="fa-solid fa-circle-question fa-lg"></i>
                            </button>
                            {showHelp && (
                                <>
                                    <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowHelp(false)} />
                                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 text-left z-50 animate-fadeIn md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-0 md:mt-3 md:w-80 md:shadow-xl text-gray-800">
                                        <h4 className="font-bold text-md mb-2 text-gray-800">맛집 추천 이용 안내</h4>
                                        <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                            <li><strong className="font-semibold">맛집 제보:</strong> 리스트에 없는 맛집을 추가 요청할 수 있습니다.</li>
                                            <li><strong className="font-semibold">리뷰 작성:</strong> 솔직하고 매너 있는 리뷰 문화를 만들어주세요.</li>
                                        </ul>
                                        <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-lg opacity-90 mb-8">학우들의 생생한 리뷰를 확인하고 학교 주변 맛집을 찾아보세요!</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button onClick={handleGetRecommendations} disabled={isShuffling} className="bg-white text-red-500 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-gray-50 transition flex items-center justify-center gap-2 active:scale-95">
                            {isShuffling ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-dice text-lg"></i>}
                            <span>점심 추천받기</span>
                        </button>
                        <button onClick={() => setShowSubmissionModal(true)} className="bg-white/20 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-sm hover:bg-white/30 transition flex items-center justify-center gap-2 border border-white/30 active:scale-95">
                            <i className="fas fa-bullhorn text-lg"></i> 맛집 제보하기
                        </button>
                    </div>
                </div>

                {recommendations.length > 0 && (
                    <section ref={recommendationsRef} className="mb-16 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm text-gray-500 font-medium md:hidden">옆으로 넘겨보세요</span>
                        </div>
                        
                        <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-6 md:pb-0 px-1 scrollbar-hide snap-x snap-mandatory">
                            {recommendations.map((resto, index) => 
                                <div 
                                    key={resto.id} 
                                    className="min-w-[85vw] md:min-w-0 snap-center animate-popIn"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <RestaurantCard 
                                        restaurant={resto}
                                        user={user}
                                        reviewsByRestaurant={reviewsByRestaurant}
                                        expandedReviews={expandedReviews}
                                        userLikes={userLikes}
                                        handleToggleReviews={handleToggleReviews}
                                        handleLikeToggle={handleLikeToggle}
                                        openReviewModal={openReviewModal}
                                        openReportModal={openReportModal}
                                        handleDeleteReview={handleDeleteReview}
                                        reviewCurrentPage={reviewCurrentPages[resto.id] || 1}
                                        onReviewPageChange={handleReviewPageChange}
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
                                <i className="fas fa-list text-gray-400"></i> 
                                {user?.university ? `${user.university} 주변 맛집` : '맛집 목록'}
                            </h3>
                        </div>
                        
                        <div className="space-y-6">
                            {currentRestaurants.map(restaurant => (
                                <RestaurantCard
                                    key={restaurant.id}
                                    restaurant={restaurant}
                                    user={user}
                                    reviewsByRestaurant={reviewsByRestaurant}
                                    expandedReviews={expandedReviews}
                                    userLikes={userLikes}
                                    handleToggleReviews={handleToggleReviews}
                                    handleLikeToggle={handleLikeToggle}
                                    openReviewModal={openReviewModal}
                                    openReportModal={openReportModal}
                                    handleDeleteReview={handleDeleteReview}
                                    reviewCurrentPage={reviewCurrentPages[restaurant.id] || 1}
                                    onReviewPageChange={handleReviewPageChange}
                                />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-12 gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
                                >
                                    <i className="fas fa-chevron-left text-xs"></i>
                                </button>
                                {pageNumbers.map((page, index) =>
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-10 h-10 rounded-full text-sm font-bold transition ${currentPage === page ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"
                                >
                                    <i className="fas fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6 hidden lg:block">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <i className="fas fa-crown text-yellow-500"></i> 인기 맛집 TOP 10
                            </h3>
                            <div className="space-y-4">
                                {topRestaurants.map((resto, index) => (
                                    <div key={resto.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white ${index < 3 ? 'bg-rose-500' : 'bg-gray-300'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="font-medium text-sm text-gray-700 truncate group-hover:text-black transition">{resto.name}</div>
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-gray-400 gap-1">
                                            <i className="fas fa-heart text-rose-400"></i>
                                            <span>{resto.likeCount || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                restaurant={selectedRestaurant}
                user={user}
                onReviewSubmitted={handleReviewSubmitted}
                onShowAlert={showAlert}
            />

            <SubmissionModal
                isOpen={showSubmissionModal}
                onClose={() => setShowSubmissionModal(false)}
                user={user}
                onShowAlert={showAlert}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                restaurant={selectedRestaurant}
                user={user}
                onShowAlert={showAlert}
            />

            {reviewToDelete && (
                <ConfirmModal
                    message="정말 이 리뷰를 삭제하시겠습니까?"
                    onConfirm={executeDeleteReview}
                    onCancel={() => setReviewToDelete(null)}
                />
            )}

            {alertModal.show && (
                <AlertModal
                    message={alertModal.message}
                    onClose={() => setAlertModal({ show: false, message: "" })}
                />
            )}
        </div>
    );
}