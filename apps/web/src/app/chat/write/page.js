"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import styles from "../../home/HomePage.module.css";

// ------------------------ 광고 배너 ------------------------
function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  return (
    <div
      style={{
        width: "200px",
        height,
        marginLeft,
        marginRight,
        marginTop: "50px",
        backgroundColor: "#e5e7eb",
        borderRadius: "12px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#555",
        fontWeight: "bold",
        fontSize: "14px",
      }}
    >
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
    // 서식도구 상태 그대로 유지
  };

  // ---------------- 글 작성 ----------------
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
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

      router.push("/chat");
    } catch (error) {
      console.error("글 작성 오류:", error);
      alert("글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- 서식도구 버튼 스타일 ----------------
  const formatButtonStyle = (active) => ({
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    backgroundColor: active ? "#4f46e5" : "#fff",
    color: active ? "#fff" : "#000",
    cursor: "pointer",
    marginLeft: "4px",
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
            <span key={tab.path} className={styles.navTab} onClick={() => router.push(tab.path)}>
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

      {/* 중앙 컨텐츠 + 광고 */}
      <div style={{ display: "flex", marginTop: "32px", gap: "16px" }}>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-start" }}>
          <AdBanner width="80%" height="700px" marginLeft="64px" />
        </div>

        <div style={{ flex: "3", textAlign: "center" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px" }}>글 작성</h1>
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "16px", minHeight: "500px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "95%", marginBottom: "16px", padding: "12px", borderRadius: "8px", fontSize: "18px" }}
            />

            {/* 서식도구 + 이미지첨부 */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "12px", flexWrap: "wrap" }}>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ marginLeft: "4px" }}>
                {[14,16,18,20,22,24,28,32].map((size) => <option key={size} value={size}>{size}px</option>)}
              </select>

              <button onClick={() => setBold(!bold)} style={formatButtonStyle(bold)}>B</button>
              <button onClick={() => setItalic(!italic)} style={formatButtonStyle(italic)}>I</button>
              <button onClick={() => setUnderline(!underline)} style={formatButtonStyle(underline)}>U</button>
              <button onClick={() => setAlign("left")} style={formatButtonStyle(align==="left")}>왼쪽</button>
              <button onClick={() => setAlign("center")} style={formatButtonStyle(align==="center")}>가운데</button>
              <button onClick={() => setAlign("right")} style={formatButtonStyle(align==="right")}>오른쪽</button>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginLeft: "4px" }} />
            </div>

            <textarea
              placeholder="내용"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: "95%",
                minHeight: "450px",
                padding: "12px",
                borderRadius: "8px",
                fontSize,
                fontWeight: bold ? "bold" : "normal",
                fontStyle: italic ? "italic" : "normal",
                textDecoration: underline ? "underline" : "none",
                textAlign: align,
              }}
            />

            {imagePreview && (
              <div style={{ marginTop: "12px", position: "relative", display: "inline-block" }}>
                <img src={imagePreview} alt="preview" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                <button onClick={handleImageRemove} style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "24px",
                  height: "24px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}>×</button>
              </div>
            )}

            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button onClick={handleSubmit} disabled={submitting} style={{
                padding: "8px 16px",
                borderRadius: "8px",
                backgroundColor: "#4f46e5",
                color: "#fff",
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}>
                {submitting ? "작성 중..." : "완료"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: "1", display: "flex", justifyContent: "flex-end" }}>
          <AdBanner width="80%" height="700px" marginRight="64px" />
        </div>
      </div>
    </div>
  );
}
