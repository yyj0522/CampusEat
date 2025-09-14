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
  onSnapshot,
} from "firebase/firestore";
import Image from "next/image";
import styles from "../home/HomePage.module.css";
import Modal from "../../components/Modal";

// ------------------------ 광고 배너 ------------------------
function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  return (
    <div className={styles.adBanner} style={{ width: "200px", height, marginLeft, marginRight }}>
      서브페이지 광고
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
  const [likedPosts, setLikedPosts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [postIdToDelete, setPostIdToDelete] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const postsPerPage = 10;

  // 전체 글 불러오기 (초기 로딩 및 새로고침)
  useEffect(() => {
    const fetchPosts = async () => {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc, idx) => ({
        id: doc.id,
        number: snap.docs.length - idx,
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
      if (userDoc) {
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
    if (!commentContent) {
      alert("댓글을 입력해주세요.");
      return;
    }
    await addDoc(collection(db, "posts", postId, "comments"), {
      content: commentContent,
      authorNickname: nickname,
      authorUniversity: university,
      createdAt: serverTimestamp(),
    });

    setCommentInputs((prev) => ({ ...prev, [posts.id]: "" }));
  };

  const handleDeletePost = (postId) => {
    setPostIdToDelete(postId);
    setModalType("deletePost");
    setShowModal(true);
  };

  const confirmDeletePost = async () => {
    try {
      const commentsSnap = await getDocs(collection(db, "posts", postIdToDelete, "comments"));
      const deleteCommentsPromises = commentsSnap.docs.map((docC) =>
        deleteDoc(doc(db, "posts", postIdToDelete, "comments", docC.id))
      );
      await Promise.all(deleteCommentsPromises);
      await deleteDoc(doc(db, "posts", postIdToDelete));
      setRefresh((r) => r + 1);
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setShowModal(false);
    }
  };

  // 글 수정 저장
  const handleSaveEdit = async (postId) => {
    if (editContent.trim() === "") return;
    try {
      await updateDoc(doc(db, "posts", postId), { content: editContent });
      setEditPostId(null);
      setEditContent("");
      setRefresh((r) => r + 1);
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  };

  // 추천
  const handleLike = async (post) => {
    if (!nickname) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const postRef = doc(db, "posts", post.id);
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    const userDoc = snap.docs.find((d) => d.data().nickname === nickname);
    if (!userDoc) return;
    const userRef = doc(db, "users", userDoc.id);

    try {
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
    } catch (error) {
      console.error("추천 오류:", error);
      alert("추천 기능 중 오류가 발생했습니다.");
    }
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
          .toString().padStart(2, "0")}`;
  };

  const paginatedPosts = posts.slice(0, postsPerPage);

  return (
    <div className={styles.boardContainer}>
      <div>
        {paginatedPosts.map((post) => (
          <div key={post.id} className={styles.postItem}>
            <div
              className={styles.postSummary}
              onClick={() =>
                setExpandedPostId(expandedPostId === post.id ? null : post.id)
              }
            >
              <div>{post.number}</div>
              <div className={styles.postTitle}>{post.title}</div>
              <div>{post.authorNickname}</div>
              <div>{formatDate(post.createdAt)}</div>
              <div>{post.views || 0}</div>
              <div>{post.likeCount || 0}</div>
            </div>

            {expandedPostId === post.id && (
              <div className={styles.postContentContainer}>
                {editPostId === post.id ? (
                  <div className={styles.editSection}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={styles.editTextArea}
                    />

                    {post.imageURL && (
                      <div className={styles.imagePreview}>
                        <img
                          src={post.imageURL}
                          alt="post"
                          className={styles.postImage}
                        />
                        <button
                          onClick={() => {
                            setPostIdToDelete(post.id);
                            setModalType("deleteImage");
                            setShowModal(true);
                          }}
                          className={styles.deleteImageBtn}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div className={styles.editButtons}>
                      <button onClick={() => handleSaveEdit(post.id)} className={styles.saveBtn}>
                        저장
                      </button>
                      <button onClick={() => setEditPostId(null)} className={styles.cancelBtn}>
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.postBody}>
                    <p
                      style={{
                        fontSize: post.fontSize || "16px",
                        fontWeight: post.bold ? "bold" : "normal",
                        fontStyle: post.italic ? "italic" : "normal",
                        textDecoration: post.underline ? "underline" : "none",
                        textAlign: post.align || "left",
                      }}
                      className={styles.postText}
                    >
                      {post.content}
                    </p>

                    {post.imageURL && (
                      <img
                        src={post.imageURL}
                        alt="post"
                        style={{
                          marginLeft: post.align === "center" ? "auto" : 0,
                          marginRight: post.align === "center" ? "auto" : 0,
                        }}
                        className={styles.postImage}
                      />
                    )}
                  </div>
                )}

                <div className={styles.actionButtons}>
                  <div className={styles.likeButtonContainer}>
                    <button
                      onClick={() => handleLike(post)}
                      className={`${styles.likeBtn} ${
                        likedPosts[post.id] ? styles.liked : ""
                      }`}
                    >
                      추천 {post.likeCount || 0}
                    </button>
                  </div>

                  {post.authorNickname === nickname && editPostId !== post.id && (
                    <div className={styles.editDeleteButtons}>
                      <button
                        onClick={() => {
                          setEditPostId(post.id);
                          setEditContent(post.content);
                        }}
                        className={styles.editBtn}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className={styles.deleteBtn}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>

                <CommentsList postId={post.id} currentNickname={nickname} />

                <div className={styles.commentInputContainer}>
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    className={styles.commentInput}
                  />
                  <button onClick={() => handleComment(post.id)} className={styles.commentSubmitBtn}>
                    등록
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {showModal && (
        <Modal
          message={modalType === "deletePost" ? "정말 삭제하시겠습니까?" : "사진을 삭제하시겠습니까?"}
          onConfirm={
            modalType === "deletePost"
              ? confirmDeletePost
              : async () => {
                  try {
                    await updateDoc(doc(db, "posts", postIdToDelete), { imageURL: "" });
                    setRefresh((r) => r + 1);
                  } catch (error) {
                    console.error("이미지 삭제 오류:", error);
                    alert("이미지 삭제 중 오류가 발생했습니다.");
                  } finally {
                    setShowModal(false);
                  }
                }
          }
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// ------------------------ 댓글 목록 ------------------------
function CommentsList({ postId, currentNickname }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [postId]);

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
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
    <div className={styles.commentsList}>
      {comments.map((c) => (
        <div key={c.id} className={styles.commentItem}>
          <div>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor}>{c.authorNickname}</span>
              <span className={styles.commentDate}>
                {formatFullDate(c.createdAt)}
              </span>
            </div>
            <div className={styles.commentContent}>{c.content}</div>
          </div>
          {c.authorNickname === currentNickname && (
            <button
              onClick={() => handleDeleteComment(c.id)}
              className={styles.commentDeleteBtn}
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
        <div className={styles.navLeft} onClick={() => router.push("/home")} style={{ cursor: "pointer" }}>
          <Image src="/icon.png" alt="캠퍼스잇 로고" width={40} height={40} />
          <span className={styles.appName}>캠퍼스잇</span>
        </div>

        <div className={styles.navCenter}>
          {tabs.map((tab) => (
            <span
              key={tab.path}
              className={`${styles.navTab} ${
                currentPath === tab.path ? styles.activeTab : ""
              }`}
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
              <FreeBoard nickname={nickname} university={university} />
              <button
                onClick={() => router.push("/chat/write")}
                className={styles.writeButton}
              >
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
