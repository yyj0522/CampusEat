"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { useRestaurants } from "../../context/RestaurantProvider";
import { doc, getDoc, collection, getDocs, query, orderBy, writeBatch, increment, arrayUnion, arrayRemove} from "firebase/firestore";
import '../../styles/style.css';
import RestaurantCard from "./RestaurantCard";
import ReviewModal from "./ReviewModal";
import SubmissionModal from "./SubmissionModal";
import ReportModal from "./ReportModal";
import ConfirmModal from "./modals/ConfirmModal";
import AlertModal from "./modals/AlertModal";

export default function RestaurantPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { restaurants: allRestaurants, isLoading: restaurantsLoading } = useRestaurants();

    const [userLikes, setUserLikes] = useState(new Set());
    const [universityLocation, setUniversityLocation] = useState(null);
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
    const restaurantsPerPage = 5;

    const recommendationsRef = useRef(null);
    const helpRef = useRef(null);

    const showAlert = (message) => setAlertModal({ show: true, message });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        } else if (user) {
            setUserLikes(new Set(user.likedRestaurants || []));
            if (user.university) {
                const uniDocRef = doc(db, "newUniversities", user.university);
                getDoc(uniDocRef).then(uniSnap => {
                    if (uniSnap.exists()) {
                        setUniversityLocation(uniSnap.data());
                    }
                });
            }
        }
    }, [user, authLoading, router]);

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
        if (reviewsByRestaurant[restaurantId] || !user?.university) return;
        try {
            const reviewColRef = collection(db, "newUniversities", user.university, "newRestaurants", restaurantId, "reviews");
            const q = query(reviewColRef, orderBy("createdAt", "desc"));
            const reviewSnapshot = await getDocs(q);
            const reviewList = reviewSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            setReviewsByRestaurant(prevReviews => ({
                ...prevReviews,
                [restaurantId]: reviewList,
            }));
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

    const handleGetRecommendations = () => {
        if (!allRestaurants || allRestaurants.length === 0) {
            showAlert("추천할 맛집이 아직 없습니다.");
            return;
        }
        const shuffled = [...allRestaurants].sort(() => 0.5 - Math.random());
        setRecommendations(shuffled.slice(0, 3));
        setTimeout(() => {
            recommendationsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
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

    const handleLikeToggle = async (restaurantId, isLiked) => {
        if (!user) {
            showAlert("로그인이 필요합니다.");
            return;
        }

        const batch = writeBatch(db);
        const restaurantRef = doc(db, "newUniversities", user.university, "newRestaurants", restaurantId);
        const userRef = doc(db, "users", user.uid);

        batch.update(restaurantRef, { likeCount: increment(isLiked ? -1 : 1) });
        batch.update(userRef, { likedRestaurants: isLiked ? arrayRemove(restaurantId) : arrayUnion(restaurantId) });

        await batch.commit();

        const newLikes = new Set(userLikes);
        if (isLiked) {
            newLikes.delete(restaurantId);
        } else {
            newLikes.add(restaurantId);
        }
        setUserLikes(newLikes);
    };

    const handleDeleteReview = (reviewId, restaurantId) => {
        setReviewToDelete({ reviewId, restaurantId });
    };

    const executeDeleteReview = async () => {
        if (!reviewToDelete || !user) return;
        const { reviewId, restaurantId } = reviewToDelete;
        try {
            const reviewRef = doc(db, "newUniversities", user.university, "newRestaurants", restaurantId, "reviews", reviewId);
            const restaurantDocRef = doc(db, "newUniversities", user.university, "newRestaurants", restaurantId);

            const batch = writeBatch(db);
            batch.delete(reviewRef);
            batch.update(restaurantDocRef, { reviewCount: increment(-1) });
            await batch.commit();

            setReviewsByRestaurant(prev => {
                const updatedReviews = { ...prev };
                if (updatedReviews[restaurantId]) {
                    updatedReviews[restaurantId] = updatedReviews[restaurantId].filter(review => review.id !== reviewId);
                }
                return updatedReviews;
            });
            showAlert("리뷰가 성공적으로 삭제되었습니다.");
        } catch (error) {
            console.error("리뷰 삭제 오류:", error);
            showAlert("리뷰 삭제 중 오류가 발생했습니다.");
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

    if (authLoading || restaurantsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="loading mx-auto"></div>
                    <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="py-8 max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <div ref={helpRef} className="relative flex justify-center items-center gap-2 mb-4">
                        <h1 className="text-4xl font-bold text-gray-800">맛집 추천</h1>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <i className="fa-solid fa-circle-question fa-lg"></i>
                        </button>
                        {showHelp && (
                            <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                <h4 className="font-bold text-md mb-2 text-gray-800">💡 맛집 추천 이용 안내</h4>
                                <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                                    <li><strong className="font-semibold">맛집 제보:</strong> &apos;맛집 제보하기&apos; 버튼으로 리스트에 없는 나만의 맛집을 추가 요청할 수 있습니다.</li>
                                    <li><strong className="font-semibold">리뷰 작성:</strong> 악의적인 비방이나 허위 사실이 포함된 리뷰 작성 시, 관련 법령에 따라 불이익을 받을 수 있습니다.</li>
                                </ul>
                                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-xl text-gray-600 mb-8">학우들의 생생한 리뷰를 확인하고 맛집을 찾아보세요</p>
                    <div className="flex justify-center items-center gap-4">
                        <button onClick={handleGetRecommendations} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <i className="fas fa-dice text-xl mr-2"></i> 점심 추천받기
                        </button>
                        <button onClick={() => setShowSubmissionModal(true)} className="bg-gradient-to-r from-blue-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <i className="fas fa-bullhorn text-xl mr-2"></i> 맛집 제보하기
                        </button>
                    </div>
                </div>

                {recommendations.length > 0 && (
                    <section ref={recommendationsRef} className="mb-12">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">오늘의 추천 맛집</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recommendations.map(resto => 
                                <RestaurantCard 
                                    key={resto.id}
                                    restaurant={resto}
                                    user={user}
                                    reviewsByRestaurant={reviewsByRestaurant}
                                    expandedReviews={expandedReviews}
                                    userLikes={userLikes}
                                    universityLocation={universityLocation}
                                    handleToggleReviews={handleToggleReviews}
                                    handleLikeToggle={handleLikeToggle}
                                    openReviewModal={openReviewModal}
                                    openReportModal={openReportModal}
                                    handleDeleteReview={handleDeleteReview}
                                    reviewCurrentPage={reviewCurrentPages[resto.id] || 1}
                                    onReviewPageChange={handleReviewPageChange}
                                />
                            )}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h3 className="text-xl font-semibold">{user?.university ? `${user.university} 주변 맛집` : '맛집 목록'}</h3>
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
                                    universityLocation={universityLocation}
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
                            <div className="flex justify-center items-center mt-8 space-x-1 sm:space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
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
                                            onClick={() => setCurrentPage(page)}
                                            className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-sm font-medium border transition-colors duration-200 ${currentPage === page ? 'bg-blue-600 text-white border-blue-600 shadow-md cursor-default' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Next Page"
                                >
                                    <i className="fas fa-chevron-right fa-sm"></i>
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <i className="fas fa-fire text-red-500 mr-2"></i>
                                {user?.university ? `${user.university} 맛집 TOP 10` : '인기 맛집 TOP 10'}
                            </h3>
                            <div className="space-y-3">
                                {topRestaurants.map((resto, index) => (
                                    <div key={resto.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{index + 1}</div>
                                            <div className="font-medium text-sm">{resto.name}</div>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <i className="fas fa-heart text-red-400 mr-1"></i>
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
                onReviewSubmitted={(newReview) => {
                    setReviewsByRestaurant(prev => ({
                        ...prev,
                        [newReview.restaurantId]: [newReview, ...(prev[newReview.restaurantId] || [])]
                    }));
                }}
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