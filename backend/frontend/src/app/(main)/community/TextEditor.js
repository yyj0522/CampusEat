"use client";

import { useRef, useEffect, useState } from 'react';
import apiClient from '@/lib/api';

const LinkModal = ({ isOpen, onClose, onConfirm }) => {
    const [url, setUrl] = useState('https://');
    
    useEffect(() => {
        if (isOpen) {
            setUrl('https://');
        }
    }, [isOpen]);

    const handleConfirm = () => {
        if (url && url !== 'https://') {
            onConfirm(url);
        }
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">링크 삽입</h3>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                    autoFocus
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
                    <button onClick={handleConfirm} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">확인</button>
                </div>
            </div>
        </div>
    );
};

export default function TextEditor({ initialContent, onContentChange }) {
    const editorRef = useRef(null);
    const selectionRef = useRef(null);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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
    
    const openLinkModal = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            selectionRef.current = selection.getRangeAt(0);
        }
        setIsLinkModalOpen(true);
    };

    const confirmInsertLink = (url) => {
        if (editorRef.current) {
            editorRef.current.focus();
            if (selectionRef.current) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(selectionRef.current);
            }
        }
        formatText('createLink', url);
        selectionRef.current = null; 
    };

    const handleImageUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
    
        if (editorRef.current) editorRef.current.focus();
    
        for (let file of files) {
            if (file.type.startsWith('image/')) {
                const uploadingMessage = document.createElement('p');
                uploadingMessage.textContent = `[${file.name} 이미지 업로드 중...]`;
                uploadingMessage.style.color = 'gray';
                editorRef.current.appendChild(uploadingMessage);

                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await apiClient.post('/uploads', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                    
                    const { imageUrl } = response.data;
        
                    const img = document.createElement('img');
                    img.src = imageUrl;
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
                }
            }
        }
        e.target.value = '';
    };

    return (
        <div>
            <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-4 py-2 flex items-center space-x-2 flex-wrap gap-y-2">
                <button type="button" onClick={() => formatText('bold')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="굵게"><i className="fas fa-bold"></i></button>
                <button type="button" onClick={() => formatText('italic')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="기울임"><i className="fas fa-italic"></i></button>
                <button type="button" onClick={() => formatText('underline')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="밑줄"><i className="fas fa-underline"></i></button>
                
                <div className="border-l border-gray-300 h-6 mx-2"></div>
                
                <button type="button" onClick={() => formatText('justifyLeft')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="왼쪽 정렬"><i className="fas fa-align-left"></i></button>
                <button type="button" onClick={() => formatText('justifyCenter')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="가운데 정렬"><i className="fas fa-align-center"></i></button>
                <button type="button" onClick={() => formatText('justifyRight')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="오른쪽 정렬"><i className="fas fa-align-right"></i></button>

                <div className="border-l border-gray-300 h-6 mx-2"></div>

                <button type="button" onClick={() => formatText('insertUnorderedList')} className="editor-btn p-2 hover:bg-gray-200 rounded" title="목록"><i className="fas fa-list-ul"></i></button>
                <button type="button" onClick={openLinkModal} className="editor-btn p-2 hover:bg-gray-200 rounded" title="링크"><i className="fas fa-link"></i></button>
                
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
                />
            </div>
            <LinkModal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} onConfirm={confirmInsertLink} />
        </div>
    );
}