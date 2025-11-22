"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "../../../lib/api";
import io from 'socket.io-client';
import UserDisplay from '../../components/UserDisplay';

const ChatContextMenu = ({ x, y, targetUser, onKick, onClose }) => {
    if (!targetUser) return null;
    return (
        <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div className="absolute bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-32 overflow-hidden" style={{ top: y, left: x }}>
                <button onClick={() => { onKick(targetUser); onClose(); }} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors">
                    강퇴하기
                </button>
            </div>
        </div>
    );
};

const ChatView = ({ user, meeting, socket, onKickUser, onLeaveMeeting, onAcknowledgeKick, onAcknowledgeDelete, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [timeRemaining, setTimeRemaining] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null });

    useEffect(() => {
        if (!meeting?.datetime) return;
        const interval = setInterval(() => {
            const diff = new Date(meeting.datetime) - new Date();
            if (diff <= 0) { setTimeRemaining("종료됨"); setIsExpired(true); clearInterval(interval); return; }
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setTimeRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [meeting]);

    const isKicked = meeting && user && meeting.kickedUserIds.includes(user.id);
    const isDeletedByAdmin = meeting && meeting.status === "deleted_by_admin";

    useEffect(() => {
        if (!socket || !meeting?.id || isKicked || isDeletedByAdmin) { setMessages([]); return; }
        apiClient.get(`/gatherings/${meeting.id}/messages`).then((res) => setMessages(res.data)).catch((e) => console.error(e));
        socket.emit("joinRoom", meeting.id);
        const handleMsg = (msg) => setMessages((prev) => [...prev, msg]);
        socket.on("newMessage", handleMsg);
        return () => { socket.off("newMessage", handleMsg); socket.emit("leaveRoom", meeting.id); };
    }, [socket, meeting, isKicked, isDeletedByAdmin]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !user || isExpired || !socket) return;
        socket.emit("sendMessage", { gatheringId: meeting.id, text: newMessage, senderId: user.id });
        setNewMessage("");
    };

    const openChatContextMenu = (e, sender) => {
        e.preventDefault();
        if (user?.id === meeting.creator.id && user?.id !== sender.id) {
            setContextMenu({ show: true, x: e.clientX, y: e.clientY, targetUser: sender });
        }
    };

    const formatTime = (iso) => iso ? new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true }) : "";

    if (!meeting) return <div className="flex-1 flex items-center justify-center bg-gray-50 h-full rounded-r-2xl text-gray-400">모임을 선택해주세요</div>;
    if (isDeletedByAdmin) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full rounded-r-2xl p-6 text-center relative">
            <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-gray-500 hover:text-black"><i className="fa-solid fa-arrow-left text-xl"></i></button>
            <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-800">삭제된 모임</h3>
            <button onClick={() => onAcknowledgeDelete(meeting.id)} className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-full text-sm">목록에서 제거</button>
        </div>
    );
    if (isKicked) return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full rounded-r-2xl p-6 text-center relative">
            <button onClick={onBack} className="absolute top-4 left-4 md:hidden text-gray-500 hover:text-black"><i className="fa-solid fa-arrow-left text-xl"></i></button>
            <i className="fa-solid fa-user-slash text-4xl text-red-400 mb-4"></i>
            <h3 className="text-lg font-bold text-gray-800">강퇴되었습니다</h3>
            <button onClick={() => onAcknowledgeKick(meeting.id)} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full text-sm">확인</button>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-white md:rounded-r-2xl border-l border-gray-100 relative overflow-hidden">
            {isExpired && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center"><h3 className="text-xl font-bold text-gray-800">모임 종료</h3></div>}
            <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden text-gray-500 hover:text-black"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                    <div><h3 className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{meeting.title}</h3><span className="text-xs text-blue-500 font-medium">{timeRemaining}</span></div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">{meeting.participantCount}/{meeting.maxParticipants}</span>
                    {user.id !== meeting.creator.id && <button onClick={() => onLeaveMeeting(meeting)} className="text-gray-400 hover:text-red-500"><i className="fa-solid fa-arrow-right-from-bracket"></i></button>}
                </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                {messages.map((msg) => msg.isSystemMessage ? (
                    <div key={msg.id} className="text-center my-4"><span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} /></div>
                ) : (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender?.id === user?.id ? "justify-end" : "justify-start"}`}>
                        {msg.sender?.id !== user?.id && <div className="w-8 h-8 bg-gray-200 rounded-full" />}
                        <div className={`flex flex-col max-w-[70%] ${msg.sender?.id === user?.id ? "items-end" : "items-start"}`}>
                            {msg.sender?.id !== user?.id && <span className="text-xs text-gray-500 ml-1 mb-1 cursor-pointer" onContextMenu={(e) => openChatContextMenu(e, msg.sender)}>{msg.sender.nickname}</span>}
                            <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender?.id === user?.id ? "bg-black text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>{msg.text}</div>
                            <span className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.createdAt)}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-gray-300" placeholder="메시지 입력..." disabled={isExpired} />
                <button type="submit" className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition disabled:opacity-50" disabled={isExpired}><i className="fa-solid fa-paper-plane text-xs"></i></button>
            </form>
            {contextMenu.show && <ChatContextMenu {...contextMenu} onKick={onKickUser} onClose={() => setContextMenu({ show: false, x: 0, y: 0, targetUser: null })} />}
        </div>
    );
};

const AlertModal = ({ message, onClose }) => {
    useEffect(() => { const h = (e) => e.key === "Enter" && onClose(); window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center"><p className="text-gray-800 mb-6 font-medium">{message}</p><button onClick={onClose} className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm">확인</button></div></div>;
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center">
            <p className="text-gray-800 mb-6 font-medium">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm">취소</button>
                <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm">삭제</button>
            </div>
        </div>
    </div>
);

const CreateMeetingModal = ({ user, onCreate, show, onClose }) => {
    const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(4); const [location, setLocation] = useState("");
    const [purpose, setPurpose] = useState(""); const [description, setDescription] = useState(""); const [tags, setTags] = useState([]);
    useEffect(() => {
        if (show) {
            const n = new Date(); n.setMinutes(n.getMinutes() + 10); const t = new Date();
            setTitle(""); setDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
            setTime(n.toTimeString().slice(0, 5)); setMaxParticipants(4); setLocation(""); setPurpose(""); setDescription(""); setTags([]);
        }
    }, [show]);
    const handleTag = (t) => setTags(p => p.includes(t) ? p.filter(i => i !== t) : [...p, t]);
    const handleSubmit = (e) => {
        e.preventDefault(); const dt = new Date(`${date}T${time}`); if (dt < new Date()) return alert("과거 시간 불가");
        onCreate({ title, datetime: dt.toISOString(), maxParticipants: Number(maxParticipants), location, purpose, description, tags, type: "meeting" });
    };
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-xl">모임 개설</h3><button type="button" onClick={() => onClose(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-50 border-0 rounded-xl p-3 font-medium focus:ring-2 focus:ring-black" placeholder="제목" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" />
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" min={2} max={20} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" placeholder="인원" />
                        <input value={location} onChange={e => setLocation(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" placeholder="장소" />
                    </div>
                    <div className="flex flex-wrap gap-2">{["점심", "술", "취미", "스터디", "운동", "게임"].map(t => <button key={t} type="button" onClick={() => handleTag(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${tags.includes(t) ? "bg-black text-white" : "bg-gray-100 text-gray-500"}`}>{t}</button>)}</div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm resize-none" placeholder="내용..." />
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={() => onClose(false)} className="px-5 py-2.5 rounded-xl text-gray-500 text-sm font-bold">취소</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg">만들기</button>
                </div>
            </form>
        </div>
    );
};

