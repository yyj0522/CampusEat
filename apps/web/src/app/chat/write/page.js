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
import Editor from "../../../components/Editor";

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

  const handleSave = async ({ title, content, imageFiles }) => {
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
            <Editor onSave={handleSave} submitting={submitting} />
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
