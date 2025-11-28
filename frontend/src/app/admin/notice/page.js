"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";
import TextEditor from "../../(main)/community/TextEditor";

const Toast = ({ message, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"><i className="fas fa-info-circle"></i>{message}</div></div>;
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 flex items-center justify-center z-[200]">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-full max-w-sm animate-scale-up border border-gray-100">
            <p className="text-gray-800 font-bold mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition">취소</button>
                <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition shadow-md">삭제</button>
            </div>
        </div>
    </div>
);

const generateRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 85%, 96%)`;
};

export default function NoticeAdminPage() {
  const [title, setTitle] = useState("");
  const [slideCaption, setSlideCaption] = useState("");
  const [slideCaptionSmall, setSlideCaptionSmall] = useState("");
  const [slideBackgroundColor, setSlideBackgroundColor] = useState("#EBF5FF");
  const [authorDisplayName, setAuthorDisplayName] = useState("관리자");
  const [editorContent, setEditorContent] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  
  const [toast, setToast] = useState({ show: false, message: "" });
  const [postToDelete, setPostToDelete] = useState(null);

  const showToast = (msg) => setToast({ show: true, message: msg });

  const fetchNotices = useCallback(async () => {
    setIsListLoading(true);
    try {
      const response = await apiClient.get("/posts");
      const noticePosts = response.data
        .filter((post) => post.category === "notice")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotices(noticePosts);
    } catch {
      showToast("목록을 불러오지 못했습니다.");
    } finally {
      setIsListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
    setSlideBackgroundColor(generateRandomPastelColor());
  }, [fetchNotices]);

  const resetForm = () => {
    setTitle(""); setSlideCaption(""); setSlideCaptionSmall("");
    setAuthorDisplayName("관리자"); setEditorContent("");
    setBannerFile(null); setBannerPreview(null);
    setEditingPost(null); setIsLoading(false);
    setSlideBackgroundColor(generateRandomPastelColor());
    const fileInput = document.getElementById("banner-upload");
    if(fileInput) fileInput.value = "";
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return showToast("제목을 입력해주세요.");
    if (!editingPost && !bannerFile) return showToast("배너 이미지는 필수입니다.");
    
    setIsLoading(true);
    try {
      let slideImageUrl = editingPost ? editingPost.slideImage : null;
      
      if (bannerFile) {
        const formData = new FormData();
        formData.append("file", bannerFile);
        const uploadResponse = await apiClient.post("/uploads", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        slideImageUrl = uploadResponse.data.imageUrl;
      }

      const postData = {
        title,
        content: editorContent,
        slideImage: slideImageUrl,
        slideCaption,
        slideCaptionSmall,
        slideBackgroundColor,
        authorDisplayName,
        isAnonymous: false,
        ...(editingPost ? {} : { category: "notice" })
      };

      if (editingPost) {
        await apiClient.patch(`/posts/${editingPost.id}`, postData);
        showToast("수정되었습니다.");
      } else {
        await apiClient.post("/posts", postData);
        showToast("작성되었습니다.");
      }
      resetForm();
      fetchNotices();
    } catch {
      showToast("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (notice) => {
    setEditingPost(notice);
    setTitle(notice.title);
    setSlideCaption(notice.slideCaption || "");
    setSlideCaptionSmall(notice.slideCaptionSmall || "");
    setSlideBackgroundColor(notice.slideBackgroundColor || generateRandomPastelColor());
    setAuthorDisplayName(notice.authorDisplayName || "관리자");
    setEditorContent(notice.content);
    setBannerPreview(notice.slideImage);
    window.scrollTo(0, 0);
  };

  const executeDelete = async () => {
      if (!postToDelete) return;
      try {
          await apiClient.delete(`/posts/${postToDelete.id}`);
          showToast("삭제되었습니다.");
          fetchNotices();
      } catch {
          showToast("삭제 실패");
      } finally {
          setPostToDelete(null);
      }
  };

  return (
    <div className="space-y-10">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900">공지사항 관리</h2>
                <p className="text-sm text-gray-500 mt-1">메인 배너 및 공지사항 게시글을 관리합니다.</p>
            </div>
            {editingPost && (
                <button onClick={resetForm} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300">
                    작성 모드로 전환
                </button>
            )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">
                    {editingPost ? "공지사항 수정" : "새 공지사항 작성"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">제목</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-black transition-all" placeholder="제목을 입력하세요" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">작성자명</label>
                            <input type="text" value={authorDisplayName} onChange={e => setAuthorDisplayName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">배경색 (Hex)</label>
                            <div className="flex gap-2">
                                <input type="text" value={slideBackgroundColor} onChange={e => setSlideBackgroundColor(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" />
                                <div className="w-10 h-10 rounded-xl shadow-inner border border-gray-200" style={{ backgroundColor: slideBackgroundColor }}></div>
                                <button type="button" onClick={() => setSlideBackgroundColor(generateRandomPastelColor())} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200"><i className="fas fa-sync-alt text-gray-500"></i></button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">배너 문구 (메인/서브)</label>
                        <div className="space-y-2">
                            <input type="text" value={slideCaption} onChange={e => setSlideCaption(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="큰 문구 (예: 든든한 식사)" />
                            <input type="text" value={slideCaptionSmall} onChange={e => setSlideCaptionSmall(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none" placeholder="작은 문구 (예: 캠퍼스잇에서)" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">배너 이미지</label>
                        <div className="flex items-center gap-4">
                            <label htmlFor="banner-upload" className="cursor-pointer px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition flex items-center gap-2">
                                <i className="fas fa-image"></i> 파일 선택
                            </label>
                            <input id="banner-upload" type="file" accept="image/*" onChange={handleBannerImageChange} className="hidden" />
                            {bannerFile && <span className="text-xs text-blue-600 font-bold">{bannerFile.name}</span>}
                        </div>
                    </div>

                    {bannerPreview && (
                         <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden shadow-inner border border-gray-100" style={{ backgroundColor: slideBackgroundColor }}>
                            <div className="absolute inset-0 flex flex-col justify-center pl-8 z-10">
                                <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{slideCaption}</h2>
                                <p className="text-gray-600 font-medium">{slideCaptionSmall}</p>
                            </div>
                            <div className="absolute right-0 top-0 h-full w-1/2 mask-image-gradient">
                                <Image
                                    src={bannerPreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <div className="min-h-[300px] border border-gray-200 rounded-xl overflow-hidden">
                        <TextEditor initialContent={editorContent} onContentChange={setEditorContent} />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition transform active:scale-99 disabled:opacity-50">
                        {isLoading ? "처리 중..." : (editingPost ? "수정 완료" : "공지사항 등록")}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">공지사항 목록</h3>
                {isListLoading ? (
                    <div className="text-center py-10 text-gray-400">로딩 중...</div>
                ) : notices.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">공지사항이 없습니다.</div>
                ) : (
                    <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 scrollbar-hide">
                        {notices.map(notice => (
                            <div key={notice.id} className={`p-5 bg-white border rounded-2xl transition-all group ${editingPost?.id === notice.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 hover:border-gray-300 shadow-sm'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">{notice.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>{notice.authorDisplayName}</span>
                                            <span>·</span>
                                            <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(notice)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition"><i className="fas fa-pen text-xs"></i></button>
                                        <button onClick={() => setPostToDelete(notice)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-red-100 hover:text-red-600 transition"><i className="fas fa-trash text-xs"></i></button>
                                    </div>
                                </div>
                                {notice.slideCaption && (
                                    <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: notice.slideBackgroundColor }}></div>
                                        <span className="truncate">{notice.slideCaption}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {postToDelete && <ConfirmModal message="정말 삭제하시겠습니까?" onConfirm={executeDelete} onCancel={() => setPostToDelete(null)} />}
        {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({ show: false, message: "" })} />}
    </div>
  );
}