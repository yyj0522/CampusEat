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
    const form = e.target;
    const title = form.title.value.trim();
    const category = form.category.value;

    if (!title || !category || !editorContent.trim()) {
      alert("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
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

  if (authLoading || !user) return <div className="min-h-screen bg-gray-50" />;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-800">게시글 작성</h1>
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select name="category" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white">
                  <option value="">선택</option>
                  <option value="free">자유게시판</option>
                  <option value="question">질문</option>
                  <option value="info">정보공유</option>
                  <option value="trade">거래</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                <input type="text" name="title" required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="제목을 입력하세요" />
              </div>
              <div className="md:col-span-1 flex flex-col justify-start">
                <label className="block text-sm font-medium text-gray-700 mb-2">익명</label>
                <div 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="w-full h-[42px] flex items-center justify-center border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-400'}`}>
                    {isAnonymous && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">설정</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <TextEditor 
                initialContent={editorContent}
                onContentChange={setEditorContent} 
              />
            </div>

            <div className="mb-6">
              {imagePreview && (
                <div className="mt-4 border rounded-lg p-2 w-fit">
                  <Image 
                    src={imagePreview} 
                    alt="미리보기" 
                    width={200} 
                    height={200} 
                    className="max-h-40 w-auto rounded-md object-contain" 
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 border-t pt-6">
              <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-bold disabled:bg-gray-400">
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}