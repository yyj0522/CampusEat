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
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion, 
  arrayRemove,
} from "firebase/firestore";
import Image from "next/image";
import Script from "next/script";
import styles from "../home/HomePage.module.css";

// ------------------------ 광고 배너 ------------------------
function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  // 항상 테스트 광고 표시
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


// ------------------------ 자유게시판 ------------------------
function FreeBoard({ nickname, university }) {
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [editPostId, setEditPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [likedPosts, setLikedPosts] = useState({}); // 추천 상태

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // 전체 글 불러오기
  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc, idx) => ({
        id: doc.id,
        number: idx + 1,
        ...doc.data(),
      }));
      setPosts(data);
    };
    fetchPosts();
  }, [refresh]);

  // 추천 상태 초기화
  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!nickname) return;
      const usersRef = collection(db, "users");
      const snap = await getDocs(usersRef);
      const userDoc = snap.docs.find((doc) => doc.data().nickname === nickname);
      if (userDoc?.exists()) {
        const liked = userDoc.data().likedPosts || [];
        const likedMap = {};
        liked.forEach((id) => (likedMap[id] = true));
        setLikedPosts(likedMap);
      }
    };
    fetchLikedPosts();
  }, [nickname]);

  // 댓글 등록
  const handleComment = async (postId) => {
    const commentContent = commentInputs[postId];
    if (!commentContent) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      content: commentContent,
      authorNickname: nickname,
      authorUniversity: university,
      createdAt: serverTimestamp(),
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setRefresh((r) => r + 1);
  };

  const handleDeletePost = async (postId) => {
  if (!window.confirm("정말 삭제하시겠습니까?")) return;

  const commentsSnap = await getDocs(collection(db, "posts", postId, "comments"));
  const deleteCommentsPromises = commentsSnap.docs.map((docC) =>
    deleteDoc(doc(db, "posts", postId, "comments", docC.id))
  );
  await Promise.all(deleteCommentsPromises);
  await deleteDoc(doc(db, "posts", postId));

  setRefresh((r) => r + 1);
};


  // 글 수정 저장
  const handleSaveEdit = async (postId) => {
    if (editContent.trim() === "") return;
    await updateDoc(doc(db, "posts", postId), { content: editContent });
    setEditPostId(null);
    setEditContent("");
    setRefresh((r) => r + 1);
  };

  // 추천
  const handleLike = async (post) => {
    if (!nickname) return;
    const postRef = doc(db, "posts", post.id);

    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    const userDoc = snap.docs.find((d) => d.data().nickname === nickname);
    if (!userDoc) return;
    const userRef = doc(db, "users", userDoc.id);

    if (likedPosts[post.id]) {
      await updateDoc(postRef, { likeCount: (post.likeCount || 1) - 1 });
      await updateDoc(userRef, { likedPosts: arrayRemove(post.id) });
      setLikedPosts((prev) => ({ ...prev, [post.id]: false }));
    } else {
      await updateDoc(postRef, { likeCount: (post.likeCount || 0) + 1 });
      await updateDoc(userRef, { likedPosts: arrayUnion(post.id) });
      setLikedPosts((prev) => ({ ...prev, [post.id]: true }));
    }

    setRefresh((r) => r + 1);
  };

  // 날짜 포맷
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

  // ------------------ 페이지네이션 ------------------
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <div style={{ width: "100%" }}>
      <div>
        {currentPosts.map((post, idx) => (
          <div key={post.id} style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "8% 55% 13% 8% 8% 8%",
                borderBottom: "1px solid #eee",
                padding: "8px 16px",
                cursor: "pointer",
              }}
              onClick={() =>
                setExpandedPostId(expandedPostId === post.id ? null : post.id)
              }
            >
              <div>{posts.length - (indexOfFirstPost + idx)}</div>
              <div style={{ textAlign: "left" }}>{post.title}</div>
              <div>{post.authorNickname}</div>
              <div>{formatDate(post.createdAt)}</div>
              <div>{post.views || 0}</div>
              <div>{post.likeCount || 0}</div>
            </div>

            {expandedPostId === post.id && (
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "16px",
                  margin: "8px 16px 0 16px",
                  backgroundColor: "#fff",
                  textAlign: "left",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                }}
              >
               {editPostId === post.id ? (
  <div style={{ marginBottom: "16px" }}>
    <textarea
      value={editContent}
      onChange={(e) => setEditContent(e.target.value)}
      style={{
        width: "97.5%",
        minHeight: "200px",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #ccc",
      }}
    />

    {/* 기존 이미지 표시 + 삭제 버튼 */}
    {post.imageURL && (
  <div style={{ position: "relative", marginTop: "12px", display: "inline-block" }}>
    <img
      src={post.imageURL}
      alt="post"
      style={{
        maxWidth: "100%",
        borderRadius: "8px",
        display: "block",
      }}
    />
    <button
      onClick={async () => {
        if (!window.confirm("사진을 삭제하시겠습니까?")) return;
        await updateDoc(doc(db, "posts", post.id), { imageURL: "" });
        setRefresh((r) => r + 1);
      }}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#fff",
        border: "none",
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        cursor: "pointer",
        fontWeight: "bold",
        lineHeight: "24px",
        textAlign: "center",
      }}
    >
      ×
    </button>
  </div>
)}


    <div style={{ marginTop: "8px", textAlign: "right" }}>
      <button
        onClick={() => handleSaveEdit(post.id)}
        style={{
          padding: "6px 12px",
          marginRight: "8px",
          backgroundColor: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        저장
      </button>
      <button
        onClick={() => setEditPostId(null)}
        style={{
          padding: "6px 12px",
          backgroundColor: "#ccc",
          color: "#000",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        취소
      </button>
    </div>
  </div>
) : (
  /* 수정 모드가 아닌 일반 표시 */
  <div
  style={{
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
    backgroundColor: "#fafafa",
    minHeight: "300px",
  }}
>
  <p
    style={{
      margin: 0,
      fontSize: post.fontSize || "16px",
      fontWeight: post.bold ? "bold" : "normal",
      fontStyle: post.italic ? "italic" : "normal",
      textDecoration: post.underline ? "underline" : "none",
      textAlign: post.align || "left",
      whiteSpace: "pre-wrap", // 줄바꿈 유지
      wordBreak: "break-word", // 긴 단어 줄바꿈
    }}
  >
    {post.content}
  </p>

  {post.imageURL && (
    <img
      src={post.imageURL}
      alt="post"
      style={{
        maxWidth: "100%",
        borderRadius: "8px",
        marginTop: "8px",
        display: "block",
        marginLeft: post.align === "center" ? "auto" : 0,
        marginRight: post.align === "center" ? "auto" : 0,
      }}
    />
  )}
</div>

)}


                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={() => handleLike(post)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: likedPosts[post.id] ? "#4f46e5" : "#fff",
                        color: likedPosts[post.id] ? "#fff" : "#000",
                        border: "1px solid #000",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      추천 {post.likeCount || 0}
                    </button>
                  </div>

                  {/* 수정/삭제 버튼 */}
                  {post.authorNickname === nickname && editPostId !== post.id && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          setEditPostId(post.id);
                          setEditContent(post.content);
                        }}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#4f46e5",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#f43f5e",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                {/* 댓글 목록 */}
                <CommentsList postId={post.id} currentNickname={nickname} />

                {/* 댓글 입력 */}
                <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                    }}
                  />
                  <button
                    onClick={() => handleComment(post.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      backgroundColor: "#4f46e5",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{ textAlign: "center", marginTop: "16px" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  margin: "0 4px",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  backgroundColor: currentPage === page ? "#4f46e5" : "#fff",
                  color: currentPage === page ? "#fff" : "#000",
                  cursor: "pointer",
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



// ------------------------ 댓글 목록 ------------------------
function CommentsList({ postId, currentNickname }) {
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    setComments(
      snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    const interval = setInterval(() => fetchComments(), 2000);
    return () => clearInterval(interval);
  }, [postId]);

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    fetchComments();
  };

  const formatFullDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const hh = date.getHours().toString().padStart(2, "0");
    const mi = date.getMinutes().toString().padStart(2, "0");
    const ss = date.getSeconds().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  return (
    <div style={{ marginTop: "8px" }}>
      {comments.map((c) => (
        <div
          key={c.id}
          style={{
            padding: "8px",
            borderBottom: "1px solid #eee",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div>
            <div style={{ display: "flex", gap: "8px", alignItems: "baseline" }}>
              <span style={{ fontWeight: "bold" }}>{c.authorNickname}</span>
              <span style={{ color: "#888", fontSize: "12px" }}>
                {formatFullDate(c.createdAt)}
              </span>
            </div>
            <div style={{ fontSize: "14px", marginTop: "4px" }}>{c.content}</div>
          </div>

          {c.authorNickname === currentNickname && (
            <button
              onClick={() => handleDeleteComment(c.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "#888",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ------------------------ ChatPage ------------------------
export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");

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
              className={styles.navTab}
              onClick={() => router.push(tab.path)}
            >
              {tab.label}
            </span>
          ))}
        </div>

        <div className={styles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button
            className={styles.logoutBtn}
            onClick={() => router.push("/profile")}
          >
            프로필
          </button>
        </div>
      </div>

      <div style={{ display: "flex", marginTop: "32px", gap: "16px" }}>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-start" }}>
          <AdBanner width="80%" height="700px" marginLeft="64px" />
        </div>

        <div style={{ flex: "3", textAlign: "center", position: "relative" }}>
  <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "16px" }}>
    자유 게시판
  </h1>

  {/* -------------------- 정렬바 -------------------- */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "8% 55% 13% 8% 8% 8%",
      fontWeight: "bold",
      padding: "8px 16px",
      borderBottom: "2px solid #ccc",
      marginBottom: "2px",
      backgroundColor: "#f9fafb",
      borderRadius: "12px",
    }}
  >
    <div style={{ cursor: "pointer" }}> 번호</div>
    <div style={{ cursor: "pointer" }}>제목</div>
    <div style={{ cursor: "pointer" }}>작성자</div>
    <div style={{ cursor: "pointer" }}>작성일</div>
    <div style={{ cursor: "pointer" }}>조회수</div>
    <div style={{ cursor: "pointer" }}>추천수</div>
  </div>

  {/* 글 목록 + 글쓰기 버튼 */}
  <div
    style={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      padding: "16px",
      minHeight: "600px",
      position: "relative",
    }}
  >
    <FreeBoard nickname={nickname} university={university} />

    {/* 글쓰기 버튼 */}
    <button
      onClick={() => router.push("/chat/write")}
      style={{
        position: "absolute",
        bottom: "12px",
        right: "16px",
        padding: "10px 20px",
        backgroundColor: "#3b82f6",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      글쓰기
    </button>
  </div>
</div>
        <div style={{ flex: "1", display: "flex", justifyContent: "flex-end" }}>
          <AdBanner width="80%" height="700px" marginRight="64px" />
        </div>
      </div>
    </div>
  );
}

