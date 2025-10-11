"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function LoginForm({ setMode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });

  const showModal = (title, message) => {
    setModal({ isOpen: true, title, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: "", message: "" });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      showModal("입력 오류", "이메일과 비밀번호를 모두 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        showModal("로그인 실패", "사용자 정보를 찾을 수 없습니다. 관리자에게 문의하세요.");
        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();

      if (userData.status === '정지') {
        const suspensionEndDate = userData.suspensionEndDate?.toDate();
        const now = new Date();

        if (!suspensionEndDate || suspensionEndDate > now) {
          const endDateString = suspensionEndDate
            ? `${suspensionEndDate.toLocaleDateString('ko-KR')}까지`
            : '영구적으로';

          await signOut(auth);
          showModal("계정 정지 안내", `이 계정은 ${endDateString} 정지되었습니다.`);
          setIsLoading(false);
          return;
        } else {
          await updateDoc(userRef, { status: '활성' });
        }
      }

      router.push("/home");

    } catch (err) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        showModal("로그인 실패", "아이디 또는 비밀번호를 확인해주세요.");
      } else if (err.code === "auth/invalid-email") {
        showModal("입력 오류", "올바른 이메일 형식이 아닙니다.");
      } else {
        showModal("로그인 실패", "로그인 중 오류가 발생했습니다.");
      }
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-medium disabled:opacity-50 shadow-lg hover:shadow-purple-300"
        >
          {isLoading ? "로그인 확인 중..." : "캠퍼스잇 로그인"}
        </button>
      </form>

      <div className="mt-4 flex justify-center space-x-6">
        <button
          type="button"
          className="text-gray-500 hover:text-purple-600 font-medium text-sm transition-colors"
          onClick={() => setMode("findID")}
        >
          ID찾기
        </button>
        <button
          type="button"
          className="text-gray-500 hover:text-purple-600 font-medium text-sm transition-colors"
          onClick={() => setMode("findPW")}
        >
          PW찾기
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-purple-600 hover:underline font-medium text-base transition-colors"
          onClick={() => setMode("signup")}
        >
          회원가입하러 가기
        </button>
      </div>


      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={closeModal}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{modal.title}</h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>{modal.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={closeModal}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}