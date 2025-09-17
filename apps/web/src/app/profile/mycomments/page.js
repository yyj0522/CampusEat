"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import Image from "next/image";
import styles from "../../home/HomePage.module.css";

function CommentedPosts({ currentUserUID, router }) {
  const [posts, setPosts] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!currentUserUID) return;

    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, "posts");
        const snap = await getDocs(postsRef);
        const allPosts = [];

        for (const docSnap of snap.docs) {
          const postData = docSnap.data();
          const commentsRef = collection(db, "posts", docSnap.id, "comments");
          const commentsSnap = await getDocs(query(commentsRef, where("authorUID", "==", currentUserUID)));

          if (!commentsSnap.empty) {
            allPosts.push({
              id: docSnap.id,
              ...postData,
            });
          }
        }

        allPosts.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());

        setPosts(allPosts);
      } catch (error) {
        console.error("댓글 단 글 불러오기 오류:", error);
      }
    };

    fetchPosts();
  }, [currentUserUID, refresh]);

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

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(posts.length / pageSize);
  const paginatedPosts = posts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.boardContainer}>
      {paginatedPosts.map((post, idx) => (
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
            <div>{(page - 1) * pageSize + idx + 1}</div>
            <div style={{ display: "flex", alignItems: "center", overflow: "hidden", whiteSpace: "nowrap" }}>
              <span className={styles.postTitle}>{post.title}</span>
              {post.commentCount > 0 && <span className={styles.commentCount}>[{post.commentCount}]</span>}
            </div>
            <div>{post.authorNickname}</div>
            <div>{formatDate(post.createdAt)}</div>
            <div>{post.views || 0}</div>
            <div>{post.likeCount || 0}</div>
          </div>
        </div>
      ))}

      {totalPages > 1 && (
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "8px" }}>
          <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
            이전
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyCommentedPostsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) setNickname(snap.data().nickname);
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
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {tabs.map((tab) => (
            <span
              key={tab.path}
              className={`${styles.navTab} ${"/chat" === tab.path ? styles.activeTab : ""}`}
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
        <div className={styles.mainContentContainer}>
          <div className={styles.boardSection}>
            <h1 className={styles.boardTitle}>내가 댓글 단 글</h1>
            <div className={styles.sortBar}>
              <div>번호</div>
              <div>제목</div>
              <div>작성자</div>
              <div>작성일</div>
              <div>조회수</div>
              <div>추천수</div>
            </div>
            <CommentedPosts currentUserUID={user?.uid} router={router} />
          </div>
        </div>
      </div>
    </div>
  );
}
