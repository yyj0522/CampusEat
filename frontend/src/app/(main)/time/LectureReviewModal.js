"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import apiClient from "@/lib/api";

export default function LectureReviewModal({ isOpen, onClose, lecture }) {
    const [reviews, setReviews] = useState([]);
    const [content, setContent] = useState("");
    const [rating, setRating] = useState(5);
    const [isAnonymous, setIsAnonymous] = useState(true);
    const [year, setYear] = useState(2025);
    const [semester, setSemester] = useState("1학기");
    
    const scrollRef = useRef(null);
    const ratingRef = useRef(null);

    const fetchReviews = useCallback(async () => {
        if (!lecture) return;
        try {
            const res = await apiClient.get(`/timetable/lectures/${lecture.id}/reviews`);
            setReviews(res.data);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }, 100);
        } catch (err) {
            console.error("리뷰 로드 실패", err);
        }
    }, [lecture]);

    useEffect(() => {
        if (isOpen && lecture) {
            fetchReviews();
        }
    }, [isOpen, lecture, fetchReviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await apiClient.post(`/timetable/lectures/${lecture.id}/reviews`, {
                content,
                rating,
                year,
                semester,
                isAnonymous,
            });
            setContent("");
            fetchReviews();
        } catch {
            alert("리뷰 등록 실패");
        }
    };

    const handleDelete = async (reviewId) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        try {
            await apiClient.delete(`/timetable/reviews/${reviewId}`);
            fetchReviews();
        } catch {
            alert("삭제 실패 (본인 글만 삭제 가능)");
        }
    };

    const handleRatingMove = (e) => {
        if (!ratingRef.current) return;
        const { left, width } = ratingRef.current.getBoundingClientRect();
        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        
        let percent = (clientX - left) / width;
        percent = Math.max(0, Math.min(1, percent)); 

        const newRating = Math.ceil(percent * 10) / 2;
        setRating(newRating);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatKST = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) return dateString;

        const targetDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); 

        const yyyy = targetDate.getUTCFullYear();
        const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(targetDate.getUTCDate()).padStart(2, '0');
        const hh = String(targetDate.getUTCHours()).padStart(2, '0');
        const min = String(targetDate.getUTCMinutes()).padStart(2, '0');

        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    if (!isOpen || !lecture) return null;

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white w-full max-w-lg h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn relative">
                
                <div className="bg-white px-6 py-5 border-b flex justify-between items-start sticky top-0 z-10">
                    <div className="pr-4">
                        <h3 className="font-extrabold text-gray-900 text-lg sm:text-xl leading-tight line-clamp-2">{lecture.courseName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{lecture.professor} 교수님</p>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 space-y-4" ref={scrollRef}>
                    {reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                            <i className="fas fa-comment-dots text-4xl mb-2 opacity-50"></i>
                            <p className="text-sm">첫 번째 수강 후기를 남겨주세요!</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div 
                                key={review.id} 
                                className={`relative p-5 rounded-2xl border transition-all ${
                                    review.isMine 
                                    ? "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100" 
                                    : "bg-white border-gray-100 shadow-sm"
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${review.isMine ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                                            {review.writer[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">{review.writer}</span>
                                            <span className="text-[10px] text-gray-400">{review.year}년 {review.semester}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex text-yellow-400 text-xs gap-0.5">
                                            {"★".repeat(Math.floor(review.rating))}
                                            {review.rating % 1 !== 0 && "½"}
                                            <span className="text-gray-300">
                                                {"★".repeat(5 - Math.ceil(review.rating))}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {formatKST(review.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-1">
                                    {review.content}
                                </p>

                                {review.isMine && (
                                    <button 
                                        onClick={() => handleDelete(review.id)}
                                        className="absolute bottom-4 right-4 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1"
                                    >
                                        <i className="fas fa-trash-alt"></i> 삭제
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="bg-white p-4 border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-y-2">
                            <div className="flex gap-2">
                                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-600 font-medium focus:border-blue-500 transition-colors" value={year} onChange={e => setYear(Number(e.target.value))}>
                                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
                                </select>
                                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-600 font-medium focus:border-blue-500 transition-colors" value={semester} onChange={e => setSemester(e.target.value)}>
                                    {['1학기', '2학기', '여름계절', '겨울계절'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <div 
                                    className="relative inline-block cursor-pointer touch-none select-none"
                                    ref={ratingRef}
                                    onMouseMove={handleRatingMove}
                                    onTouchMove={handleRatingMove}
                                    onClick={handleRatingMove}
                                >
                                    <div className="text-gray-200 text-3xl leading-none tracking-tight">
                                        ★★★★★
                                    </div>
                                    <div 
                                        className="absolute top-0 left-0 overflow-hidden text-yellow-400 text-3xl leading-none tracking-tight pointer-events-none whitespace-nowrap"
                                        style={{ width: `${(rating / 5) * 100}%` }}
                                    >
                                        ★★★★★
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-700 w-8 text-right">{rating}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="강의평을 남겨주세요 (익명 보장)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none resize-none h-20 focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-400"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-3">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none text-gray-500 hover:text-gray-800 transition-colors">
                                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-3.5 h-3.5 accent-gray-800 rounded cursor-pointer" />
                                    익명
                                </label>
                                <button 
                                    type="submit" 
                                    className="bg-black hover:bg-gray-800 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-md active:scale-95"
                                >
                                    등록
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}