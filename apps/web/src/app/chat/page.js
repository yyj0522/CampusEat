"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import Image from "next/image";
import styles from "../home/HomePage.module.css";
import Modal from "../../components/Modal";

function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  return (
    <div className={styles.adBanner} style={{ width: "200px", height, marginLeft, marginRight }}>
      서브페이지 광고
    </div>
  );
}

function FreeBoard({ nickname, university, router }) {
  const [posts, setPosts] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1); // ✅ 현재 페이지
  const postsPerPage = 10;

  useEffect(() => {
    const fetchPosts = async () => {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const data = snap.docs.map((docSnap, idx) => {
        const docData = docSnap.data();
        return {
          id: docSnap.id,
          number: snap.docs.length - idx,
          commentCount: docData.commentCount || 0,
          ...docData,
        };
      });

      setPosts(data);
    };
    fetchPosts();
  }, [refresh]);

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const paginatedPosts = posts.slice(
    (page - 1) * postsPerPage,
    page * postsPerPage
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    return isToday
      ? `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      : `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")}`;
  };

  const addComment = async (postId, commentData) => {
    const commentsRef = collection(db, "posts", postId, "comments");
    await addDoc(commentsRef, commentData);

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentCount: (posts.find((p) => p.id === postId)?.commentCount || 0) + 1,
    });

    setRefresh((prev) => prev + 1);
  };

  const deleteComment = async (postId, commentId) => {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      commentCount: Math.max((posts.find((p) => p.id === postId)?.commentCount || 1) - 1, 0),
    });

    setRefresh((prev) => prev + 1);
  };

  return (
    <div className={styles.boardContainer}>
      <div>
        {paginatedPosts.map((post) => (
          <div key={post.id} className={styles.postItem}>
            <div
              className={styles.postSummary}
              onClick={() => router.push(`/chat/${post.id}`)}
              style={{
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "8% 55% 13% 8% 8% 8%",
                alignItems: "center",
              }}
            >
              <div>{post.number}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                <span className={styles.postTitle}>{post.title}</span>
                {post.commentCount > 0 && (
                  <span className={styles.commentCount}>
                    [{post.commentCount}]
                  </span>
                )}
              </div>
              <div>{post.authorNickname}</div>
              <div>{formatDate(post.createdAt)}</div>
              <div>{post.views || 0}</div>
              <div>{post.likeCount || 0}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ 페이지네이션 */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
  <button
    onClick={() => setPage(1)}
    disabled={page === 1}
    className={styles.pageButton}
  >
    {"<<"}
  </button>
  <button
    onClick={() => setPage((p) => Math.max(p - 1, 1))}
    disabled={page === 1}
    className={styles.pageButton}
  >
    {"<"}
  </button>

  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
    <button
      key={num}
      onClick={() => setPage(num)}
      className={`${styles.pageButton} ${page === num ? styles.activePage : ""}`}
    >
      {num}
    </button>
  ))}

  <button
    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
    disabled={page === totalPages}
    className={styles.pageButton}
  >
    {">"}
  </button>
  <button
    onClick={() => setPage(totalPages)}
    disabled={page === totalPages}
    className={styles.pageButton}
  >
    {">>"}
  </button>
</div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const currentPath = "/chat";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(docRef);
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

  const tabs = [
    { label: "맛집추천", path: "/restaurant" },
    { label: "번개모임", path: "/meeting" },
    { label: "학식&셔틀정보", path: "/information" },
    { label: "자유게시판", path: "/chat" },
  ];

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
          {tabs.map((tab) => (
            <span
              key={tab.path}
              className={`${styles.navTab} ${currentPath === tab.path ? styles.activeTab : ""}`}
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
            <h1 className={styles.boardTitle}>자유 게시판</h1>
            <div className={styles.sortBar}>
              <div>번호</div>
              <div>제목</div>
              <div>작성자</div>
              <div>작성일</div>
              <div>조회수</div>
              <div>추천수</div>
            </div>
            <div className={styles.boardListContainer}>
              <FreeBoard nickname={nickname} university={university} router={router} />
              <button onClick={() => router.push("/chat/write")} className={styles.writeButton}>
                글쓰기
              </button>
            </div>
          </div>
        </div>
        <AdBanner />
      </div>
    </div>
  );
}
