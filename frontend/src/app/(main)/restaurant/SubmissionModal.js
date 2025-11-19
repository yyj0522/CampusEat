"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";

export default function SubmissionModal({ isOpen, onClose, user, onShowAlert }) {
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
        if (isSubmitting || !user) return;
        if (!name.trim() || !location.trim()) {
            onShowAlert("가게 이름과 위치는 필수 항목입니다.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('restaurantName', name);
            formData.append('location', location);
            formData.append('description', description);
            if (imageFile) {
                formData.append('file', imageFile);
            }

            await apiClient.post('/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
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
}