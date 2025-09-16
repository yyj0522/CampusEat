"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import styles from "../../home/HomePage.module.css";
import Modal from "../../../components/Modal";

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
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); 
  const [imagePreviews, setImagePreviews] = useState([]);
  const currentPath = "/chat/write";

  const editorRef = useRef(null);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 5) {
      setModalMessage("첨부파일은 최대 5개까지 가능합니다.");
      setIsSuccessModal(false);
      setShowModal(true);
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImageFiles([...imageFiles, ...files]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleImageRemove = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const insertImageAtCursor = (src) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "100%";
    img.style.display = "block";
    range.insertNode(img);

    range.setStartAfter(img);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);

    editorRef.current.focus();
  };

  const applyStyle = (command, value = null) => {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const applyFontSize = (size) => {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("fontSize", false, 7); 
    editorRef.current.querySelectorAll('font[size="7"]').forEach((el) => {
      el.style.fontSize = `${size}px`;
      el.removeAttribute("size");
    });
    editorRef.current.focus();
  };

  const handleSubmit = async () => {
    const content = editorRef.current.innerHTML;
    if (!title.trim() || !content.trim()) {
      setModalMessage("제목과 내용을 입력해주세요.");
      setIsSuccessModal(false);
      setShowModal(true);
      return;
    }
    if (submitting) return;
    setSubmitting(true);

    try {
      let uploadedImageURLs = [];
      for (const file of imageFiles) {
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedImageURLs.push(url);
      }

      await addDoc(collection(db, "posts"), {
        title,
        content,
        authorUID: user.uid,       
        authorNickname: nickname,  
        authorUniversity: university,
        createdAt: serverTimestamp(),
        likeCount: 0,
        views: 0,
        commentCount: 0,
        imageURLs: uploadedImageURLs,
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

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {tabs.map((tab) => (
            <span
              key={tab.path}
              className={`${styles.navTab} ${currentPath === tab.path ? styles.activeTab : ''}`}
              onClick={() => router.push(tab.path)}
            >
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

              <div className={styles.formatTools}>
                <select onChange={(e) => applyFontSize(Number(e.target.value))} defaultValue={16} className={styles.fontSizeSelect}>
                  {[14, 16, 18, 20, 22, 24, 28, 32].map((size) => (
                    <option key={size} value={size}>{size}px</option>
                  ))}
                </select>
                <button onClick={() => applyStyle("bold")} className={styles.formatBtn}>B</button>
                <button onClick={() => applyStyle("italic")} className={styles.formatBtn}>I</button>
                <button onClick={() => applyStyle("underline")} className={styles.formatBtn}>U</button>
                <button onClick={() => applyStyle("justifyLeft")} className={styles.formatBtn}>왼쪽</button>
                <button onClick={() => applyStyle("justifyCenter")} className={styles.formatBtn}>가운데</button>
                <button onClick={() => applyStyle("justifyRight")} className={styles.formatBtn}>오른쪽</button>
                <input type="file" accept="image/*" onChange={handleImageChange} multiple className={styles.imageUpload} />
              </div>

              <div
                ref={editorRef}
                className={styles.contentTextArea}
                contentEditable
                suppressContentEditableWarning
                style={{
                  minHeight: "400px", 
                  border: "1px solid #ccc",
                  padding: "10px",
                  overflowY: "auto",
                  textAlign: "left", 
                  fontSize: "16px",
                }}
                onInput={() => setIsEditorEmpty(editorRef.current.innerHTML === "" || editorRef.current.innerHTML === "<br>")}
                data-placeholder="글 내용을 입력해주세요."
              >
                {isEditorEmpty && <span style={{ color: "#999" }}>글 내용을 입력해주세요.</span>}
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px", overflowX: "auto" }}>
                {imagePreviews.map((src, index) => (
                  <div key={index} style={{ position: "relative" }}>
                    <img
                      src={src}
                      alt={`preview-${index}`}
                      style={{ width: "80px", height: "80px", objectFit: "cover", cursor: "pointer", border: "1px solid #ccc" }}
                      onClick={() => insertImageAtCursor(src)}
                    />
                    <button
                      onClick={() => handleImageRemove(index)}
                      style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        background: "red",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

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
