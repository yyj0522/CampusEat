"use client";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { useRouter } from "next/navigation";

export default function CustomContextMenu() {
    const { contextMenu, closeContextMenu, setShowReportModal, openDmModal } = useUserInteraction();
    const { user } = useAuth();
    const router = useRouter();

    if (!contextMenu.show) return null;

    const handleReportClick = () => {
        setShowReportModal(true);
        closeContextMenu();
    };

    const handleDmClick = () => {
        openDmModal(contextMenu.targetUser);
        closeContextMenu();
    };

    const handleProfileClick = () => {
        router.push('/profile');
        closeContextMenu();
    };

    const isSelf = user && user.uid === contextMenu.targetUser?.id;

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