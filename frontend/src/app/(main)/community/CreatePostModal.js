"use client";

import { useState } from "react";
import TextEditor from './TextEditor';
import Image from "next/image"; // next/image에서 Image 컴포넌트를 가져옵니다.

export default function CreatePostModal({ onClose, onCreate }) {
  const [editorContent, setEditorContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const postData = {
      title: form.title.value.trim(),
      category: form.category.value,
      content: editorContent,
      isAnonymous: isAnonymous,
      file: imageFile,
    };
    onCreate(postData);
    setEditorContent("");
    setIsAnonymous(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    setEditorContent("");
    setIsAnonymous(false);
    setImageFile(null);
    setImagePreview(null);
    onClose();
  };
  
  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="modal-content bg-white rounded-xl w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">새 게시글 작성</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
                <select name="category" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                  <option value="">카테고리 선택</option>
                  <option value="free">자유게시판</option>
                  <option value="question">질문</option>
                  <option value="info">정보공유</option>
                  <option value="trade">거래</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                <input type="text" name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="제목을 입력하세요" />
              </div>
              <div className="flex flex-col items-start">
                <label className="block text-sm font-medium text-gray-700 mb-2">익명 *</label>
                <div 
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className="w-full h-[42px] flex items-center justify-center border border-gray-300 rounded-lg cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isAnonymous ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300 border-2'}`}>
                    {isAnonymous && <i className="fas fa-check text-white text-sm"></i>}
                  </div>
                </div>
              </div>
            </div>

            <TextEditor 
              initialContent={editorContent}
              onContentChange={setEditorContent} 
            />

            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <i className="fas fa-paperclip mr-2"></i>
                이미지 첨부
              </label>
              <input id="file-upload" name="file-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              {imageFile && <span className="ml-3 text-sm text-gray-500">{imageFile.name}</span>}
            </div>

            {/* --- 수정된 부분 시작 --- */}
            {imagePreview && (
              <div className="mt-4 border rounded-lg p-2 max-h-60 overflow-y-auto">
                <Image 
                  src={imagePreview} 
                  alt="이미지 미리보기" 
                  width={500} // width 속성 추가
                  height={500} // height 속성 추가
                  className="max-w-full h-auto rounded-md" 
                />
              </div>
            )}
            {/* --- 수정된 부분 끝 --- */}

            <div className="flex justify-end space-x-3 mt-4">
              <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">취소</button>
              <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">게시글 작성</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}