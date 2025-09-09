"use client";

import Image from "next/image";
import styles from "./LoginPage.css";

export default function LoginPage() {
  return (
    <div className={styles.container}>
      {/* 로고 + 글씨 */}
      <div className={styles.logoContainer}>
        <Image src="/icon.png" alt="캠퍼스잇 로고" width={200} height={200} />
        <h1 className={styles.title}>캠퍼스잇</h1>
      </div>

      {/* 서브타이틀 */}
      <p className={styles.subtitle}>
        캠퍼스 생활을 더 즐겁게 만드는 당신의 친구!
      </p>

      {/* 로그인 폼 */}
      <div className={styles.formContainer}>
        {/* 입력칸 컬럼 */}
        <div className={styles.inputsColumn}>
          <input type="email" placeholder="이메일" className={styles.input} />
          <input type="password" placeholder="비밀번호" className={styles.input} />

          {/* 아이디/비밀번호 찾기 링크 중앙 정렬 */}
          <div className={styles.linksContainer}>
            <span className={styles.link}>아이디 찾기</span>
            <span className={styles.link}>비밀번호 찾기</span>
          </div>
        </div>

        {/* 로그인 버튼 (입력칸 2줄 높이) */}
        <button
          className={styles.button}
          style={{ height: 'calc(2 * 56px + 16px)' }} // 입력칸 높이*2 + gap
        >
          로그인
        </button>
      </div>
    </div>
  );
}
