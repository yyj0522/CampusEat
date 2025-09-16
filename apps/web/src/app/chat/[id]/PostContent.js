"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {auth, db} from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {doc, getDoc, updateDoc, deleteDoc, collection, addDoc, onSnapshot, orderBy, arrayUnion, arrayRemove, serverTimestamp, query, getDocs} from "firebase/firestore";
import styles from "../../home/HomePage.module.css";
import postStyles from "./PostPage.module.css";
import Image from "next/image";
import Modal from "../../../components/Modal";

function AdBanner({ width = "90%", height = "600px", marginLeft = 0, marginRight = 0 }) {
  return (
    <div className={styles.adBanner} style={{ width: "200px", height, marginLeft, marginRight }}>
      테스트 광고
    </div>
  );
}

function CommentsList({ postId, currentNickname, onDeleteClick }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  const formatFullDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const hh = date.getHours().toString().padStart(2, "0");
    const mi = date.getMinutes().toString().padStart(2, "0");
    const ss = date.getSeconds().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  };

  return (
    <div className={postStyles.commentsList}>
      {comments.map((c) => (
        <div key={c.id} className={postStyles.commentItem}>
          <div>
            <div className={postStyles.commentHeader}>
              <span className={postStyles.commentAuthor}>{c.authorNickname}</span>
              <span className={postStyles.commentDate}>{formatFullDate(c.createdAt)}</span>
            </div>
            <div className={postStyles.commentContent}>{c.content}</div>
          </div>
          {c.authorNickname === currentNickname && (
            <button onClick={() => onDeleteClick(c.id)} className={postStyles.commentDeleteBtn}>×</button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PostContent({ post }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [likedPosts, setLikedPosts] = useState({});
  const [localPost, setLocalPost] = useState(post);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [postDeleteConfirm, setPostDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          setNickname(snap.data().nickname);
          setUniversity(snap.data().university);
          const liked = snap.data().likedPosts || [];
          const likedMap = {};
          liked.forEach((id) => (likedMap[id] = true));
          setLikedPosts(likedMap);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = onSnapshot(doc(db, "posts", post.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const updatedPostData = docSnapshot.data();
        const serializedData = JSON.stringify({ ...updatedPostData, id: docSnapshot.id });
        setLocalPost(JSON.parse(serializedData));
      }
    });
    return () => unsubscribe();
  }, [post?.id]);

  const handleLike = async () => {
    if (!user) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const postRef = doc(db, "posts", localPost.id);
    const userRef = doc(db, "users", user.uid);

    try {
      if (likedPosts[localPost.id]) {
        await updateDoc(postRef, { likeCount: (localPost.likeCount || 1) - 1 });
        await updateDoc(userRef, { likedPosts: arrayRemove(localPost.id) });
        setLikedPosts((prev) => ({ ...prev, [localPost.id]: false }));
      } else {
        await updateDoc(postRef, { likeCount: (localPost.likeCount || 0) + 1 });
        await updateDoc(userRef, { likedPosts: arrayUnion(localPost.id) });
        setLikedPosts((prev) => ({ ...prev, [localPost.id]: true }));
      }
    } catch (error) {
      console.error("추천 오류:", error);
      alert("추천 기능 중 오류가 발생했습니다.");
    }
  };

  const handleComment = async () => {
    if (!commentInput) {
      alert("댓글을 입력해주세요.");
      return;
    }
    const postRef = doc(db, "posts", localPost.id);

    await addDoc(collection(db, "posts", localPost.id, "comments"), {
      content: commentInput,
      authorNickname: nickname,
      authorUniversity: university,
      authorUID: user.uid,
      createdAt: serverTimestamp(),
    });

    await updateDoc(postRef, {
      commentCount: (localPost.commentCount || 0) + 1,
    });

    setCommentInput("");
  };

  const handleDeleteClick = (commentId) => {
    setCommentToDelete(commentId);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    const postRef = doc(db, "posts", localPost.id);

    try {
      await deleteDoc(doc(db, "posts", localPost.id, "comments", commentToDelete));
      await updateDoc(postRef, {
        commentCount: Math.max((localPost.commentCount || 1) - 1, 0),
      });
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setModalOpen(false);
      setCommentToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setCommentToDelete(null);
  };

  const handleDeletePost = () => {
    setPostDeleteConfirm(true);
  };

  const handleConfirmDeletePost = async () => {
    try {
      const postRef = doc(db, "posts", localPost.id);
      const commentsRef = collection(postRef, "comments");
      const commentsSnapshot = await getDocs(commentsRef);
      const deletePromises = commentsSnapshot.docs.map((commentDoc) =>
        deleteDoc(commentDoc.ref)
      );
      await Promise.all(deletePromises);
      await deleteDoc(postRef);
      router.push("/chat");
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    } finally {
      setPostDeleteConfirm(false);
    }
  };

  const handleCancelDeletePost = () => {
    setPostDeleteConfirm(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    } else {
      return `${date.getFullYear()}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getDate().toString().padStart(2,'0')}`;
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
            <span key={tab.path} className={`${styles.navTab} ${tab.path === "/chat" ? styles.activeTab : ''}`} onClick={() => router.push(tab.path)}>
              {tab.label}
            </span>
          ))}
        </div>
        <div className={styles.navRight}>
          {nickname && <span>{nickname}님 환영합니다!</span>}
          <button className={styles.logoutBtn} onClick={() => router.push("/profile")}>프로필</button>
        </div>
      </div>

      <div className={styles.content}>
        <AdBanner />
        <div className={styles.mainContentContainer}>
          <div className={styles.boardSection}>
            <h1 className={styles.boardTitle}>게시글</h1>
            <div className={postStyles.postDetailContainer}>
              <section className={postStyles.postHeader}>
                <h2 className={postStyles.postTitle}>{localPost.title}</h2>
                <div className={postStyles.postMeta}>
                  <div className={postStyles.metaInfo}>
                    <span className={postStyles.author}>작성자: {localPost.authorNickname}</span>
                    <span className={postStyles.divider}>|</span>
                    <span className={postStyles.date}>{formatTimestamp(localPost.createdAt)}</span>
                  </div>
                  <div className={postStyles.metaInfo}>
                    <span className={postStyles.views}>조회수: {localPost.views}</span>
                  </div>
                </div>
              </section>

              <article className={postStyles.postBody}>
                {localPost.imageURL && (
                  <figure className={postStyles.postImageWrapper}>
                    <img src={localPost.imageURL} alt="게시글 이미지" className={postStyles.postImage} />
                  </figure>
                )}
                <div
                  className={postStyles.postContentText}
                  style={{ textAlign: localPost.align || "left" }}
                  dangerouslySetInnerHTML={{ __html: localPost.content }}
                />
              </article>

              <div style={{ borderTop: "1px solid #e0e0e0", margin: "2rem 0" }} />

              {nickname === localPost.authorNickname && (
                <div className={postStyles.ownerButtonsWrapper}>
                  <div className={postStyles.ownerButtons}>
                    <button onClick={() => router.push(`/chat/write?id=${localPost.id}`)} className={postStyles.editButton}>수정</button>
                    <button onClick={handleDeletePost} className={postStyles.deleteButton}>삭제</button>
                  </div>
                </div>
              )}

              <div className={postStyles.likeWrapper}>
                <button
                  onClick={handleLike}
                  className={`${postStyles.likeButton} ${likedPosts[localPost.id] ? postStyles.liked : ''}`}
                >
                  👍 추천 {localPost.likeCount || 0}
                </button>
              </div>

              <section className={postStyles.commentsSection}>
                <h3>댓글</h3>
                <CommentsList postId={localPost.id} currentNickname={nickname} onDeleteClick={handleDeleteClick} />
                <div className={postStyles.commentForm}>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                    placeholder="댓글을 입력하세요."
                    className={postStyles.commentInput}
                  />
                  <button onClick={handleComment} className={postStyles.commentSubmitBtn}>등록</button>
                </div>
              </section>
              <div style={{ display: "flex", justifyContent: "center", margin: "2rem 0" }}>
                <button className={postStyles.backButton} onClick={() => router.push("/chat")}>
                  목록
                </button>
              </div>
            </div>
          </div>
        </div>
        <AdBanner />
      </div>

      {modalOpen && (
        <Modal
          message="댓글을 삭제하시겠습니까?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {postDeleteConfirm && (
        <Modal
          message="게시글을 삭제하시겠습니까?"
          onConfirm={handleConfirmDeletePost}
          onCancel={handleCancelDeletePost}
        />
      )}
    </div>
  );
}
