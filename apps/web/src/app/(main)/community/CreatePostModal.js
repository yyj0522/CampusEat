"use client";

import { useState } from "react";
import TextEditor from './TextEditor';

export default function CreatePostModal({ onClose, onCreate }) {
  const [editorContent, setEditorContent] = useState("");
  // 추가: 익명 여부를 관리할 상태
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const postData = {
      title: form.title.value.trim(),
      category: form.category.value,
      content: editorContent,
      isAnonymous: isAnonymous, // 추가: 익명 여부 데이터 전달
    };
    onCreate(postData);
    setEditorContent("");
    setIsAnonymous(false); // 제출 후 초기화
  };

  const handleClose = () => {
    setEditorContent("");
    setIsAnonymous(false);
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
            {/* 수정: grid-cols-5로 변경하여 체크박스 공간 확보 */}
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
              {/* 추가: 익명 체크박스 UI */}
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

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={handleClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">취소</button>
              <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">게시글 작성</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}