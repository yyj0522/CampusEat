"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "../../../firebase";
import { useAuth } from "../../context/AuthProvider";
import { useRestaurants } from "../../context/RestaurantProvider";
import {
    doc, getDoc, collection, getDocs, addDoc, serverTimestamp,
    query, orderBy, writeBatch, increment, arrayUnion, arrayRemove, updateDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import '../../styles/style.css';
import UserDisplay from '../../components/UserDisplay';

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const ReviewModal = ({ isOpen, onClose, restaurant, userInfo, onReviewSubmitted, onShowAlert }) => {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewContent, setReviewContent] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setRating(5);
            setHoverRating(0);
            setReviewContent("");
            setImageFile(null);
            setImagePreview("");
            setIsSubmitting(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter' && !isSubmitting && !event.shiftKey) {
                event.preventDefault();
                document.getElementById('submit-review-button')?.click();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting]);

    const handleImageChange = (e) => {
        if (e.target.files.length === 0) return;
        if (imageFile) {
            onShowAlert("사진은 1장만 첨부할 수 있습니다.");
            return;
        }
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !userInfo) return;
        if (reviewContent.trim() === "") {
            onShowAlert("리뷰 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        let imageUrl = "";
        try {
            if (imageFile) {
                const imageRef = ref(storage, `reviews/${restaurant.id}/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            const reviewColRef = collection(db, "newUniversities", userInfo.university, "newRestaurants", restaurant.id, "reviews");
            const newReviewData = {
                authorId: userInfo.uid,
                nickname: userInfo.nickname,
                isAdmin: userInfo.isAdmin || false,
                rating,
                content: reviewContent,
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
                likes: 0,
            };
            const docRef = await addDoc(reviewColRef, newReviewData);

            const restaurantDocRef = doc(db, "newUniversities", userInfo.university, "newRestaurants", restaurant.id);
            await updateDoc(restaurantDocRef, { reviewCount: increment(1) });

            onReviewSubmitted({ id: docRef.id, ...newReviewData, createdAt: { toDate: () => new Date() }, restaurantId: restaurant.id });
            onShowAlert("리뷰가 성공적으로 등록되었습니다.");
            onClose();
        } catch (error) {
            console.error("리뷰 등록 오류:", error);
            onShowAlert("리뷰 등록 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{restaurant?.name} 리뷰 작성</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                        <div className="flex items-center space-x-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i key={star} className={`fas fa-star cursor-pointer text-xl ${(hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300"}`}
                                    onMouseEnter={() => setHoverRating(star)} onClick={() => setRating(star)}></i>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reviewContent" className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
                        <textarea id="reviewContent" rows="4" value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="이 맛집에 대한 솔직한 리뷰를 작성해주세요..."></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부</label>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                <i className="fas fa-camera mr-2"></i> 사진 선택
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            <span className={`text-sm ${imageFile ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{imageFile ? '1 / 1' : '0 / 1'}</span>
                        </div>
                        {imagePreview && (
                            <div className="mt-4 relative w-32 h-32">
                                <Image src={imagePreview} alt="리뷰 사진 미리보기" layout="fill" objectFit="cover" className="rounded-lg" />
                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); fileInputRef.current.value = null; }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition" disabled={isSubmitting}>취소</button>
                        <button id="submit-review-button" type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" disabled={isSubmitting}>
                            {isSubmitting ? '등록 중...' : '리뷰 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SubmissionModal = ({ isOpen, onClose, userInfo, onShowAlert }) => {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setName(""); setLocation(""); setDescription("");
            setImageFile(null); setImagePreview("");
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleImageChange = (e) => {
        if (e.target.files.length === 0) return;
        if (imageFile) {
            onShowAlert("사진은 1장만 첨부할 수 있습니다.");
            return;
        }
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || !userInfo) return;
        if (!name.trim() || !location.trim()) {
            onShowAlert("가게 이름과 위치는 필수 항목입니다.");
            return;
        }

        setIsSubmitting(true);
        let imageUrl = "";
        try {
            if (imageFile) {
                const imageRef = ref(storage, `submissions/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            await addDoc(collection(db, "restaurant_submissions"), {
                restaurantName: name,
                location,
                description,
                imageUrl,
                status: 'pending',
                reporterId: userInfo.uid,
                reporterNickname: userInfo.nickname,
                university: userInfo.university,
                createdAt: serverTimestamp(),
            });

            onShowAlert("맛집 제보가 성공적으로 접수되었습니다. 감사합니다!");
            onClose();
        } catch (error) {
            console.error("맛집 제보 오류:", error);
            onShowAlert("제보 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">우리 학교 맛집 제보하기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">가게 이름 *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border p-2 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">위치 *</label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="예: 정문 앞 GS25 편의점 골목" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="이 맛집의 특징을 알려주세요!"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">사진 첨부</label>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                                <i className="fas fa-camera mr-2"></i> 사진 선택
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            <span className={`text-sm ${imageFile ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{imageFile ? '1 / 1' : '0 / 1'}</span>
                        </div>
                        {imagePreview && (
                            <div className="mt-4 relative w-32 h-32">
                                <Image src={imagePreview} alt="제보 사진 미리보기" layout="fill" objectFit="cover" className="rounded-lg" />
                                <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); fileInputRef.current.value = null; }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled={isSubmitting}>취소</button>
                        <button id="submit-submission-button" type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" disabled={isSubmitting}>
                            {isSubmitting ? '제보 중...' : '제보하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ReportModal = ({ isOpen, onClose, restaurant, userInfo, onShowAlert }) => {
    const [reason, setReason] = useState('direct');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const reportReasons = { direct: '직접 작성할게요.', nonexistent: '지금은 존재하지 않는 음식점이에요.', incorrect: '정보가 실제와 달라요.', far: '학교와 거리가 너무 멀어요.' };

    useEffect(() => {
        if (!isOpen) {
            setReason('direct');
            setCustomReason('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (isSubmitting || !userInfo) return;

        const finalReason = reason === 'direct' ? customReason.trim() : reportReasons[reason];
        if (!finalReason) {
            onShowAlert('신고 사유를 입력하거나 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const reportColRef = collection(db, "newUniversities", userInfo.university, "newRestaurants", restaurant.id, "reports");
            await addDoc(reportColRef, {
                reporterId: userInfo.uid,
                reporterNickname: userInfo.nickname,
                reason: finalReason,
                createdAt: serverTimestamp(),
            });

            const restaurantDocRef = doc(db, "newUniversities", userInfo.university, "newRestaurants", restaurant.id);
            await updateDoc(restaurantDocRef, { reportCount: increment(1) });

            onShowAlert('신고가 성공적으로 접수되었습니다.');
            onClose();
        } catch (error) {
            console.error('신고 접수 오류:', error);
            onShowAlert('신고 접수 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{restaurant?.name} 신고하기</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                    <div>
                        <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 사유</label>
                        <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border p-2 rounded-lg">
                            {Object.entries(reportReasons).map(([key, value]) => (<option key={key} value={key}>{value}</option>))}
                        </select>
                    </div>
                    {reason === 'direct' && (
                        <div>
                            <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-1">신고 내용 작성</label>
                            <textarea id="custom-reason" value={customReason} onChange={(e) => setCustomReason(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="신고 사유를 자세히 적어주세요."></textarea>
                        </div>
                    )}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled={isSubmitting}>취소</button>
                        <button id="submit-report-button" type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" disabled={isSubmitting}>
                            {isSubmitting ? '접수 중...' : '접수하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onConfirm]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-8">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2">취소</button>
                    <button onClick={onConfirm} className="bg-red-500 text-white px-8 py-2 rounded-lg hover:bg-red-600 transition w-1/2">삭제</button>
                </div>
            </div>
        </div>
    );
};

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition w-full"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default function RestaurantPage() {
    const router = useRouter();
    const { userInfo, loading: authLoading } = useAuth();
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
    const [showReviewImage, setShowReviewImage] = useState({});
    const [showHelp, setShowHelp] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const restaurantsPerPage = 5;

    const recommendationsRef = useRef(null);
    const helpRef = useRef(null);

    const showAlert = (message) => setAlertModal({ show: true, message });

    useEffect(() => {
        if (!authLoading && !userInfo) {
            router.push("/login");
        } else if (userInfo) {
            setUserLikes(new Set(userInfo.likedRestaurants || []));
            if (userInfo.university) {
                const uniDocRef = doc(db, "newUniversities", userInfo.university);
                getDoc(uniDocRef).then(uniSnap => {
                    if (uniSnap.exists()) {
                        setUniversityLocation(uniSnap.data());
                    }
                });
            }
        }
    }, [userInfo, authLoading, router]);

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
        if (reviewsByRestaurant[restaurantId] || !userInfo?.university) return;
        try {
            const reviewColRef = collection(db, "newUniversities", userInfo.university, "newRestaurants", restaurantId, "reviews");
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

    const toggleReviewImage = (reviewId) => {
        setShowReviewImage(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
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
        if (!userInfo) {
            showAlert("리뷰 작성을 위해 로그인이 필요합니다.");
            return;
        }
        setSelectedRestaurant(restaurant);
        setIsReviewModalOpen(true);
    };

    const openReportModal = (restaurant) => {
        if (!userInfo) {
            showAlert("신고를 위해 로그인이 필요합니다.");
            return;
        }
        setSelectedRestaurant(restaurant);
        setIsReportModalOpen(true);
    };

    const handleLikeToggle = async (restaurantId, isLiked) => {
        if (!userInfo) {
            showAlert("로그인이 필요합니다.");
            return;
        }

        const batch = writeBatch(db);
        const restaurantRef = doc(db, "newUniversities", userInfo.university, "newRestaurants", restaurantId);
        const userRef = doc(db, "users", userInfo.uid);

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
        if (!reviewToDelete || !userInfo) return;
        const { reviewId, restaurantId } = reviewToDelete;
        try {
            const reviewRef = doc(db, "newUniversities", userInfo.university, "newRestaurants", restaurantId, "reviews", reviewId);

            const batch = writeBatch(db);
            batch.delete(reviewRef);

            const restaurantDocRef = doc(db, "newUniversities", userInfo.university, "newRestaurants", restaurantId);
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

    const formatDate = (timestamp) => {
        if (!timestamp) return "";
        return timestamp.toDate().toLocaleDateString("ko-KR");
    };

    const WalkingDistance = ({ uniLocation, restLocation }) => {
        if (!uniLocation?.latitude || !uniLocation?.longitude || !restLocation?.lat || !restLocation?.lng) return null;
        const distanceKm = getDistanceFromLatLonInKm(uniLocation.latitude, uniLocation.longitude, restLocation.lat, restLocation.lng);
        const walkingSpeedKmh = 4.5;
        const timeMinutes = Math.round((distanceKm / walkingSpeedKmh) * 60);
        if (timeMinutes < 1) return <span className="ml-2 text-xs font-semibold text-blue-600">(바로 앞)</span>;
        return <span className="ml-2 text-xs font-semibold text-blue-600">(도보 {timeMinutes}분)</span>;
    };

    const RestaurantCard = ({ restaurant }) => {
        const restaurantReviews = reviewsByRestaurant[restaurant.id] || [];
        const isExpanded = expandedReviews.has(restaurant.id);
        const isLiked = userLikes.has(restaurant.id);
        const reviewCount = restaurant.reviewCount || 0;
        const [showMenu, setShowMenu] = useState(false);
        const menuRef = useRef(null);

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
                        <WalkingDistance uniLocation={universityLocation} restLocation={restaurant.location} />
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
                            {restaurantReviews.length > 0 ? restaurantReviews.map(review => (
                                <div key={review.id} className="relative group p-3 border rounded-lg bg-white">
                                    <div className="flex items-center mb-2">
                                        <div className="text-sm mr-2 text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                                        <UserDisplay
                                            userTarget={{ id: review.authorId, nickname: review.nickname }}
                                            context={{ type: 'review', id: review.id, restaurantId: restaurant.id }}
                                        >
                                            <span className="text-xs text-gray-500 cursor-pointer hover:underline">
                                                {formatDate(review.createdAt)} by {' '}
                                                {review.isAdmin && <span className="font-bold text-blue-500">[관리자] </span>}
                                                {review.nickname}
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

                                    {userInfo && userInfo.uid === review.authorId && (
                                        <button
                                            onClick={() => handleDeleteReview(review.id, restaurant.id)}
                                            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="삭제"
                                        >
                                            <i className="fas fa-trash-alt fa-sm"></i>
                                        </button>
                                    )}
                                </div>
                            )) : <p className="text-gray-500 text-sm text-center py-4">리뷰가 없습니다.</p>}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    const indexOfLastRestaurant = currentPage * restaurantsPerPage;
    const indexOfFirstRestaurant = indexOfLastRestaurant - restaurantsPerPage;
    const currentRestaurants = allRestaurants.slice(indexOfFirstRestaurant, indexOfLastRestaurant);
    const totalPages = Math.ceil(allRestaurants.length / restaurantsPerPage);

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
                            {recommendations.map(resto => <RestaurantCard key={resto.id} restaurant={resto} />)}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <h3 className="text-xl font-semibold">{userInfo?.university ? `${userInfo.university} 주변 맛집` : '맛집 목록'}</h3>
                        </div>

                        <div className="space-y-6">
                            {currentRestaurants.map(restaurant => (
                                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-gray-700 bg-white rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    이전
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <button
                                        key={number}
                                        onClick={() => setCurrentPage(number)}
                                        className={`px-4 py-2 rounded-md border ${currentPage === number ? 'bg-blue-600 text-white' : 'text-gray-700 bg-white hover:bg-gray-100'}`}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-gray-700 bg-white rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </div>

                    <aside className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <i className="fas fa-fire text-red-500 mr-2"></i>
                                {userInfo?.university ? `${userInfo.university} 맛집 TOP 10` : '인기 맛집 TOP 10'}
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
                userInfo={userInfo}
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
                userInfo={userInfo}
                onShowAlert={showAlert}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                restaurant={selectedRestaurant}
                userInfo={userInfo}
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