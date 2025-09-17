"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import Image from "next/image";
import styles from "../HomePage.module.css"; 
import Modal from "../../../components/Modal";

export default function NicknameChangePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalMsg, setModalMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentNickname, setCurrentNickname] = useState("");

  const closeModal = () => setShowModal(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const data = userDocSnap.data();
        setNickname(data?.nickname || "");
        setCurrentNickname(data?.nickname || "");
      } catch (error) {
        console.error("닉네임 불러오기 실패:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => setNickname(e.target.value);

  const handleSubmit = async () => {
    if (!nickname.trim()) {
      setModalMsg("닉네임을 입력해주세요.");
      setShowModal(true);
      return;
    }

    if (nickname === currentNickname) {
      setModalMsg("현재 닉네임과 동일한 닉네임입니다.");
      setShowModal(true);
      return;
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const data = userDocSnap.data();
      const lastChange = data?.lastNicknameChange?.toDate?.() || new Date(0);
      const ONE_DAY = 24 * 60 * 60 * 1000; 
      if (new Date() - lastChange < ONE_DAY) {
        setModalMsg("닉네임 변경은 24시간에 한 번만 가능합니다.");
        setShowModal(true);
        return;
      }

      const querySnapshot = await getDocs(collection(db, "users"));
      const isDuplicate = querySnapshot.docs.some(
        (doc) => doc.data().nickname === nickname && doc.id !== currentUser.uid
      );

      if (isDuplicate) {
        setModalMsg("이미 사용 중인 닉네임입니다.");
        setShowModal(true);
        return;
      }

      await updateDoc(userDocRef, {
        nickname,
        lastNicknameChange: new Date(),
      });

      setModalMsg("닉네임이 변경되었습니다!");
      setCurrentNickname(nickname);
      setShowModal(true);
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
      setModalMsg("닉네임 변경에 실패했습니다.");
      setShowModal(true);
    }
  };

  if (loading) return <p className={styles.loading}>로딩 중...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div
          className={styles.navLeft}
          onClick={() => router.push("/home")}
          style={{ cursor: "pointer" }}
        >
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          <span className={styles.navTab} onClick={() => router.push("/restaurant")}>
            맛집추천
          </span>
          <span className={styles.navTab} onClick={() => router.push("/meeting")}>
            번개모임
          </span>
          <span className={styles.navTab} onClick={() => router.push("/information")}>
            학식&셔틀정보
          </span>
          <span className={styles.navTab} onClick={() => router.push("/chat")}>
            자유게시판
          </span>
        </div>

        <div className={styles.navRight}>
          {currentUser && <span>{currentNickname}님 환영합니다!</span>}
          <button
            className={styles.logoutBtn}
            onClick={() => router.push("/profile")}
          >
            프로필
          </button>
        </div>
      </div>

      <div className={styles.content} style={{ padding: "24px" }}>
        <h2>닉네임 변경</h2>
        <input
          type="text"
          value={nickname}
          onChange={handleChange}
          placeholder="새 닉네임 입력"
          style={{
            padding: "8px",
            width: "20%",
            marginTop: "16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          변경
        </button>
      </div>

      {showModal && (
        <Modal
          message={modalMsg}
          onConfirm={() => {
            closeModal();
            if (modalMsg === "닉네임이 변경되었습니다!") router.push("/profile");
          }}
        />
      )}
    </div>
  );
}
