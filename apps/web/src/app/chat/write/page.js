"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import styles from "../../home/HomePage.module.css";
import Modal from "../../../components/Modal";

// ------------------------ 광고 배너 ------------------------
function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  return (
    <div className={styles.adBanner} style={{ width: "200px", height, marginLeft, marginRight }}>
      테스트 광고
    </div>
  );
}

export default function WritePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState("left");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const currentPath = "/chat/write";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          setNickname(snap.data().nickname);
          setUniversity(snap.data().university);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ---------------- 이미지 선택 ----------------
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // 이미지 삭제
  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ---------------- 글 작성 ----------------
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setModalMessage("제목과 내용을 입력해주세요.");
      setIsSuccessModal(false);
      setShowModal(true);
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      let imageURL = "";
      if (imageFile) {
        const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "posts"), {
        title,
        content,
        authorNickname: nickname,
        authorUniversity: university,
        createdAt: serverTimestamp(),
        likeCount: 0,
        views: 0,
        fontSize,
        bold,
        italic,
        underline,
        align,
        imageURL,
      });

      setModalMessage("글이 성공적으로 작성되었습니다.");
      setIsSuccessModal(true);
      setShowModal(true);
    } catch (error) {
      console.error("글 작성 오류:", error);
      setModalMessage("글 작성 중 오류가 발생했습니다.");
      setIsSuccessModal(false);
      setShowModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- 서식도구 버튼 스타일 ----------------
  const formatButtonStyle = (active) => ({
    backgroundColor: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#000",
  });

  // ---------------- 상단바 탭 ----------------
  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

  return (
    <div className={styles.container}>
      {/* 상단바 */}
      <div className={styles.navbar}>
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {tabs.map((tab) => (
            <span key={tab.path} className={`${styles.navTab} ${currentPath === tab.path ? styles.activeTab : ''}`} onClick={() => router.push(tab.path)}>
              {tab.label}
            </span>
          ))}
        </div>

        <div className={styles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button className={styles.logoutBtn} onClick={() => router.push("/profile")}>
            프로필
          </button>
        </div>
      </div>

      {/* 중앙 컨텐츠 */}
      <div className={styles.content}>
        <AdBanner />
        <div className={styles.mainContentContainer}>
          <div className={styles.boardSection}>
            <h1 className={styles.boardTitle}>글 작성</h1>
            <div className={styles.writeFormContainer}>
              <input
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.titleInput}
              />
              {/* 서식도구 + 이미지첨부 */}
              <div className={styles.formatTools}>
                <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className={styles.fontSizeSelect}>
                  {[14, 16, 18, 20, 22, 24, 28, 32].map((size) => <option key={size} value={size}>{size}px</option>)}
                </select>
                <button onClick={() => setBold(!bold)} className={`${styles.formatBtn} ${bold ? styles.activeFormatBtn : ''}`}>B</button>
                <button onClick={() => setItalic(!italic)} className={`${styles.formatBtn} ${italic ? styles.activeFormatBtn : ''}`}>I</button>
                <button onClick={() => setUnderline(!underline)} className={`${styles.formatBtn} ${underline ? styles.activeFormatBtn : ''}`}>U</button>
                <button onClick={() => setAlign("left")} className={`${styles.formatBtn} ${align==="left" ? styles.activeFormatBtn : ''}`}>왼쪽</button>
                <button onClick={() => setAlign("center")} className={`${styles.formatBtn} ${align==="center" ? styles.activeFormatBtn : ''}`}>가운데</button>
                <button onClick={() => setAlign("right")} className={`${styles.formatBtn} ${align==="right" ? styles.activeFormatBtn : ''}`}>오른쪽</button>
                <input type="file" accept="image/*" onChange={handleImageChange} className={styles.imageUpload} />
              </div>
              <textarea
                placeholder="내용"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={styles.contentTextArea}
                style={{
                  fontSize,
                  fontWeight: bold ? "bold" : "normal",
                  fontStyle: italic ? "italic" : "normal",
                  textDecoration: underline ? "underline" : "none",
                  textAlign: align,
                }}
              />
              {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                  <img src={imagePreview} alt="preview" className={styles.previewImage} />
                  <button onClick={handleImageRemove} className={styles.removeImageBtn}>×</button>
                </div>
              )}
              <div className={styles.submitButtonContainer}>
                <button onClick={handleSubmit} disabled={submitting} className={styles.submitButton}>
                  {submitting ? "작성 중..." : "완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <AdBanner />
      </div>
      {showModal && (
        <Modal
          message={modalMessage}
          onConfirm={() => {
            setShowModal(false);
            if (isSuccessModal) router.push("/chat");
          }}
          onCancel={isSuccessModal ? null : () => setShowModal(false)}
        />
      )}
    </div>
  );
}
