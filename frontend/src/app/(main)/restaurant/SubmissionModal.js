"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { FaCamera, FaTimes } from "react-icons/fa";

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
            if (imageFile) formData.append('file', imageFile);

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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-gray-900">맛집 제보하기</h3>
                    <button onClick={onClose} aria-label="닫기" className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1">
                        <label htmlFor="resName" className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">가게 이름 <span className="text-red-500">*</span></label>
                        <input id="resName" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-black transition-all font-medium" placeholder="맛집 이름을 알려주세요" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">위치 <span className="text-red-500">*</span></label>
                        <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:border-black transition-all" placeholder="예: 정문 앞 GS25 골목" />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider mb-2 block">사진 첨부</label>
                        <div className="flex items-start gap-3">
                            <button type="button" onClick={() => fileInputRef.current.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 transition">
                                <FaCamera className="mb-1" />
                                <span className="text-[10px] font-bold">추가</span>
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                            {imagePreview && (
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                                    <Image src={imagePreview} alt="미리보기" layout="fill" objectFit="cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition active:scale-95 disabled:opacity-50">
                            {isSubmitting ? '제보 중...' : '제보하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}