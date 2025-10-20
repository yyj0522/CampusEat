// src/app/components/CustomContextMenu.js
"use client";

import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "next/navigation";

export default function CustomContextMenu() {
    // ✅ 수정: Provider에서 제공하는 함수들을 일관되게 사용합니다.
    const { contextMenu, closeContextMenu, openReportModal, openDmModal } = useUserInteraction();
    const { user } = useAuth();
    const router = useRouter();

    if (!contextMenu.show) return null;

    const { targetUser, context } = contextMenu;

    // ✅ 수정: 각 핸들러가 Provider의 함수를 호출하도록 변경합니다.
    const handleReportClick = () => {
        openReportModal(targetUser, context);
    };

    const handleDmClick = () => {
        openDmModal(targetUser, context);
    };

    const handleProfileClick = () => {
        router.push('/profile');
        closeContextMenu();
    };

    const isSelf = user && user.id === targetUser?.id;
    const isTargetAdmin = targetUser?.role === 'super_admin' || targetUser?.role === 'sub_admin';

    if (!isSelf && isTargetAdmin) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 z-[99]"
            onClick={closeContextMenu}
            onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
        >
            <div 
                className="absolute bg-white rounded-md shadow-lg py-2 w-36"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                {isSelf ? (
                    <button onClick={handleProfileClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">프로필 가기</button>
                ) : (
                    <>
                        <button onClick={handleDmClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">쪽지 보내기</button>
                        <button onClick={handleReportClick} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">신고하기</button>
                    </>
                )}
            </div>
        </div>
    );
}

