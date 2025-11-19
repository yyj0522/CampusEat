"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../../lib/api";
import io from 'socket.io-client';
import '../../styles/style.css';
import UserDisplay from '../../components/UserDisplay';

const ChatContextMenu = ({ x, y, targetUser, onKick, onClose }) => {
    if (!targetUser) return null;
    return (
        <div
            className="fixed inset-0 z-[100]"
            onClick={onClose}
            onContextMenu={(e) => {
                e.preventDefault();
                onClose();
            }}
        >
            <div
                className="absolute bg-white rounded-md shadow-lg py-2 w-32"
                style={{ top: y, left: x }}
            >
                <button
                    onClick={() => {
                        onKick(targetUser);
                        onClose();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                    강퇴하기
                </button>
            </div>
        </div>
    );
};

const ChatView = ({
    user,
    meeting,
    socket,
    onKickUser,
    onLeaveMeeting,
    onAcknowledgeKick,
    onAcknowledgeDelete,
}) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const [contextMenu, setContextMenu] = useState({
        show: false,
        x: 0,
        y: 0,
        targetUser: null,
    });

    useEffect(() => {
        if (!meeting?.datetime) return;
        const interval = setInterval(() => {
            const now = new Date();
            const deadline = new Date(meeting.datetime);
            const diff = deadline - now;
            if (diff <= 0) {
                setTimeRemaining("모임 종료");
                setIsExpired(true);
                clearInterval(interval);
                return;
            }
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setTimeRemaining(
                `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
                    2,
                    "0"
                )}:${String(seconds).padStart(2, "0")}`
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [meeting]);

    const isKicked =
        meeting && user && meeting.kickedUserIds.includes(user.id);
    const isDeletedByAdmin =
        meeting && meeting.status === "deleted_by_admin";

    useEffect(() => {
        if (!socket || !meeting?.id || isKicked || isDeletedByAdmin) {
            setMessages([]);
            return;
        }

        apiClient
            .get(`/gatherings/${meeting.id}/messages`)
            .then((response) => setMessages(response.data))
            .catch((error) => console.error("채팅 내역 로딩 오류:", error));

        socket.emit("joinRoom", meeting.id);
        const handleNewMessage = (message) =>
            setMessages((prev) => [...prev, message]);
        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
            socket.emit("leaveRoom", meeting.id);
        };
    }, [socket, meeting, isKicked, isDeletedByAdmin]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !user || isExpired || !socket) return;
        socket.emit("sendMessage", {
            gatheringId: meeting.id,
            text: newMessage,
            senderId: user.id,
        });
        setNewMessage("");
    };

    const openChatContextMenu = (e, sender) => {
        e.preventDefault();
        if (user?.id === meeting.creator.id && user?.id !== sender.id) {
            setContextMenu({
                show: true,
                x: e.clientX,
                y: e.clientY,
                targetUser: sender,
            });
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (!meeting) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-100 h-full rounded-r-lg">
                <p className="text-gray-500">
                    왼쪽에서 참여중인 모임을 선택하세요.
                </p>
            </div>
        );
    }

    if (isDeletedByAdmin) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 h-full rounded-r-lg p-4 text-center">
                <i className="fa-solid fa-triangle-exclamation text-5xl text-red-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800">
                    관리자에 의해 삭제된 모임입니다.
                </h3>
                <p className="text-gray-500 mt-2 mb-6">
                    부적절한 내용 포함 등의 사유로 삭제 조치되었습니다.
                </p>
                <button
                    onClick={() => onAcknowledgeDelete(meeting.id)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                    확인 (목록에서 제거)
                </button>
            </div>
        );
    }

    if (isKicked) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 h-full rounded-r-lg p-4 text-center">
                <i className="fa-solid fa-user-slash text-5xl text-red-400 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800">
                    해당 모임에서 강퇴당하셨습니다.
                </h3>
                <p className="text-gray-500 mt-2 mb-6">
                    더 이상 이 모임의 채팅에 참여할 수 없습니다.
                </p>
                <button
                    onClick={() => onAcknowledgeKick(meeting.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                >
                    확인
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white rounded-r-lg border-l border-gray-200 relative">
            {isExpired && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-20 text-white text-center p-4">
                    <h3 className="text-2xl font-bold mb-4">
                        모임이 종료되었습니다.
                    </h3>
                    <p>이 채팅방은 더 이상 활성화되지 않습니다.</p>
                </div>
            )}
            <header className="p-4 bg-white text-gray-800 font-bold border-b flex justify-between items-center flex-shrink-0">
                <div className="flex flex-col">
                    <span className="truncate font-semibold text-base">
                        {meeting.title}
                    </span>
                    <span className="text-xs font-mono text-red-500 font-normal">
                        {timeRemaining} 남음
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-normal">
                        {meeting.participantCount} / {meeting.maxParticipants}명
                    </span>
                    {user.id !== meeting.creator.id && (
                        <button
                            onClick={() => onLeaveMeeting(meeting)}
                            className="text-gray-500 hover:text-red-500 transition"
                            title="모임 나가기"
                        >
                            <i className="fa-solid fa-door-open fa-lg"></i>
                        </button>
                    )}
                </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map((msg) =>
                    msg.isSystemMessage ? (
                        <div key={msg.id} className="text-center w-full my-2">
                            <span
                                className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full"
                                dangerouslySetInnerHTML={{
                                    __html: msg.text.replace(
                                        /\*\*(.*?)\*\*/g,
                                        "<strong>$1</strong>"
                                    ),
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${
                                msg.sender?.id === user?.id
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            {msg.sender?.id !== user?.id && (
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                            )}
                            <div
                                className={`flex flex-col w-full ${
                                    msg.sender?.id === user?.id
                                        ? "items-end"
                                        : "items-start"
                                }`}
                            >
                                {msg.sender?.id !== user?.id && (
                                    <span
                                        className="text-xs text-gray-600 mb-1 cursor-pointer"
                                        onContextMenu={(e) =>
                                            openChatContextMenu(
                                                e,
                                                msg.sender
                                            )
                                        }
                                    >
                                        {msg.sender.nickname}
                                    </span>
                                )}
                                <div className="flex items-end gap-2">
                                    {msg.sender?.id === user?.id && (
                                        <span className="text-xs text-gray-400">
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    )}
                                    <p
                                        className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                                            msg.sender?.id === user?.id
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {msg.text}
                                    </p>
                                    {msg.sender?.id !== user?.id && (
                                        <span className="text-xs text-gray-400">
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}
                <div ref={messagesEndRef} />
            </div>
            <form
                onSubmit={handleSendMessage}
                className="p-2 border-t flex bg-white rounded-br-lg"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 border-gray-300 rounded-l-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isExpired}
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 rounded-r-lg font-semibold"
                    disabled={isExpired}
                >
                    전송
                </button>
            </form>
            {contextMenu.show && (
                <ChatContextMenu
                    {...contextMenu}
                    onKick={onKickUser}
                    onClose={() =>
                        setContextMenu({ show: false, x: 0, y: 0, targetUser: null })
                    }
                />
            )}
        </div>
    );
};

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Enter") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);
    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
                <p className="text-lg mb-6">{message}</p>
                <button
                    onClick={onClose}
                    className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
                <p className="text-lg font-medium text-gray-800 mb-8">
                    {message}
                </p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 text-white px-8 py-2 rounded-lg hover:bg-red-600 transition w-1/2"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
};

const CreateMeetingModal = ({ user, onCreate, show, onClose }) => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [location, setLocation] = useState("");
    const [purpose, setPurpose] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState([]);

    useEffect(() => {
        if (show) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            const todayString = `${year}-${month}-${day}`;
            const defaultDateTime = new Date();
            defaultDateTime.setMinutes(defaultDateTime.getMinutes() + 10);
            const defaultTime = defaultDateTime.toTimeString().slice(0, 5);
            setTitle("");
            setDate(todayString);
            setTime(defaultTime);
            setMaxParticipants(4);
            setLocation("");
            setPurpose("");
            setDescription("");
            setTags([]);
        }
    }, [show]);

    const handleTagToggle = (tag) => {
        setTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!user || !title || !date || !time || !location) {
            alert("필수 항목(*)을 모두 입력해주세요.");
            return;
        }
        const meetingDateTime = new Date(`${date}T${time}`);
        if (meetingDateTime < new Date()) {
            alert(
                "현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다."
            );
            return;
        }
        const gatheringData = {
            title,
            datetime: meetingDateTime.toISOString(),
            maxParticipants: Number(maxParticipants),
            location,
            purpose,
            description,
            tags,
            type: "meeting",
        };
        onCreate(gatheringData);
    };

    if (!show) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800">
                        새 모임 만들기
                    </h3>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="모임 제목을 입력하세요"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                날짜 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                시간 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                최대 인원 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={2}
                                max={20}
                                value={maxParticipants}
                                onChange={(e) =>
                                    setMaxParticipants(e.target.value)
                                }
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                장소 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) =>
                                    setLocation(e.target.value)
                                }
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="만날 장소를 입력하세요"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            목적
                        </label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="모임의 목적을 간단히 설명해주세요 (예: 같이 저녁 먹기)"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            태그
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {["점심", "술", "취미", "스터디", "운동", "게임"].map(
                                (tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagToggle(tag)}
                                        className={`px-4 py-2 text-sm rounded-full font-semibold transition-colors ${
                                            tags.includes(tag)
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상세 설명
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="모임에 대한 자세한 설명을 적어주세요. (오픈채팅방 링크 등)"
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition mr-3"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        모임 만들기
                    </button>
                </div>
            </form>
        </div>
    );
};

const CreateCarpoolModal = ({ user, onCreate, show, onClose }) => {
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [departure, setDeparture] = useState("");
    const [arrival, setArrival] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (show) {
            const today = new Date();
            today.setMinutes(today.getMinutes() + 10);
            const defaultTime = today.toTimeString().slice(0, 5);
            setTitle("");
            setTime(defaultTime);
            setMaxParticipants(4);
            setDeparture("");
            setArrival("");
            setDescription("");
        }
    }, [show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const today = new Date();
        const [hour, minute] = time.split(":");
        today.setHours(Number(hour), Number(minute), 0, 0);
        if (!user || !title || !time || !departure || !arrival) {
            alert("필수 항목(*)을 모두 입력해주세요.");
            return;
        }
        if (today < new Date()) {
            alert(
                "현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다."
            );
            return;
        }
        const meetingDateTime = today;
        const gatheringData = {
            title,
            datetime: meetingDateTime.toISOString(),
            maxParticipants: Number(maxParticipants),
            departure,
            arrival,
            description,
            tags: ["카풀/택시"],
            type: "carpool",
            location: `${departure} → ${arrival}`,
        };
        onCreate(gatheringData);
    };

    if (!show) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800">
                        택시/카풀 동승자 구하기
                    </h3>
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="예: 천안역 갈 사람 2명 구해요"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                출발 시간 (오늘){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                최대 인원 (본인 포함){" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min={2}
                                max={10}
                                value={maxParticipants}
                                onChange={(e) =>
                                    setMaxParticipants(e.target.value)
                                }
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                출발지 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={departure}
                                onChange={(e) =>
                                    setDeparture(e.target.value)
                                }
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="예: 백석대학교 정문"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                도착지 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={arrival}
                                onChange={(e) => setArrival(e.target.value)}
                                required
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="예: 천안역"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상세 설명
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                            rows="4"
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="탑승 관련 추가 정보를 입력해주세요."
                        ></textarea>
                    </div>
                </div>
                <div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onClose(false)}
                        className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition mr-3"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        동승자 구하기
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function MeetingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [gatherings, setGatherings] = useState([]);
    const [filteredGatherings, setFilteredGatherings] = useState([]);
    const [myGatherings, setMyGatherings] = useState([]);
    const [activeTag, setActiveTag] = useState("전체");
    const [isLoading, setIsLoading] = useState(true);
    const [meetingType, setMeetingType] = useState("meeting");
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCarpoolModal, setShowCarpoolModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [gatheringToDelete, setGatheringToDelete] = useState(null);
    const [alertModal, setAlertModal] = useState({ show: false, message: "" });
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [openChatId, setOpenChatId] = useState(null);
    const [socket, setSocket] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    const showAlert = (message) =>
        setAlertModal({ show: true, message });
    const handleToggleDetails = (cardId) => {
        setExpandedCardId((prevId) => (prevId === cardId ? null : cardId));
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const fetchGatherings = useCallback(async () => {
        if (!user?.university) return;
        setIsLoading(true);
        try {
            const myGatheringsRes = await apiClient.get("/gatherings", {
                params: { type: "myMeetings" },
            });
            setMyGatherings(myGatheringsRes.data);

            if (meetingType !== "myMeetings") {
                const allGatheringsRes = await apiClient.get("/gatherings", {
                    params: { type: meetingType },
                });
                setGatherings(allGatheringsRes.data);
            }
        } catch (error) {
            console.error("모임 목록 로딩 오류:", error);
            showAlert("모임 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [user, meetingType]);

    useEffect(() => {
        if (!authLoading && user) {
            const newSocket = io("http://localhost:3000/gatherings", {
                query: { userId: user.id },
            });
            setSocket(newSocket);

            newSocket.on("updateGathering", (updatedGathering) => {
                setMyGatherings((prev) =>
                    prev
                        .map((g) =>
                            g.id === updatedGathering.id ? updatedGathering : g
                        )
                        .filter(
                            (g) =>
                                g.status === "deleted_by_admin" ||
                                new Date(g.datetime) > new Date()
                        )
                );
                setGatherings((prev) =>
                    prev.map((g) =>
                        g.id === updatedGathering.id ? updatedGathering : g
                    )
                );
                if (selectedMeeting?.id === updatedGathering.id) {
                    setSelectedMeeting(updatedGathering);
                }
            });

            const handleRemoved = (data) => {
                showAlert(
                    data.title
                        ? `'${data.title}' 모임에서 강퇴당했습니다.`
                        : "모임에서 나갔습니다."
                );
                fetchGatherings();
            };
            newSocket.on("kicked", handleRemoved);
            newSocket.on("leftMeeting", handleRemoved);

            return () => {
                newSocket.off("updateGathering");
                newSocket.off("kicked");
                newSocket.off("leftMeeting");
                newSocket.disconnect();
            };
        }
    }, [user, authLoading, selectedMeeting, fetchGatherings]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchGatherings();
        }
    }, [authLoading, user, fetchGatherings]);

    useEffect(() => {
        let tempMeetings = [...gatherings];
        if (meetingType === "meeting" && activeTag !== "전체") {
            tempMeetings = tempMeetings.filter((m) =>
                m.tags?.includes(activeTag)
            );
        }
        if (searchQuery.trim() !== "") {
            tempMeetings = tempMeetings.filter((m) =>
                m.title
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        }
        setCurrentPage(1);
        setFilteredGatherings(tempMeetings);
    }, [gatherings, activeTag, meetingType, searchQuery]);

    useEffect(() => {
        if (meetingType === "myMeetings") {
            const meetingToSelect =
                myGatherings.find((m) => m.id === openChatId) ||
                myGatherings[0] ||
                null;
            setSelectedMeeting(meetingToSelect);
        } else {
            setSelectedMeeting(null);
        }
    }, [meetingType, myGatherings, openChatId]);

    const handleCreateGathering = async (gatheringData) => {
        try {
            await apiClient.post("/gatherings", gatheringData);
            setShowCreateModal(false);
            setShowCarpoolModal(false);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
            fetchGatherings();
        } catch (error) {
            console.error("모임 생성 오류:", error);
            showAlert(
                error.response?.data?.message ||
                    "모임 생성 중 오류가 발생했습니다."
            );
        }
    };

    const handleJoinLeave = async (gathering, isParticipant) => {
        if (!user) return;
        const endpoint = isParticipant
            ? `/gatherings/${gathering.id}/leave`
            : `/gatherings/${gathering.id}/join`;
        try {
            await apiClient.post(endpoint);
            fetchGatherings();
        } catch (error) {
            console.error(
                `모임 ${isParticipant ? "나가기" : "참여"} 오류:`,
                error
            );
            showAlert(
                error.response?.data?.message ||
                    "작업 중 오류가 발생했습니다."
            );
        }
    };

    const handleDelete = (gatheringId) => {
        setGatheringToDelete(gatheringId);
    };

    const executeDelete = async () => {
        if (!gatheringToDelete) return;
        try {
            await apiClient.delete(`/gatherings/${gatheringToDelete}`);
            fetchGatherings();
            if (selectedMeeting?.id === gatheringToDelete) {
                setSelectedMeeting(null);
            }
        } catch (error) {
            console.error("모임 삭제 오류:", error);
            showAlert("모임 삭제 중 오류가 발생했습니다.");
        } finally {
            setGatheringToDelete(null);
        }
    };

    const handleKickUser = (targetUser) => {
        if (!socket || !selectedMeeting || !user) return;
        socket.emit("kickUser", {
            gatheringId: selectedMeeting.id,
            targetUserId: targetUser.id,
            creatorId: user.id,
        });
    };

    const handleAcknowledgeKick = async (gatheringId) => {
        try {
            await apiClient.post(`/gatherings/${gatheringId}/acknowledge-kick`);
            fetchGatherings();
        } catch (error) {
            console.error("강퇴 확인 처리 오류:", error);
            showAlert("오류가 발생했습니다. 페이지를 새로고침해주세요.");
        }
    };

    const handleAcknowledgeDelete = async (gatheringId) => {
        try {
            await apiClient.post(`/gatherings/${gatheringId}/leave`);
            fetchGatherings();
        } catch (error) {
            console.error("삭제 확인 처리 오류:", error);
            fetchGatherings();
        }
    };

    const calculateTimeRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = new Date(deadline);
        const diff = deadlineDate - now;
        if (diff <= 0) return <span className="text-red-600">모집 마감</span>;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (diff / (1000 * 60 * 60)) % 24
        );
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        if (days > 0) return `${days}일 ${hours}시간 뒤 마감`;
        if (hours > 0) return `${hours}시간 ${minutes}분 뒤 마감`;
        if (minutes > 0) return `${minutes}분 뒤 마감`;
        return <span className="text-orange-500">마감 임박</span>;
    };

    const isInMeeting = myGatherings.some(
        (m) => m.type === "meeting" && !m.kickedUserIds.includes(user?.id)
    );
    const isInCarpool = myGatherings.some(
        (m) => m.type === "carpool" && !m.kickedUserIds.includes(user?.id)
    );
    const isAdmin =
        user?.role === "sub_admin" || user?.role === "super_admin";

    const totalPages = Math.ceil(
        filteredGatherings.length / ITEMS_PER_PAGE
    );
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentMeetings = filteredGatherings.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">
                        사용자 정보 확인 중...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="py-8 max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <div
                        ref={helpRef}
                        className="relative flex justify-center items-center gap-2"
                    >
                        <h1 className="text-4xl font-bold text-gray-800">
                            번개모임
                        </h1>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i className="fa-solid fa-circle-question fa-lg"></i>
                        </button>
                        {showHelp && (
                            <div className="absolute top-full mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                <h4 className="font-bold text-md mb-2 text-gray-800">
                                    번개모임 사용 유의사항
                                </h4>
                                <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                    <li>
                                        안전한 만남을 위해 가급적 교내 또는 공공장소에서
                                        만나세요.
                                    </li>
                                    <li>
                                        개인정보(연락처, 주소 등) 공유에 주의하세요.
                                    </li>
                                    <li>
                                        불쾌감을 주는 언행이나 행동은 삼가주세요.
                                    </li>
                                </ul>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                >
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xl text-gray-600 mt-4">
                        다양한 취미, 식사를 함께할 친구들을 찾아보세요!
                    </p>
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setMeetingType("meeting")}
                            className={`px-6 py-3 font-semibold transition ${
                                meetingType === "meeting"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            취미&약속
                        </button>
                        <button
                            onClick={() => setMeetingType("carpool")}
                            className={`px-6 py-3 font-semibold transition ${
                                meetingType === "carpool"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            택시&카풀
                        </button>
                        <button
                            onClick={() => setMeetingType("myMeetings")}
                            className={`px-6 py-3 font-semibold transition ${
                                meetingType === "myMeetings"
                                    ? "border-b-2 border-blue-500 text-blue-600"
                                    : "text-gray-500 hover:text-gray-800"
                            }`}
                        >
                            참여중인 모임
                        </button>
                    </div>
                </div>

                {meetingType === "myMeetings" ? (
                    <div
                        className="bg-white rounded-lg shadow-lg flex"
                        style={{ height: "70vh" }}
                    >
                        <aside className="w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b font-semibold text-lg">
                                채팅 목록
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {myGatherings.length > 0 ? (
                                    myGatherings.map((m) => (
                                        <div
                                            key={m.id}
                                            className={`w-full text-left p-4 hover:bg-gray-100 relative group ${
                                                selectedMeeting?.id === m.id
                                                    ? "bg-blue-50"
                                                    : ""
                                            }`}
                                        >
                                            <button
                                                onClick={() =>
                                                    setOpenChatId(m.id)
                                                }
                                                className="w-full text-left"
                                            >
                                                <h3
                                                    className={`font-semibold truncate ${
                                                        selectedMeeting?.id ===
                                                        m.id
                                                            ? "text-blue-600"
                                                            : "text-gray-800"
                                                    }`}
                                                >
                                                    {m.title}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {m.type === "carpool"
                                                        ? `${m.departure} → ${m.arrival}`
                                                        : m.location}
                                                </p>
                                            </button>
                                            {user.id !== m.creator.id &&
                                                !m.kickedUserIds.includes(
                                                    user.id
                                                ) &&
                                                m.status !==
                                                    "deleted_by_admin" && (
                                                    <button
                                                        onClick={() =>
                                                            handleJoinLeave(
                                                                m,
                                                                true
                                                            )
                                                        }
                                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                                        title="모임 나가기"
                                                    >
                                                        <i className="fa-solid fa-door-open"></i>
                                                    </button>
                                                )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">
                                        참여중인 모임이 없습니다.
                                    </div>
                                )}
                            </div>
                            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
                                <p className="mb-2">
                                    <i className="fa-solid fa-circle-info mr-1.5"></i>
                                    모임 시간 전까지 연락 수단을 확보하세요.
                                    설정한 시간이 되면 채팅방은 비활성화됩니다.
                                </p>
                                <p>
                                    <i className="fa-solid fa-database mr-1.5"></i>
                                    모든 채팅 데이터는 안정적인 서비스 제공을 위해
                                    30일간 보관 후 자동 삭제됩니다.
                                </p>
                            </div>
                        </aside>
                        <ChatView
                            user={user}
                            meeting={selectedMeeting}
                            socket={socket}
                            onKickUser={handleKickUser}
                            onLeaveMeeting={() =>
                                handleJoinLeave(selectedMeeting, true)
                            }
                            onAcknowledgeKick={handleAcknowledgeKick}
                            onAcknowledgeDelete={handleAcknowledgeDelete}
                        />
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <button
                                onClick={() =>
                                    meetingType === "meeting"
                                        ? setShowCreateModal(true)
                                        : setShowCarpoolModal(true)
                                }
                                disabled={
                                    (meetingType === "meeting" &&
                                        isInMeeting) ||
                                    (meetingType === "carpool" &&
                                        isInCarpool)
                                }
                                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                    meetingType === "meeting" && isInMeeting
                                        ? "이미 참여 중인 '취미&약속' 모임이 있습니다."
                                        : meetingType === "carpool" &&
                                          isInCarpool
                                        ? "이미 참여 중인 '택시&카풀'이 있습니다."
                                        : "새 모임 만들기"
                                }
                            >
                                {meetingType === "meeting"
                                    ? "모임 만들기"
                                    : "택시/카풀 구하기"}
                            </button>
                        </div>
                        {meetingType === "meeting" && (
                            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-gray-800 mr-2">
                                        태그:
                                    </span>
                                    {[
                                        "전체",
                                        "점심",
                                        "술",
                                        "취미",
                                        "스터디",
                                        "운동",
                                        "게임",
                                    ].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() =>
                                                setActiveTag(tag)
                                            }
                                            className={`px-3 py-1.5 text-sm rounded-full font-semibold transition ${
                                                activeTag === tag
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mb-8">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="제목으로 검색해보세요"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                />
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <i className="fa-solid fa-search text-gray-400"></i>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoading ? (
                                <div className="col-span-full text-center py-8">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-500">
                                        모임을 불러오는 중...
                                    </p>
                                </div>
                            ) : filteredGatherings.length > 0 ? (
                                currentMeetings.map((m) => {
                                    const isParticipant = myGatherings.some(
                                        (myM) => myM.id === m.id
                                    );
                                    const isCreator = user
                                        ? m.creator.id === user.id
                                        : false;
                                    const isFull =
                                        m.participantCount >=
                                        m.maxParticipants;
                                    return (
                                        <div
                                            key={m.id}
                                            className="bg-white rounded-lg shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                        >
                                            <div className="p-4 border-b">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {m.tags?.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-mono text-gray-500 shrink-0">
                                                        {calculateTimeRemaining(
                                                            m.datetime
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2">
                                                    {m.title}
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                                                    {m.type === "carpool" ? (
                                                        <>
                                                            <div>
                                                                <i className="fa-solid fa-clock w-5 mr-1 text-gray-400"></i>
                                                                <span className="font-semibold">
                                                                    {new Date(
                                                                        m.datetime
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <i className="fa-solid fa-users w-5 mr-1 text-gray-400"></i>
                                                                <span
                                                                    className={`${
                                                                        isFull
                                                                            ? "font-bold text-red-500"
                                                                            : "font-bold"
                                                                    }`}
                                                                >
                                                                    {
                                                                        m.participantCount
                                                                    }{" "}
                                                                    /{" "}
                                                                    {
                                                                        m.maxParticipants
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <i className="fa-solid fa-location-dot w-5 mr-1 text-gray-400"></i>
                                                                <span className="font-semibold">
                                                                    {
                                                                        m.departure
                                                                    }{" "}
                                                                    →{" "}
                                                                    {
                                                                        m.arrival
                                                                    }
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <i className="fa-solid fa-calendar-day w-5 mr-1 text-gray-400"></i>
                                                                <span className="font-semibold">
                                                                    {new Date(
                                                                        m.datetime
                                                                    ).toLocaleDateString(
                                                                        "ko-KR",
                                                                        {
                                                                            month: "short",
                                                                            day: "numeric",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <i className="fa-solid fa-clock w-5 mr-1 text-gray-400"></i>
                                                                <span className="font-semibold">
                                                                    {new Date(
                                                                        m.datetime
                                                                    ).toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        }
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <i className="fa-solid fa-location-dot w-5 mr-1 text-gray-400"></i>
                                                                <span className="font-semibold">
                                                                    {
                                                                        m.location
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <i className="fa-solid fa-users w-5 mr-1 text-gray-400"></i>
                                                                <span
                                                                    className={`${
                                                                        isFull
                                                                            ? "font-bold text-red-500"
                                                                            : "font-bold"
                                                                    }`}
                                                                >
                                                                    {
                                                                        m.participantCount
                                                                    }{" "}
                                                                    /{" "}
                                                                    {
                                                                        m.maxParticipants
                                                                    }
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex-grow"></div>
                                                <div className="mt-auto pt-4 border-t">
                                                    {expandedCardId ===
                                                        m.id &&
                                                        (m.purpose ||
                                                            m.description) && (
                                                            <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-md animate-fadeIn">
                                                                {m.purpose && (
                                                                    <p className="font-semibold mb-1 text-gray-800">
                                                                        {
                                                                            m.purpose
                                                                        }
                                                                    </p>
                                                                )}
                                                                {m.description && (
                                                                    <p className="whitespace-pre-wrap">
                                                                        {
                                                                            m.description
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    <div className="flex justify-between items-center">
                                                        <UserDisplay
                                                            userTarget={{
                                                                id: m.creator
                                                                    .id,
                                                                nickname:
                                                                    m.creator
                                                                        .nickname,
                                                            }}
                                                            context={{
                                                                type: "meeting",
                                                                id: m.id,
                                                            }}
                                                        >
                                                            <span className="text-sm font-medium text-gray-500 cursor-pointer">
                                                                <i className="fa-regular fa-user mr-1.5"></i>
                                                                {
                                                                    m.creator
                                                                        .nickname
                                                                }
                                                            </span>
                                                        </UserDisplay>
                                                        <div className="flex items-center space-x-2">
                                                            {(m.purpose ||
                                                                m.description) && (
                                                                <button
                                                                    onClick={() =>
                                                                        handleToggleDetails(
                                                                            m.id
                                                                        )
                                                                    }
                                                                    className="text-xs font-semibold text-gray-500 hover:text-black p-1"
                                                                >
                                                                    {expandedCardId ===
                                                                    m.id
                                                                        ? "간략히"
                                                                        : "자세히"}
                                                                </button>
                                                            )}
                                                            {user &&
                                                                !isCreator && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleJoinLeave(
                                                                                m,
                                                                                isParticipant
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isFull &&
                                                                            !isParticipant
                                                                        }
                                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold text-white transition ${
                                                                            isParticipant
                                                                                ? "bg-red-500 hover:bg-red-600"
                                                                                : "bg-green-500 hover:bg-green-600"
                                                                        } ${
                                                                            isFull &&
                                                                            !isParticipant
                                                                                ? "cursor-not-allowed opacity-70"
                                                                                : ""
                                                                        }`}
                                                                    >
                                                                        {isParticipant
                                                                            ? "나가기"
                                                                            : "참여"}
                                                                    </button>
                                                                )}
                                                            {user &&
                                                                isParticipant && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setMeetingType(
                                                                                "myMeetings"
                                                                            );
                                                                            setOpenChatId(
                                                                                m.id
                                                                            );
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition"
                                                                    >
                                                                        채팅
                                                                    </button>
                                                                )}
                                                            {user &&
                                                                (isCreator ||
                                                                    isAdmin) && (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                m.id
                                                                            )
                                                                        }
                                                                        className={`px-3 py-1.5 rounded-md text-white text-xs font-bold transition ${
                                                                            isAdmin &&
                                                                            !isCreator
                                                                                ? "bg-red-600 hover:bg-red-700"
                                                                                : "bg-gray-600 hover:bg-gray-700"
                                                                        }`}
                                                                    >
                                                                        {isAdmin &&
                                                                        !isCreator
                                                                            ? "강제 삭제"
                                                                            : "삭제"}
                                                                    </button>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full text-center py-16">
                                    <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        모임이 없습니다
                                    </h3>
                                    <p className="text-gray-500">
                                        새로운 모임을 만들어보세요!
                                    </p>
                                </div>
                            )}
                        </div>

                        {filteredGatherings.length > 0 && totalPages > 1 && (
                            <div className="flex justify-center items-center mt-8 space-x-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1.5 text-sm rounded-md border ${
                                        currentPage === 1
                                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                                            : "text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    이전
                                </button>
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => {
                                        const page = index + 1;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() =>
                                                    goToPage(page)
                                                }
                                                className={`px-3 py-1.5 text-sm rounded-md border ${
                                                    currentPage === page
                                                        ? "bg-blue-500 text-white border-blue-500"
                                                        : "text-gray-700 border-gray-300 hover:bg-gray-100"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }
                                )}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={
                                        currentPage === totalPages
                                    }
                                    className={`px-3 py-1.5 text-sm rounded-md border ${
                                        currentPage === totalPages
                                            ? "text-gray-300 border-gray-200 cursor-not-allowed"
                                            : "text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    다음
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {showSuccessModal && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
                    모임이 성공적으로 생성되었습니다!
                </div>
            )}
            {user && (
                <CreateMeetingModal
                    show={showCreateModal}
                    onCreate={handleCreateGathering}
                    onClose={() => setShowCreateModal(false)}
                    user={user}
                />
            )}
            {user && (
                <CreateCarpoolModal
                    show={showCarpoolModal}
                    onCreate={handleCreateGathering}
                    onClose={() => setShowCarpoolModal(false)}
                    user={user}
                />
            )}
            {gatheringToDelete && (
                <ConfirmModal
                    message="정말로 이 모임을 삭제하시겠습니까?"
                    onConfirm={executeDelete}
                    onCancel={() => setGatheringToDelete(null)}
                />
            )}
            {alertModal.show && (
                <AlertModal
                    message={alertModal.message}
                    onClose={() =>
                        setAlertModal({ show: false, message: "" })
                    }
                />
            )}
        </div>
    );
}
