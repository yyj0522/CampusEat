import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import PostContent from "./PostContent";

async function getPost(postId) {
  try {
    const postDocRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postDocRef);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const newViews = (postData.views || 0) + 1;
      await updateDoc(postDocRef, { views: newViews });

      const serializedData = JSON.stringify({ ...postData, id: postSnap.id, views: newViews });
      return JSON.parse(serializedData);
    } else {
      return null;
    }
  } catch (error) {
    console.error("게시글 불러오기 오류:", error);
    return null;
  }
}

export default async function PostPage({ params }) {
  const { id } = params;
  const post = await getPost(id);

  if (!post) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  return <PostContent post={post} />;
}