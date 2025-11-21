"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";

export default function ReviewModal({ isOpen, onClose, restaurant, user, onReviewSubmitted, onShowAlert }) {
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
    if (isSubmitting || !user) return;
    if (reviewContent.trim() === "") {
      onShowAlert("리뷰 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('content', reviewContent);
      if (imageFile) {
        formData.append('file', imageFile);
      }
      
      const response = await apiClient.post(`/restaurants/${restaurant.id}/reviews`, formData);
      onReviewSubmitted({ 
        ...response.data, 
        restaurantId: restaurant.id,
        author: { 
          id: user.id, 
          nickname: user.nickname, 
          role: user.role 
        },
        createdAt: new Date().toISOString(), 
      }); 

      onShowAlert("리뷰가 성공적으로 등록되었습니다.");
      onClose();
    } catch (error) {
      console.error("리뷰 등록 오류:", error);
      const errorMessage = error.response?.data?.message || "리뷰 등록 중 알 수 없는 오류가 발생했습니다.";
      onShowAlert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-gray-900">리뷰 작성</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"><i className="fas fa-times"></i></button>
        </div>
        
        <form onSubmit={handleReviewSubmit} className="p-6 space-y-6">
          <div className="text-center">
             <h4 className="text-lg font-bold text-gray-800 mb-1">{restaurant?.name}</h4>
             <p className="text-xs text-gray-500 mb-4">이 식당에서의 경험은 어떠셨나요?</p>
            <div className="flex justify-center items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i key={star} className={`fas fa-star text-3xl cursor-pointer transition-transform hover:scale-110 ${(hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-200"}`}
                  onMouseEnter={() => setHoverRating(star)} onClick={() => setRating(star)}></i>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">리뷰 내용</label>
            <textarea 
                rows="4" 
                value={reviewContent} 
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black resize-none transition-all"
                placeholder="솔직한 후기를 남겨주세요. 맛, 서비스, 분위기 등 구체적인 내용은 다른 학우들에게 큰 도움이 됩니다."
            ></textarea>
          </div>

          <div>
             <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider mb-2 block">사진 첨부</label>
             <div className="flex items-start gap-3">
                <button type="button" onClick={() => fileInputRef.current.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition">
                    <i className="fas fa-camera mb-1"></i>
                    <span className="text-[10px] font-bold">추가</span>
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                
                {imagePreview && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                        <Image src={imagePreview} alt="미리보기" layout="fill" objectFit="cover" />
                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); fileInputRef.current.value = null; }}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-black/70 backdrop-blur-sm transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                )}
             </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition active:scale-95 disabled:opacity-50 disabled:scale-100">
              {isSubmitting ? '등록 중...' : '리뷰 등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}