const CreateCarpoolModal = ({ user, onCreate, show, onClose }) => {
    const [title, setTitle] = useState(""); const [time, setTime] = useState(""); const [maxParticipants, setMaxParticipants] = useState(4);
    const [departure, setDeparture] = useState(""); const [arrival, setArrival] = useState(""); const [description, setDescription] = useState("");
    useEffect(() => { if (show) { const n = new Date(); n.setMinutes(n.getMinutes() + 10); setTitle(""); setTime(n.toTimeString().slice(0, 5)); setMaxParticipants(4); setDeparture(""); setArrival(""); setDescription(""); } }, [show]);
    const handleSubmit = (e) => {
        e.preventDefault(); const t = new Date(); const [h, m] = time.split(":"); t.setHours(h, m, 0, 0); if (t < new Date()) return alert("과거 시간 불가");
        onCreate({ title, datetime: t.toISOString(), maxParticipants: Number(maxParticipants), departure, arrival, description, tags: ["카풀/택시"], type: "carpool", location: `${departure} → ${arrival}` });
    };
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-xl">카풀 모집</h3><button type="button" onClick={() => onClose(false)} className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center"><i className="fas fa-times"></i></button></div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-50 border-0 rounded-xl p-3 font-medium focus:ring-2 focus:ring-black" placeholder="제목" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" />
                        <input type="number" min={2} max={10} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" placeholder="인원" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <input value={departure} onChange={e => setDeparture(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" placeholder="출발" />
                        <input value={arrival} onChange={e => setArrival(e.target.value)} required className="bg-gray-50 border-0 rounded-xl p-3 text-sm" placeholder="도착" />
                    </div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full bg-gray-50 border-0 rounded-xl p-3 text-sm resize-none" placeholder="내용..." />
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button type="button" onClick={() => onClose(false)} className="px-5 py-2.5 rounded-xl text-gray-500 text-sm font-bold">취소</button>
                    <button type="submit" className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-lg">모집하기</button>
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
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCarpoolModal, setShowCarpoolModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [gatheringToDelete, setGatheringToDelete] = useState(null);
    const [alertModal, setAlertModal] = useState({ show: false, message: "" });
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [openChatId, setOpenChatId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);
    const ITEMS_PER_PAGE = 10;

    const showAlert = (message) => setAlertModal({ show: true, message });

    useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        }
        if (showHelp) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showHelp]);

    const fetchGatherings = useCallback(async () => {
        if (!user?.university) return;
        setIsLoading(true);
        try {
            const myRes = await apiClient.get("/gatherings", { params: { type: "myMeetings" } });
            setMyGatherings(myRes.data);
            if (meetingType !== "myMeetings") {
                const allRes = await apiClient.get("/gatherings", { params: { type: meetingType } });
                setGatherings(allRes.data);
            }
        } catch (e) { console.error(e); showAlert("데이터 로드 실패"); } finally { setIsLoading(false); }
    }, [user, meetingType]);

    useEffect(() => {
        if (!authLoading && user) {
            const s = io("http://158.180.68.205:3000/gatherings", { query: { userId: user.id } });
            setSocket(s);
            s.on("updateGathering", (u) => {
                setMyGatherings(p => p.map(g => g.id === u.id ? u : g).filter(g => g.status === "deleted_by_admin" || new Date(g.datetime) > new Date()));
                setGatherings(p => p.map(g => g.id === u.id ? u : g));
                if (selectedMeeting?.id === u.id) setSelectedMeeting(u);
            });
            const handleRemoved = (d) => { showAlert(d.title ? `'${d.title}' 강퇴됨` : "나감"); fetchGatherings(); };
            s.on("kicked", handleRemoved); s.on("leftMeeting", handleRemoved);
            return () => { s.disconnect(); };
        }
    }, [user, authLoading, selectedMeeting, fetchGatherings]);

    useEffect(() => { if (!authLoading && user) fetchGatherings(); }, [authLoading, user, fetchGatherings]);

    useEffect(() => {
        let temp = [...gatherings];
        if (meetingType === "meeting" && activeTag !== "전체") temp = temp.filter((m) => m.tags?.includes(activeTag));
        if (searchQuery.trim()) temp = temp.filter((m) => m.title?.toLowerCase().includes(searchQuery.toLowerCase()));
        setCurrentPage(1); setFilteredGatherings(temp);
    }, [gatherings, activeTag, meetingType, searchQuery]);

    useEffect(() => {
        if (meetingType === "myMeetings") setSelectedMeeting(myGatherings.find((m) => m.id === openChatId) || null);
        else setSelectedMeeting(null);
    }, [meetingType, myGatherings, openChatId]);

    const handleCreateGathering = async (data) => {
        try { await apiClient.post("/gatherings", data); setShowCreateModal(false); setShowCarpoolModal(false); setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); fetchGatherings(); }
        catch (e) { showAlert(e.response?.data?.message || "오류"); }
    };
    const handleJoinLeave = async (g, isPart) => {
        try { await apiClient.post(`/gatherings/${g.id}/${isPart ? 'leave' : 'join'}`); fetchGatherings(); }
        catch (e) { showAlert("실패"); }
    };
    const handleDelete = (gatheringId) => {
        setGatheringToDelete(gatheringId);
    };
    const executeDelete = async () => {
        if (!gatheringToDelete) return;
        try { await apiClient.delete(`/gatherings/${gatheringToDelete}`); fetchGatherings(); if (selectedMeeting?.id === gatheringToDelete) setSelectedMeeting(null); }
        catch (e) { showAlert("삭제 실패"); } finally { setGatheringToDelete(null); }
    };
    const handleKickUser = (t) => socket?.emit("kickUser", { gatheringId: selectedMeeting.id, targetUserId: t.id, creatorId: user.id });
    const handleAcknowledgeKick = async (gid) => { try { await apiClient.post(`/gatherings/${gid}/acknowledge-kick`); fetchGatherings(); } catch { } };
    const handleAcknowledgeDelete = async (gid) => { try { await apiClient.post(`/gatherings/${gid}/leave`); fetchGatherings(); } catch { fetchGatherings(); } };

    const isInMeeting = myGatherings.some((m) => m.type === "meeting" && !m.kickedUserIds.includes(user?.id));
    const isInCarpool = myGatherings.some((m) => m.type === "carpool" && !m.kickedUserIds.includes(user?.id));
    const isAdmin = user?.role === "sub_admin" || user?.role === "super_admin";

    const totalPages = Math.ceil(filteredGatherings.length / ITEMS_PER_PAGE);
    const currentMeetings = filteredGatherings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

    const calculateTimeRemaining = (d) => {
        if (!d) return null;
        const diff = new Date(d) - new Date();
        if (diff <= 0) return <span className="text-red-600 font-bold">마감됨</span>;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        if (days > 0) return `마감 ${days}일 ${hours}시간 전`;
        if (hours > 0) return `마감 ${hours}시간 ${minutes}분 전`;
        if (minutes > 0) return `마감 ${minutes}분 전`;
        return <span className="text-orange-500 font-bold">마감 임박</span>;
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans relative">
             <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
            <main className="max-w-6xl mx-auto px-4 py-10 pb-24">
                <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg relative">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl font-extrabold">번개모임</h1>
                        <div ref={helpRef} className="relative">
                            <button onClick={() => setShowHelp(!showHelp)} className="text-white/70 hover:text-white transition-colors">
                                <i className="fa-solid fa-circle-question fa-lg"></i>
                            </button>
                            {showHelp && (
                                <>
                                    <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowHelp(false)} />
                                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 text-left z-50 animate-fadeIn md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-0 md:mt-3 md:w-80 md:shadow-xl text-gray-800">
                                        <h4 className="font-bold text-md mb-2 text-gray-800">번개모임 안내</h4>
                                        <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                            <li>모임 개설 시 목적을 명확히 해주세요.</li>
                                            <li>부적절한 만남 목적의 모임은 제재됩니다.</li>
                                            <li>약속 시간을 준수해주세요.</li>
                                            <li>카풀 이용 시 안전에 유의하세요.</li>
                                        </ul>
                                        <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-lg opacity-90">오늘 뭐 하지? 고민될 땐, 캠퍼시트 번개모임! 같은 학교 학우들과 다양한 취미, 카풀을 즐겨보세요.</p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="inline-flex bg-gray-100 p-1.5 rounded-full">
                        {[
                            { id: "meeting", label: "취미/약속" },
                            { id: "carpool", label: "택시/카풀" },
                            { id: "myMeetings", label: "참여중" }
                        ].map((t) => (
                            <button key={t.id} onClick={() => setMeetingType(t.id)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${meetingType === t.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>{t.label}</button>
                        ))}
                    </div>
                </div>

                {meetingType === "myMeetings" ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row overflow-hidden h-[80vh]">
                        <aside className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex-col ${selectedMeeting ? 'hidden md:flex' : 'flex'} h-full`}>
                            <div className="p-6 border-b border-gray-50"><h2 className="font-bold text-xl">내 채팅</h2></div>
                            <div className="overflow-y-auto flex-1 p-3 space-y-2">
                                {myGatherings.length > 0 ? myGatherings.map((m) => (
                                    <div key={m.id} className={`group relative p-4 rounded-2xl cursor-pointer transition-all ${selectedMeeting?.id === m.id ? "bg-black text-white" : "hover:bg-gray-50 text-gray-800"}`} onClick={() => setOpenChatId(m.id)}>
                                        <h3 className="font-bold truncate pr-6">{m.title}</h3>
                                        <p className={`text-xs mt-1 truncate ${selectedMeeting?.id === m.id ? "text-gray-400" : "text-gray-500"}`}>{m.location}</p>
                                        {user.id !== m.creator.id && !m.kickedUserIds.includes(user.id) && m.status !== "deleted_by_admin" && (
                                            <button onClick={(e) => { e.stopPropagation(); handleJoinLeave(m, true); }} className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-xs ${selectedMeeting?.id === m.id ? "text-gray-300 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`} title="나가기"><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
                                        )}
                                    </div>
                                )) : <div className="p-6 text-center text-gray-400 text-sm">참여중인 모임이 없습니다</div>}
                            </div>
                        </aside>
                        <div className={`flex-1 h-full ${selectedMeeting ? 'flex' : 'hidden md:flex'}`}>
                            {selectedMeeting ? (
                                <ChatView user={user} meeting={selectedMeeting} socket={socket} onKickUser={handleKickUser} onLeaveMeeting={() => handleJoinLeave(selectedMeeting, true)} onAcknowledgeKick={handleAcknowledgeKick} onAcknowledgeDelete={handleAcknowledgeDelete} onBack={() => setOpenChatId(null)} />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">채팅방을 선택해주세요</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between mb-8 relative px-2 gap-y-4">
                            <div className="flex-1 flex justify-start md:justify-center items-center gap-4 md:gap-8 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                {meetingType === "meeting" && ["전체", "점심", "술", "취미", "스터디", "운동", "게임"].map((tag) => (
                                    <button key={tag} onClick={() => setActiveTag(tag)} className={`text-base font-bold transition-colors duration-200 whitespace-nowrap ${activeTag === tag ? "text-black" : "text-gray-300 hover:text-gray-500"}`}>{tag}</button>
                                ))}
                                {meetingType === "carpool" && <span className="text-xl font-bold">카풀 리스트</span>}
                            </div>
                            <div className="flex items-center gap-3 ml-auto md:absolute md:right-0">
                                <div className={`flex items-center bg-white transition-all duration-300 origin-right ${isSearchOpen ? "w-40 md:w-60 opacity-100" : "w-0 opacity-0 overflow-hidden"}`}>
                                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색..." className="w-full border-b border-gray-200 py-1 px-2 focus:outline-none focus:border-black text-sm" />
                                </div>
                                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-400 hover:text-black transition p-2"><i className="fa-solid fa-magnifying-glass text-lg"></i></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {isLoading ? Array.from({length:5}).map((_,i)=><div key={i} className="bg-gray-100 rounded-[2rem] aspect-[3/4] animate-pulse"></div>) : filteredGatherings.length > 0 ? (
                                currentMeetings.map((m) => {
                                    const isParticipant = myGatherings.some((myM) => myM.id === m.id), isCreator = user ? m.creator.id === user.id : false, isFull = m.participantCount >= m.maxParticipants;
                                    return (
                                        <div key={m.id} className="group relative bg-white rounded-[2rem] flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-2xl border border-gray-100">
                                            <div className="relative aspect-[3/4] bg-white p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {m.tags?.map(t => <span key={t} className="px-2.5 py-1 bg-gray-50 rounded-md text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">{t}</span>)}
                                                        </div>
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                                            {calculateTimeRemaining(m.datetime)}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2 line-clamp-2">{m.title}</h3>
                                                    <p className="text-sm font-bold text-gray-400">{new Date(m.datetime).toLocaleDateString()} {new Date(m.datetime).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</p>
                                                </div>
                                                
                                                <div className="flex-1 py-4">
                                                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                                                        {m.description || m.purpose || "내용이 없습니다."}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                     <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                        <i className="fa-solid fa-location-dot text-gray-300"></i>
                                                        <span className="truncate">{m.type === 'carpool' ? `${m.departure} → ${m.arrival}` : m.location}</span>
                                                    </div>
                                                    <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                                        <UserDisplay userTarget={{ id: m.creator.id, nickname: m.creator.nickname }} context={{ type: "meeting", id: m.id }}>
                                                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{m.creator.nickname[0]}</div>
                                                                <span className="text-xs font-bold text-gray-900">{m.creator.nickname}</span>
                                                            </div>
                                                        </UserDisplay>
                                                        <div className="text-xs font-black"><span className={isFull ? "text-red-500" : "text-black"}>{m.participantCount}</span><span className="text-gray-200 mx-1">/</span>{m.maxParticipants}</div>
                                                    </div>
                                                </div>

                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 border-t border-gray-100 z-10">
                                                    {user && !isCreator && (
                                                        <button onClick={(e) => {e.stopPropagation(); handleJoinLeave(m, isParticipant)}} disabled={isFull && !isParticipant} 
                                                            className={`flex-1 py-3 rounded-xl text-xs font-black text-white transition shadow-lg ${isParticipant ? "bg-black hover:bg-gray-800" : "bg-blue-600 hover:bg-blue-700"} ${isFull&&!isParticipant ? "opacity-50 cursor-not-allowed" : ""}`}>
                                                            {isParticipant ? "나가기" : "참여하기"}
                                                        </button>
                                                    )}
                                                    {user && isParticipant && (
                                                        <button onClick={(e) => {e.stopPropagation(); setMeetingType("myMeetings"); setOpenChatId(m.id)}} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-xl text-xs font-black transition">채팅</button>
                                                    )}
                                                    {user && (isCreator || isAdmin) && (
                                                        <button onClick={(e) => {e.stopPropagation(); handleDelete(m.id)}} className="w-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center transition"><i className="fa-solid fa-trash"></i></button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : <div className="col-span-full py-24 text-center text-gray-300"><i className="fa-regular fa-folder-open text-5xl mb-4 block"></i><span className="font-bold">등록된 모임이 없습니다</span></div>}
                        </div>

                        {filteredGatherings.length > ITEMS_PER_PAGE && (
                            <div className="flex justify-center gap-2 mt-16">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i + 1} onClick={() => goToPage(i + 1)} className={`w-10 h-10 rounded-full text-sm font-bold transition ${currentPage === i + 1 ? "bg-black text-white shadow-lg" : "hover:bg-gray-50 text-gray-500"}`}>{i + 1}</button>
                                ))}
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={() => meetingType === "meeting" ? setShowCreateModal(true) : setShowCarpoolModal(true)} disabled={(meetingType === "meeting" && isInMeeting) || (meetingType === "carpool" && isInCarpool)} 
                    className="relative bg-black text-white shadow-xl px-6 py-4 rounded-full hover:bg-gray-800 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fas fa-plus"></i>
                    <span className="font-bold">{meetingType === "meeting" ? "모임 개설하기" : "카풀 모집하기"}</span>
                    {((meetingType==="meeting"&&!isInMeeting)||(meetingType==="carpool"&&!isInCarpool)) && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                </button>
            </div>

            {showSuccessModal && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-bounce text-sm font-bold">완료되었습니다!</div>}
            {user && <CreateMeetingModal show={showCreateModal} onCreate={handleCreateGathering} onClose={() => setShowCreateModal(false)} user={user} />}
            {user && <CreateCarpoolModal show={showCarpoolModal} onCreate={handleCreateGathering} onClose={() => setShowCarpoolModal(false)} user={user} />}
            {gatheringToDelete && <ConfirmModal message="정말 삭제하시겠습니까?" onConfirm={executeDelete} onCancel={() => setGatheringToDelete(null)} />}
            {alertModal.show && <AlertModal message={alertModal.message} onClose={() => setAlertModal({ show: false, message: "" })} />}
        </div>
    );
}