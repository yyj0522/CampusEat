"use client";

import { useRef, useEffect } from 'react';
import { storage } from "../../../firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TextEditor({ initialContent, onContentChange }) {
  const editorRef = useRef(null);

  // 초기 콘텐츠를 에디터에 설정하는 효과
  useEffect(() => {
    if (editorRef.current && initialContent !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      onContentChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt('링크 URL을 입력하세요:');
    if (url) formatText('createLink', url);
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    editorRef.current.focus();
  
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        const uploadingMessage = document.createElement('p');
        uploadingMessage.textContent = `[${file.name} 이미지 업로드 중...]`;
        uploadingMessage.style.color = 'gray';
        editorRef.current.appendChild(uploadingMessage);

        try {
          const fileName = `${Date.now()}_${file.name}`;
          const storageRef = ref(storage, `posts/${fileName}`);
          const snapshot = await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(snapshot.ref);
  
          const img = document.createElement('img');
          img.src = downloadURL;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          
          editorRef.current.removeChild(uploadingMessage);
          editorRef.current.appendChild(img);
          editorRef.current.appendChild(document.createElement('br'));
          
          onContentChange(editorRef.current.innerHTML);

        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            uploadingMessage.textContent = `[${file.name} 업로드 실패]`;
            uploadingMessage.style.color = 'red';
            alert("이미지 업로드에 실패했습니다.");
        }
      }
    }
    e.target.value = '';
  };

  return (
    <div>
      <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-4 py-2 flex items-center space-x-2">
        <button type="button" onClick={() => formatText('bold')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="굵게"><i className="fas fa-bold"></i></button>
        <button type="button" onClick={() => formatText('italic')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="기울임"><i className="fas fa-italic"></i></button>
        <button type="button" onClick={() => formatText('underline')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="밑줄"><i className="fas fa-underline"></i></button>
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        <button type="button" onClick={() => formatText('insertUnorderedList')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="목록"><i className="fas fa-list-ul"></i></button>
        <button type="button" onClick={insertLink} className="editor-btn p-2 hover:bg-gray-200 rounded" title="링크"><i className="fas fa-link"></i></button>
        <div className="border-l border-gray-300 h-6 mx-2"></div>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="imageEditorInput" />
        <button type="button" onClick={() => document.getElementById('imageEditorInput').click()} className="editor-btn p-2 hover:bg-gray-200 rounded" title="이미지"><i className="fas fa-image"></i></button>
      </div>
      
      <div className="mb-6">
        <div
          ref={editorRef}
          contentEditable={true}
          className="w-full min-h-[300px] px-4 py-3 border border-gray-300 border-t-0 rounded-b-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          style={{ maxHeight: '500px', overflowY: 'auto' }}
          onInput={(e) => onContentChange(e.currentTarget.innerHTML)}
          placeholder="내용을 입력하세요..."
        />
      </div>
    </div>
  );
}