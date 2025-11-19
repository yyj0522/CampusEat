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
      
      const response = await apiClient.post(`/restaurants/${restaurant.id}/reviews`, formData, {
      });
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
}