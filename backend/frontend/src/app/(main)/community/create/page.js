"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import apiClient from "../../../../lib/api";
import { useAuth } from "../../../context/AuthProvider";
import TextEditor from "../TextEditor"; 

export default function CreatePostPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [editorContent, setEditorContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");

  const categories = [
    { id: "free", label: "자유게시판" },
    { id: "question", label: "질문게시판" },
    { id: "info", label: "정보공유" },
    { id: "trade", label: "중고거래" },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !selectedCategory || !editorContent.trim()) {
      alert("제목, 카테고리, 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", selectedCategory);
    formData.append("content", editorContent);
    formData.append("isAnonymous", isAnonymous);
    if (imageFile) {
      formData.append("file", imageFile);
    }

    try {
      await apiClient.post("/posts", formData);
      alert("게시글이 작성되었습니다.");
      router.replace("/community");
    } catch (error) {
      console.error("글 작성 실패:", error);
      alert("글 작성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-white py-8 font-sans">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h1 className="text-xl font-extrabold text-gray-900">새 글 작성</h1>
            <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                      selectedCategory === cat.id
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">제목</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요" 
                    className="w-full text-xl font-bold border-b-2 border-gray-100 py-2 focus:outline-none focus:border-black placeholder-gray-300 transition-colors"
                />
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnonymous ? "bg-gray-800" : "bg-gray-200"}`}>
                        <i className={`fas fa-user-secret ${isAnonymous ? "text-white" : "text-gray-400"}`}></i>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900">익명으로 작성</div>
                        <div className="text-xs text-gray-500">내 닉네임이 공개되지 않습니다.</div>
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${isAnonymous ? "bg-black" : "bg-gray-300"}`}
                >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isAnonymous ? "left-6" : "left-1"}`}></div>
                </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">내용</label>
              <div className="min-h-[300px] border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-black/5 transition-shadow">
                <TextEditor 
                    initialContent={editorContent}
                    onContentChange={setEditorContent} 
                />
              </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">이미지 첨부</label>
                <div className="flex items-start gap-4">
                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition group">
                        <i className="fas fa-camera text-gray-400 group-hover:text-gray-600 mb-1"></i>
                        <span className="text-xs text-gray-400 group-hover:text-gray-600">사진 추가</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    
                    {imagePreview && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                            <Image 
                                src={imagePreview} 
                                alt="미리보기" 
                                fill
                                className="object-cover"
                            />
                            <button 
                                type="button"
                                onClick={() => {setImageFile(null); setImagePreview(null);}}
                                className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? '등록 중...' : '게시글 등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}