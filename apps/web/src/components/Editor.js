"use client";

import { useState, useRef, useEffect } from "react";
import { ref, deleteObject, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import styles from "../app/home/HomePage.module.css";

export default function Editor({ initialData, onSave, submitting }) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImageURLs, setExistingImageURLs] = useState([]);
  const [deletedImageURLs, setDeletedImageURLs] = useState([]);
  const [localSubmitting, setLocalSubmitting] = useState(false); // 추가: 로컬 제출 상태
  const editorRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setExistingImageURLs(initialData.imageURLs || []);
      setImagePreviews(initialData.imageURLs || []);
      setImageFiles(initialData.imageFiles || []);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialData.content || "";
      }
    }
  }, [initialData]);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleImageRemove = async (index) => {
    const previewURL = imagePreviews[index];
    const isExisting = existingImageURLs.includes(previewURL);

    if (isExisting) {
      setDeletedImageURLs((prev) => [...prev, previewURL]);
      setExistingImageURLs((prev) => prev.filter((url) => url !== previewURL));

      // Storage에서 삭제 시도 (원본 코드 유지)
      try {
        const storageRef = ref(storage, previewURL);
        await deleteObject(storageRef);
      } catch (err) {
        console.error("Storage 이미지 삭제 실패:", err);
      }
    } else {
      setImageFiles((prev) => prev.filter((_, i) => i !== index));
    }

    setImagePreviews((prev) => prev.filter((_, i) => i !== index));

    // 내용에 포함되어 있는 img 제거
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll("img");
      imgs.forEach((img) => {
        if (img.src === previewURL) img.remove();
      });
    }
  };

  const insertImageAtCursor = (src) => {
    // 제출중이면 삽입 금지
    if (submitting || localSubmitting) return;

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

  const handleSubmit = async () => {
    // 중복 제출 방지
    if (submitting || localSubmitting) return;

    setLocalSubmitting(true); // 즉시 비활성화(버튼 문구 변경)
    try {
      let content = editorRef.current.innerHTML;

      // 글 내용에 실제 삽입된 이미지만 필터링
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const imgTags = Array.from(doc.querySelectorAll("img"));
      const contentImageURLs = imgTags.map((img) => img.src);

      // 이미지 업로드 처리 (새로 추가된 파일만 업로드)
      const uploadedURLs = [];
      for (const file of imageFiles) {
        // 기존 URL이면 스킵
        if (existingImageURLs.includes(file)) continue;
        const storageRef = ref(storage, `posts/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedURLs.push(downloadURL);
      }

      // 최종 이미지 URL: content에 실제 삽입된 URL만 포함
      const finalImageURLs = contentImageURLs.map((url) => {
        if (existingImageURLs.includes(url)) return url;
        const match = uploadedURLs.find((u) => u === url);
        return match || url;
      });

      // 부모 함수(onSave)가 async이면 await 해서 부모 처리 끝날 때까지 로컬 제출 상태 유지
      if (onSave) {
        await onSave({
          title,
          content,
          imageFiles,
          deletedImageURLs,
          imageURLs: finalImageURLs, // PostContent.js에서 사용
        });
      }
    } catch (error) {
      console.error("에디터 제출 오류:", error);
      alert("제출 중 오류가 발생했습니다.");
    } finally {
      setLocalSubmitting(false);
    }
  };

  // 제출 중인지 판단 (부모 또는 로컬 둘 중 하나라도 true면 제출 중)
  const isSubmitting = submitting || localSubmitting;

  return (
    <div className={styles.writeFormContainer}>
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.titleInput}
        disabled={isSubmitting}
      />

      <div className={styles.formatTools}>
        <select
          onChange={(e) => applyFontSize(Number(e.target.value))}
          defaultValue={16}
          className={styles.fontSizeSelect}
          disabled={isSubmitting}
        >
          {[14, 16, 18, 20, 22, 24, 28, 32].map((size) => (
            <option key={size} value={size}>{size}px</option>
          ))}
        </select>
        <button onClick={() => applyStyle("bold")} className={styles.formatBtn} disabled={isSubmitting}>B</button>
        <button onClick={() => applyStyle("italic")} className={styles.formatBtn} disabled={isSubmitting}>I</button>
        <button onClick={() => applyStyle("underline")} className={styles.formatBtn} disabled={isSubmitting}>U</button>
        <button onClick={() => applyStyle("justifyLeft")} className={styles.formatBtn} disabled={isSubmitting}>왼쪽</button>
        <button onClick={() => applyStyle("justifyCenter")} className={styles.formatBtn} disabled={isSubmitting}>가운데</button>
        <button onClick={() => applyStyle("justifyRight")} className={styles.formatBtn} disabled={isSubmitting}>오른쪽</button>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          multiple
          className={styles.imageUpload}
          disabled={isSubmitting}
        />
      </div>

      <div
        ref={editorRef}
        className={styles.contentTextArea}
        contentEditable={!isSubmitting}
        suppressContentEditableWarning
        style={{
          minHeight: "400px",
          border: "1px solid #ccc",
          padding: "10px",
          overflowY: "auto",
          textAlign: "left",
          fontSize: "16px",
          opacity: isSubmitting ? 0.8 : 1,
          pointerEvents: isSubmitting ? "none" : "auto",
        }}
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "10px", overflowX: "auto" }}>
        {imagePreviews.map((src, index) => (
          <div key={index} style={{ position: "relative" }}>
            <img
              src={src}
              alt={`preview-${index}`}
              style={{ width: "80px", height: "80px", objectFit: "cover", cursor: isSubmitting ? "not-allowed" : "pointer", border: "1px solid #ccc" }}
              onClick={() => insertImageAtCursor(src)}
            />
            <button
              onClick={() => handleImageRemove(index)}
              disabled={isSubmitting}
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
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className={styles.submitButtonContainer}>
        <button onClick={handleSubmit} disabled={isSubmitting} className={styles.submitButton}>
          {isSubmitting ? (initialData ? "수정중..." : "작성중...") : "완료"}
        </button>
      </div>
    </div>
  );
}
