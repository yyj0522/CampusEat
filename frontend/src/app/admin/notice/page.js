"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import TextEditor from "../../(main)/community/TextEditor";

function ConfirmModal({ message, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter") {
        onConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onConfirm]);

  return (
    <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
        <p className="text-lg font-medium text-gray-800 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="text-white px-8 py-2 rounded-lg transition w-1/2 bg-red-500 hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

const generateRandomPastelColor = () => {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 10; 
  const lightness = 90 + Math.random() * 5;   
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default function NoticeUploaderPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slideCaption, setSlideCaption] = useState("");
  const [slideCaptionSmall, setSlideCaptionSmall] = useState("");
  const [slideBackgroundColor, setSlideBackgroundColor] = useState("#EBF5FF");
  const [authorDisplayName, setAuthorDisplayName] = useState("관리자");
  const [editorContent, setEditorContent] = useState("");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [notices, setNotices] = useState([]);
  const [isLoadingNotices, setIsLoadingNotices] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);

  const fetchNotices = useCallback(async () => {
    setIsLoadingNotices(true);
    try {
      const response = await apiClient.get("/posts");
      const noticePosts = response.data
        .filter((post) => post.category === "notice")
        .sort((a, b) => new Date(b.createdAt) - new Date(b.createdAt));
      setNotices(noticePosts);
    } catch (error) {
      console.error("공지사항 목록 로딩 실패:", error);
      setAlertMessage("공지사항 목록을 불러오는 데 실패했습니다.");
    } finally {
      setIsLoadingNotices(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
    setSlideBackgroundColor(generateRandomPastelColor());
  }, [fetchNotices]);

  const resetForm = () => {
    setTitle("");
    setSlideCaption("");
    setSlideCaptionSmall("");
    setAuthorDisplayName("관리자");
    setEditorContent("");
    setBannerFile(null);
    setBannerPreview(null);
    setEditingPost(null);
    setIsLoading(false);
    setSlideBackgroundColor(generateRandomPastelColor());
    const bannerInput = document.getElementById("banner");
    if (bannerInput) bannerInput.value = null;
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result);
      reader.readAsDataURL(file);
    } else if (!editingPost) {
      setBannerFile(null);
      setBannerPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setAlertMessage("제목을 입력해주세요.");
    if (!authorDisplayName.trim()) return setAlertMessage("작성자명을 입력해주세요.");
    if (!editingPost && !bannerFile) return setAlertMessage("신규 작성 시 배너 이미지는 필수입니다.");
    if (!editorContent.trim() || editorContent === "<p><br></p>")
      return setAlertMessage("내용을 입력해주세요.");
    
    setIsLoading(true);
    setAlertMessage(null);
    try {
      let slideImageUrl = editingPost ? editingPost.slideImage : null;
      
      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append("file", bannerFile);
        const uploadResponse = await apiClient.post("/uploads", bannerFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        slideImageUrl = uploadResponse.data.imageUrl;
        if (!slideImageUrl) throw new Error("배너 이미지 업로드 실패");
      }
      
      const finalSlideImage = (slideImageUrl === null || slideImageUrl === "") ? undefined : slideImageUrl;

      const basePostData = {
        title,
        content: editorContent,
        slideImage: finalSlideImage, 
        slideCaption,
        slideCaptionSmall,
        slideBackgroundColor,
        authorDisplayName,
        isAnonymous: false,
      };

      if (editingPost) {
        // 수정(PATCH) 요청 시: category 필드를 전송하지 않음
        const updateData = { ...basePostData };
        // updateData.category = editingPost.category; // 이 라인을 제거하여 400 에러 방지

        await apiClient.patch(`/posts/${editingPost.id}`, updateData);
        setAlertMessage("공지사항이 성공적으로 수정되었습니다.");
      } else {
        // 생성(POST) 요청 시: category 필드를 포함
        const createData = {
            ...basePostData,
            category: "notice",
        };
        await apiClient.post("/posts", createData);
        setAlertMessage("공지사항이 성공적으로 작성되었습니다.");
      }
      
      resetForm();
      fetchNotices();
    } catch (error) {
      console.error("Axios 오류 객체:", error);
      const errorMsg =
        error.response?.data?.message || error.message || "알 수 없는 오류가 발생했습니다.";
      setAlertMessage(`작업 실패: ${errorMsg}`);
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
    setBannerFile(null);
    setAlertMessage(null);
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (notice) => {
    setPostToDelete(notice);
  };

  const executeDelete = async () => {
    if (!postToDelete) return;
    setIsLoading(true);
    try {
      await apiClient.delete(`/posts/${postToDelete.id}`);
      setAlertMessage("공지사항이 삭제되었습니다.");
      fetchNotices();
    } catch (error) {
      console.error("공지사항 삭제 오류:", error);
      setAlertMessage("삭제 중 오류가 발생했습니다.");
    } finally {
      setPostToDelete(null);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {editingPost ? "공지사항 수정" : "공지사항 작성"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-lg font-semibold text-gray-700 mb-2">
                  공지사항 제목 (리스트 노출)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="공지사항 리스트에 표시될 제목을 입력하세요"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="slideCaption" className="block text-lg font-semibold text-gray-700 mb-2">
                  슬라이드 문구 (큰 글씨 - 메인 배너 노출)
                </label>
                <input
                  type="text"
                  id="slideCaption"
                  value={slideCaption}
                  onChange={(e) => setSlideCaption(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="예: 든든한 노후, 지금부터 시작하세요"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="slideCaptionSmall" className="block text-lg font-semibold text-gray-700 mb-2">
                  슬라이드 문구 (작은 글씨 - 메인 배너 노출)
                </label>
                <input
                  type="text"
                  id="slideCaptionSmall"
                  value={slideCaptionSmall}
                  onChange={(e) => setSlideCaptionSmall(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="예: 캠퍼스잇[테스트]"
                />
              </div>
              <div>
                <label htmlFor="author" className="block text-lg font-semibold text-gray-700 mb-2">
                  작성자명
                </label>
                <input
                  type="text"
                  id="author"
                  value={authorDisplayName}
                  onChange={(e) => setAuthorDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="예: 관리자"
                />
              </div>
              <div>
                 <label htmlFor="banner" className="block text-lg font-semibold text-gray-700 mb-2">
                  배너 이미지 {editingPost && "(수정 시에만 선택 사항)"}
                </label>
                <input
                  type="file"
                  id="banner"
                  accept="image/*"
                  onChange={handleBannerImageChange}
                  className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                />
              </div>
            </div>
            
            {bannerPreview && (
              <div className="mt-4 space-y-2">
                <span className="text-md font-medium text-gray-600">
                  배너 미리보기 (홈 화면 적용 예시)
                </span>
                <div 
                    className="relative w-full aspect-[21/8] overflow-hidden rounded-[2rem] shadow-lg flex"
                    style={{ backgroundColor: slideBackgroundColor }}
                >
                    <div className="w-3/5 h-full flex flex-col justify-center pl-10 pr-4 z-10">
                        <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3 break-keep">
                            {slideCaption || "슬라이드 문구 (큰 글씨)"}
                        </h2>
                        <p className="text-gray-600 text-lg font-medium">
                            {slideCaptionSmall || "슬라이드 문구 (작은 글씨)"}
                        </p>
                        <div className="mt-6 px-5 py-2.5 bg-black text-white text-sm font-bold rounded-lg w-fit shadow-md">
                            자세히보기
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-2/5 h-full flex items-center justify-center">
                         <img 
                            src={bannerPreview} 
                            alt="배너 미리보기" 
                            className="w-full h-full object-cover" 
                         />
                    </div>
                </div>
                <div className="flex justify-end">
                    <button 
                        type="button"
                        onClick={() => setSlideBackgroundColor(generateRandomPastelColor())}
                        className="text-sm text-gray-500 hover:text-purple-600 underline"
                    >
                        배경색 변경하기 (랜덤)
                    </button>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                내용 (본문 이미지 첨부 가능)
              </label>
              <TextEditor initialContent={editorContent} onContentChange={setEditorContent} />
            </div>
            
            <div className="flex justify-end items-center gap-4">
              {alertMessage && (
                <div
                  className={`p-3 rounded-lg text-center font-medium ${
                    alertMessage.includes("실패") || alertMessage.includes("오류")
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {alertMessage}
                </div>
              )}
              {editingPost && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 text-white text-lg font-semibold rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  수정 취소
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-10 py-3 bg-purple-600 text-white text-lg font-semibold rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {editingPost ? (isLoading ? "수정 중..." : "공지사항 수정") : isLoading ? "작성 중..." : "공지사항 작성"}
              </button>
            </div>
          </form>
          <hr className="my-12 border-t-2 border-gray-100" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">공지사항 목록</h2>
            <div className="space-y-4">
              {isLoadingNotices ? (
                <p className="text-gray-500">목록을 불러오는 중...</p>
              ) : notices.length === 0 ? (
                <p className="text-gray-500">작성된 공지사항이 없습니다.</p>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                    <div>
                      <span className="text-lg font-medium text-gray-700">{notice.title}</span>
                      <span className="text-sm text-gray-500 ml-3">
                        ({notice.authorDisplayName || "알 수 없음"})
                      </span>
                      {notice.slideCaption && (
                         <p className="text-xs text-gray-400 mt-1">
                             슬라이드: {notice.slideCaption} / {notice.slideCaptionSmall}
                         </p>
                      )}
                    </div>
                    <div className="space-x-3 flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleEditClick(notice)}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteClick(notice)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {postToDelete && (
        <ConfirmModal
          message="공지사항을 삭제하시겠습니까?"
          onConfirm={executeDelete}
          onCancel={() => setPostToDelete(null)}
        />
      )}
    </>
  );
}