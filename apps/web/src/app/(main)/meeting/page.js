"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, functions } from "../../../firebase";
import { httpsCallable } from "firebase/functions";
import { useChat } from "../../context/ChatProvider";
import { useAuth } from "../../context/AuthProvider";
import {
    collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, Timestamp
} from "firebase/firestore";
import '../../styles/style.css'; 
import UserDisplay from '../../components/UserDisplay';

const ChatContextMenu = ({ x, y, targetUser, onKick, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-[100]"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div 
                className="absolute bg-white rounded-md shadow-lg py-2 w-32"
                style={{ top: y, left: x }}
            >
                <button 
                    onClick={() => { onKick(targetUser); onClose(); }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                    강퇴하기
                </button>
            </div>
        </div>
    );
};

const ChatView = ({ user, meeting, nickname, onMeetingEnd }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null });
    const [timeRemaining, setTimeRemaining] = useState("");
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!meeting?.datetime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const deadline = meeting.datetime.toDate();
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
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [meeting]);


    useEffect(() => {
        if (!meeting?.id || !user?.uid) {
            setMessages([]);
            return;
        };

        const joinTimestamp = meeting.participantInfo?.[user.uid]?.joinedAt;
        let q = query(collection(db, `meetings/${meeting.id}/messages`), orderBy("createdAt", "asc"));

        if (joinTimestamp) {
            q = query(q, where("createdAt", ">=", joinTimestamp));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            setMessages(msgs);
        }, (error) => {
            if (error.code === 'permission-denied') {
                return;
            }
            console.error("채팅 메시지 구독 오류:", error);
        });

        return () => unsubscribe();
    }, [meeting, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !nickname || isExpired || !user) return;
        await addDoc(collection(db, `meetings/${meeting.id}/messages`), {
            text: newMessage,
            senderId: user.uid,
            senderNickname: nickname,
            createdAt: serverTimestamp(),
        });
        setNewMessage("");
    };

    const handleKickUser = async (targetUser) => {
        if (!user || user.uid !== meeting.creatorId || user.uid === targetUser.id) return;
        
        try {
            const kickUserFunction = httpsCallable(functions, 'kickUserFromMeeting');
            await kickUserFunction({ meetingId: meeting.id, targetUserId: targetUser.id });

            const messageData = {
                recipientId: targetUser.id,
                recipientNickname: targetUser.nickname,
                recipientDisplayName: targetUser.nickname,
                senderId: user.uid, 
                senderNickname: '캠퍼스잇 시스템',
                senderDisplayName: '캠퍼스잇 시스템',
                isSystemMessage: true, 
                content: `'${meeting.title}' 모임에서 강퇴당하셨습니다.`,
                createdAt: serverTimestamp(),
                isRead: false,
                deletedBySender: false,
                deletedByRecipient: false,
            };
            await addDoc(collection(db, 'messages'), messageData);

        } catch (error) {
            console.error("강퇴 처리 및 쪽지 발송 오류:", error);
            alert(`사용자를 강퇴하는 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const openChatContextMenu = (e, senderId, senderNickname) => {
        e.preventDefault();
        if (user?.uid === meeting.creatorId && user?.uid !== senderId) {
            setContextMenu({ show: true, x: e.clientX, y: e.clientY, targetUser: { id: senderId, nickname: senderNickname } });
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";
        return timestamp.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    if (!meeting) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-100 h-full rounded-r-lg">
                <p className="text-gray-500">왼쪽에서 참여중인 모임을 선택하세요.</p>
            </div>
        );
    }
    
    return (
        <div className="flex-1 flex flex-col h-full bg-white rounded-r-lg border-l border-gray-200 relative">
            {isExpired && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-20 text-white text-center p-4">
                    <h3 className="text-2xl font-bold mb-4">모임이 종료되었습니다.</h3>
                    <p className="mb-6">이 채팅방은 더 이상 활성화되지 않습니다.</p>
                    <button 
                        onClick={onMeetingEnd}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition"
                    >
                        목록으로 돌아가기
                    </button>
                </div>
            )}
            <header className="p-4 bg-white text-gray-800 font-bold border-b flex justify-between items-center flex-shrink-0">
                <div className="flex flex-col">
                    <span className="truncate font-semibold text-base">{meeting.title}</span>
                    <span className="text-xs font-mono text-red-500 font-normal">{timeRemaining} 남음</span>
                </div>
                <span className="text-sm text-gray-500 font-normal">{meeting.participantCount} / {meeting.maxParticipants}명</span>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== user?.uid && msg.senderId !== 'system' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                        )}
                        <div className={`flex flex-col w-full ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}>
                            {msg.senderId !== user?.uid && msg.senderId !== 'system' && (
                                <span className="text-xs text-gray-600 mb-1 cursor-pointer" onContextMenu={(e) => openChatContextMenu(e, msg.senderId, msg.senderNickname)}>
                                    {msg.senderNickname}
                                </span>
                            )}
                            {msg.senderId === 'system' ? (
                                <div className="text-center w-full my-2">
                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{msg.text}</span>
                                </div>
                            ) : (
                                <div className="flex items-end gap-2">
                                    {msg.senderId === user?.uid && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                    <p className={`px-4 py-2 rounded-lg max-w-xs break-words ${msg.senderId === user?.uid ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                        {msg.text}
                                    </p>
                                    {msg.senderId !== user?.uid && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t flex bg-white rounded-br-lg">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 border-gray-300 rounded-l-lg p-2 focus:ring-blue-500 focus:border-blue-500" disabled={isExpired}/>
                <button type="submit" className="bg-blue-500 text-white px-4 rounded-r-lg font-semibold" disabled={isExpired}>전송</button>
            </form>
            {contextMenu.show && <ChatContextMenu {...contextMenu} onKick={handleKickUser} onClose={() => setContextMenu({ show: false })} />}
        </div>
    );
};

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Enter') onClose(); };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    return (<div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]"><div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm"><p className="text-lg mb-6">{message}</p><button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full">확인</button></div></div>);
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (<div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]"><p className="text-lg font-medium text-gray-800 mb-8">{message}</p><div className="flex justify-center gap-4"><button onClick={onCancel} className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2">취소</button><button onClick={onConfirm} className="bg-red-500 text-white px-8 py-2 rounded-lg hover:bg-red-600 transition w-1/2">삭제</button></div></div></div>);
};

const CreateMeetingModal = ({ user, university, nickname, show, onClose }) => {
    const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [maxParticipants, setMaxParticipants] = useState(4); const [location, setLocation] = useState(""); const [purpose, setPurpose] = useState(""); const [description, setDescription] = useState(""); const [tags, setTags] = useState([]);
    useEffect(() => { if (show) { const today = new Date(); const year = today.getFullYear(); const month = String(today.getMonth() + 1).padStart(2, '0'); const day = String(today.getDate()).padStart(2, '0'); const todayString = `${year}-${month}-${day}`; const defaultDateTime = new Date(); defaultDateTime.setMinutes(defaultDateTime.getMinutes() + 10); const defaultTime = defaultDateTime.toTimeString().slice(0, 5); setTitle(""); setDate(todayString); setTime(defaultTime); setMaxParticipants(4); setLocation(""); setPurpose(""); setDescription(""); setTags([]); } }, [show]);
    const handleTagToggle = (tag) => { setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]); };
    const handleSubmit = async (e) => { e.preventDefault(); if (!user || !title || !date || !time || !location) { alert("필수 항목(*)을 모두 입력해주세요."); return; } const meetingDateTime = Timestamp.fromDate(new Date(`${date}T${time}`)); if (meetingDateTime.toDate() < new Date()) { alert("현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다."); return; } try { await addDoc(collection(db, "meetings"), { title, datetime: meetingDateTime, maxParticipants: Number(maxParticipants), location, purpose, description, tags, type: 'meeting', university, status: 'active', creatorId: user.uid, creatorNickname: nickname, participantIds: [user.uid], participantCount: 1, participantInfo: { [user.uid]: { joinedAt: serverTimestamp() } }, kickedUserIds: [], createdAt: serverTimestamp(), }); onClose(true); } catch (error) { console.error("모임 생성 오류:", error); alert("모임 생성 중 오류가 발생했습니다."); } };
    if (!show) return null;
    return ( <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><form onSubmit={handleSubmit} className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"><div className="flex justify-between items-center p-5 border-b flex-shrink-0"><h3 className="text-xl font-semibold text-gray-800">새 모임 만들기</h3><button type="button" onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"><i className="fas fa-times"></i></button></div><div className="p-6 space-y-6 overflow-y-auto"><div><label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="모임 제목을 입력하세요" /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">날짜 <span className="text-red-500">*</span></label><input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">시간 <span className="text-red-500">*</span></label><input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">최대 인원 <span className="text-red-500">*</span></label><input type="number" min={2} max={20} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">장소 <span className="text-red-500">*</span></label><input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="만날 장소를 입력하세요" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">목적</label><input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="모임의 목적을 간단히 설명해주세요 (예: 같이 저녁 먹기)" /></div><div><label className="block text-sm font-medium text-gray-700 mb-2">태그</label><div className="flex flex-wrap gap-2">{["점심", "술", "취미", "스터디", "운동", "게임"].map(tag => (<button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={`px-4 py-2 text-sm rounded-full font-semibold transition-colors ${tags.includes(tag) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{tag}</button>))}</div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="모임에 대한 자세한 설명을 적어주세요. (오픈채팅방 링크 등)"></textarea></div></div><div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-lg flex-shrink-0"><button type="button" onClick={() => onClose(false)} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition mr-3">취소</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">모임 만들기</button></div></form></div>);
};

const CreateCarpoolModal = ({ user, university, nickname, show, onClose }) => {
    const [title, setTitle] = useState(""); const [time, setTime] = useState(""); const [maxParticipants, setMaxParticipants] = useState(4); const [departure, setDeparture] = useState(""); const [arrival, setArrival] = useState(""); const [description, setDescription] = useState("");
    useEffect(() => { if (show) { const today = new Date(); today.setMinutes(today.getMinutes() + 10); const defaultTime = today.toTimeString().slice(0, 5); setTitle(""); setTime(defaultTime); setMaxParticipants(4); setDeparture(""); setArrival(""); setDescription(""); } }, [show]);
    const handleSubmit = async (e) => { e.preventDefault(); const today = new Date(); const [hour, minute] = time.split(':'); today.setHours(hour, minute, 0, 0); if (!user || !title || !time || !departure || !arrival) { alert("필수 항목(*)을 모두 입력해주세요."); return; } if (today < new Date()) { alert("현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다."); return; } const meetingDateTime = Timestamp.fromDate(today); try { await addDoc(collection(db, "meetings"), { title, datetime: meetingDateTime, maxParticipants: Number(maxParticipants), departure, arrival, description, tags: ["카풀/택시"], type: 'carpool', university, status: 'active', creatorId: user.uid, creatorNickname: nickname, participantIds: [user.uid], participantCount: 1, participantInfo: { [user.uid]: { joinedAt: serverTimestamp() } }, kickedUserIds: [], createdAt: serverTimestamp(), }); onClose(true); } catch (error) { console.error("카풀 모임 생성 오류:", error); alert("모임 생성 중 오류가 발생했습니다."); } };
    if (!show) return null;
    return ( <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><form onSubmit={handleSubmit} className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]"><div className="flex justify-between items-center p-5 border-b flex-shrink-0"><h3 className="text-xl font-semibold text-gray-800">택시/카풀 동승자 구하기</h3><button type="button" onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"><i className="fas fa-times"></i></button></div><div className="p-6 space-y-6 overflow-y-auto"><div><label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="예: 천안역 갈 사람 2명 구해요" /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">출발 시간 (오늘) <span className="text-red-500">*</span></label><input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">최대 인원 (본인 포함) <span className="text-red-500">*</span></label><input type="number" min={2} max={10} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" /></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">출발지 <span className="text-red-500">*</span></label><input type="text" value={departure} onChange={e => setDeparture(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="예: 백석대학교 정문" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">도착지 <span className="text-red-500">*</span></label><input type="text" value={arrival} onChange={e => setArrival(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="예: 천안역" /></div></div><div><label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="탑승 관련 추가 정보를 입력해주세요."></textarea></div></div><div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-lg flex-shrink-0"><button type="button" onClick={() => onClose(false)} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition mr-3">취소</button><button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">동승자 구하기</button></div></form></div>);
};

export default function MeetingPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [nickname, setNickname] = useState("");
    const [university, setUniversity] = useState("");
    const { activeMeetings, openChatId, setOpenChatId, isInMeeting, isInCarpool } = useChat();
    const [meetings, setMeetings] = useState([]);
    const [filteredMeetings, setFilteredMeetings] = useState([]);
    const [activeTag, setActiveTag] = useState("전체");
    const [isLoading, setIsLoading] = useState(true);
    const [meetingType, setMeetingType] = useState('meeting');
    const [searchQuery, setSearchQuery] = useState(""); 
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCarpoolModal, setShowCarpoolModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);
    const [alertModal, setAlertModal] = useState({ show: false, message: "" });
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    const showAlert = (message) => setAlertModal({ show: true, message });
    const handleToggleDetails = (cardId) => { setExpandedCardId(prevId => (prevId === cardId ? null : cardId)); };

    useEffect(() => {
        function handleClickOutside(event) { if (helpRef.current && !helpRef.current.contains(event.target)) { setShowHelp(false); } }
        if (showHelp) { document.addEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [showHelp]);

    useEffect(() => {
        if (user) {
            setNickname(user.nickname || "");
            setUniversity(user.university || "");
        } else if (!user) {
            router.push("/login");
        }
    }, [user, router]);

    useEffect(() => {
        if (!university || meetingType === 'myMeetings') {
            setIsLoading(false);
            setMeetings([]);
            return;
        };
        setIsLoading(true);
        const q = query(collection(db, "meetings"), where("university", "==", university), where("type", "==", meetingType), orderBy("datetime", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const meetingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMeetings(meetingsData);
            setIsLoading(false);
        }, (error) => {
            console.error("데이터 로딩 오류:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [university, meetingType]);
    
    useEffect(() => {
        let tempMeetings = [...meetings];
        tempMeetings = tempMeetings.filter(m => m.status === 'active' && m.datetime?.toDate() > new Date());
        if (meetingType === 'meeting' && activeTag !== "전체") {
            tempMeetings = tempMeetings.filter(m => m.tags?.includes(activeTag));
        }
        if (searchQuery.trim() !== "") {
            tempMeetings = tempMeetings.filter(m => m.title?.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        setFilteredMeetings(tempMeetings);
    }, [meetings, activeTag, meetingType, searchQuery]); 
    
    useEffect(() => {
        if (meetingType === 'myMeetings') {
            const meetingToSelect = activeMeetings.find(m => m.id === openChatId) || activeMeetings[0] || null;
            setSelectedMeeting(meetingToSelect);
        } else {
            setSelectedMeeting(null);
        }
    }, [meetingType, activeMeetings, openChatId]);
    
    const handleCreateModalClose = (isSuccess) => {
        setShowCreateModal(false); setShowCarpoolModal(false);
        if (isSuccess) { setShowSuccessModal(true); setTimeout(() => setShowSuccessModal(false), 2000); }
    };

    const handleJoinLeave = async (meeting, isParticipant) => {
        if (!user) return;
        if (!isParticipant) {
            if (meeting.type === 'meeting' && isInMeeting) { showAlert("이미 다른 '취미&약속' 모임에 참여 중입니다."); return; }
            if (meeting.type === 'carpool' && isInCarpool) { showAlert("이미 다른 '택시&카풀'에 참여 중입니다."); return; }
        }
        
        const functionName = isParticipant ? 'leaveMeeting' : 'joinMeeting';
        try {
            const actionFunction = httpsCallable(functions, functionName);
            await actionFunction({ meetingId: meeting.id });
        } catch (error) {
            console.error(`${functionName} 오류:`, error);
            showAlert(error.message || "작업 중 오류가 발생했습니다.");
        }
    };
    
    const handleDelete = (meetingId) => { setMeetingToDelete(meetingId); };
    const executeDelete = async () => {
        if (!meetingToDelete) return;
        try { 
            const deleteMeetingFunction = httpsCallable(functions, 'deleteMeeting');
            await deleteMeetingFunction({ meetingId: meetingToDelete });
        } catch (error) { 
            console.error("모임 삭제 오류:", error); 
            alert("모임 삭제 중 오류가 발생했습니다."); 
        } finally { 
            setMeetingToDelete(null); 
        }
    };
    
    const calculateTimeRemaining = (deadline) => {
        if (!deadline) return null;
        const now = new Date();
        const deadlineDate = deadline.toDate();
        const diff = deadlineDate - now;
        if (diff <= 0) return <span className="text-red-600">모집 마감</span>;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        if (days > 0) return `${days}일 ${hours}시간 뒤 마감`;
        if (hours > 0) return `${hours}시간 ${minutes}분 뒤 마감`;
        if (minutes > 0) return `${minutes}분 뒤 마감`;
        return <span className="text-orange-500">마감 임박</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="py-8 max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <div ref={helpRef} className="relative flex justify-center items-center gap-2">
                        <h1 className="text-4xl font-bold text-gray-800">번개모임</h1>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-circle-question fa-lg"></i></button>
                        {showHelp && (
                            <div className="absolute top-full mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                <h4 className="font-bold text-md mb-2 text-gray-800"> 번개모임 사용 유의사항</h4>
                                <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                    <li>안전한 만남을 위해 가급적 교내 또는 공공장소에서 만나세요.</li>
                                    <li>개인정보(연락처, 주소 등) 공유에 주의하세요.</li>
                                    <li>불쾌감을 주는 언행이나 행동은 삼가주세요.</li>
                                </ul>
                                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
                            </div>
                        )}
                    </div>
                    <p className="text-xl text-gray-600 mt-4">다양한 취미, 식사를 함께할 친구들을 찾아보세요!</p>
                    <div className="mt-8 flex justify-center">
                        <button onClick={() => setMeetingType('meeting')} className={`px-6 py-3 font-semibold transition ${meetingType === 'meeting' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>취미&약속</button>
                        <button onClick={() => setMeetingType('carpool')} className={`px-6 py-3 font-semibold transition ${meetingType === 'carpool' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>택시&카풀</button>
                        <button onClick={() => setMeetingType('myMeetings')} className={`px-6 py-3 font-semibold transition ${meetingType === 'myMeetings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>참여중인 모임</button>
                    </div>
                </div>

                {meetingType === 'myMeetings' ? (
                    <div className="bg-white rounded-lg shadow-lg flex" style={{height: '70vh'}}>
                        <aside className="w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b font-semibold text-lg">채팅 목록</div>
                            <div className="overflow-y-auto flex-1">
                                {activeMeetings.length > 0 ? (
                                    activeMeetings.map(m => (
                                        <button key={m.id} onClick={() => setOpenChatId(m.id)} className={`w-full text-left p-4 hover:bg-gray-100 ${selectedMeeting?.id === m.id ? 'bg-blue-50' : ''}`}>
                                            <h3 className={`font-semibold truncate ${selectedMeeting?.id === m.id ? 'text-blue-600' : 'text-gray-800'}`}>{m.title}</h3>
                                            <p className="text-xs text-gray-500">{m.type === 'carpool' ? `${m.departure} → ${m.arrival}` : m.location}</p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">참여중인 모임이 없습니다.</div>
                                )}
                            </div>
                        </aside>
                        <ChatView user={user} meeting={selectedMeeting} nickname={nickname} onMeetingEnd={() => setMeetingType('meeting')} />
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <button onClick={() => meetingType === 'meeting' ? setShowCreateModal(true) : setShowCarpoolModal(true)} disabled={!user || (meetingType === 'meeting' && isInMeeting) || (meetingType === 'carpool' && isInCarpool)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" title={!user ? "로그인이 필요합니다." : (meetingType === 'meeting' && isInMeeting) ? "이미 참여 중인 '취미&약속' 모임이 있습니다." : (meetingType === 'carpool' && isInCarpool) ? "이미 참여 중인 '택시&카풀'이 있습니다." : "" }>
                                {meetingType === 'meeting' ? '모임 만들기' : '택시/카풀 구하기'}
                            </button>
                        </div>
                        {meetingType === 'meeting' && (
                            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-gray-800 mr-2">태그:</span>
                                    {["전체", "점심", "술", "취미", "스터디", "운동", "게임"].map(tag => (
                                        <button key={tag} onClick={() => setActiveTag(tag)} className={`category-filter-btn ${activeTag === tag ? 'active' : ''}`}>{tag}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mb-8">
                            <div className="relative"><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="제목으로 검색해보세요" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><i className="fa-solid fa-search text-gray-400"></i></div></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoading ? <div className="col-span-full text-center py-8"><div className="loading mx-auto mb-4"></div><p className="text-gray-500">모임을 불러오는 중...</p></div>
                             : filteredMeetings.length > 0 ? (
                                filteredMeetings.map(m => {
                                    const isParticipant = user ? m.participantIds.includes(user.uid) : false;
                                    const isCreator = user ? m.creatorId === user.uid : false;
                                    const isFull = m.participantCount >= m.maxParticipants; 
                                    const status = m.status !== 'active' || m.datetime.toDate() < new Date() ? '종료' : '모집중'; 
                                    const isKicked = user ? m.kickedUserIds?.includes(user.uid) : false;
                                    
                                    return (
                                        <div key={m.id} className="bg-white rounded-lg shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                            <div className="p-4 border-b"><div className="flex justify-between items-center"><div className="flex items-center gap-1.5 flex-wrap">{m.tags?.map(tag => (<span key={tag} className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{tag}</span>))}</div><span className="text-xs font-mono text-gray-500 shrink-0">{calculateTimeRemaining(m.datetime)}</span></div></div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h3 className="text-xl font-bold text-gray-800 mb-4 line-clamp-2">{m.title}</h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-4">
                                                    {m.type === 'carpool' ? (<><div><i className="fa-solid fa-clock w-5 mr-1 text-gray-400"></i><span className="font-semibold">{m.datetime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div><i className="fa-solid fa-users w-5 mr-1 text-gray-400"></i><span className={`${isFull ? 'font-bold text-red-500' : 'font-bold'}`}>{m.participantCount} / {m.maxParticipants}</span></div><div className="col-span-2"><i className="fa-solid fa-location-dot w-5 mr-1 text-gray-400"></i><span className="font-semibold">{m.departure} → {m.arrival}</span></div></>) 
                                                    : (<><div><i className="fa-solid fa-calendar-day w-5 mr-1 text-gray-400"></i><span className="font-semibold">{m.datetime.toDate().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span></div><div><i className="fa-solid fa-clock w-5 mr-1 text-gray-400"></i><span className="font-semibold">{m.datetime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div><div className="col-span-2"><i className="fa-solid fa-location-dot w-5 mr-1 text-gray-400"></i><span className="font-semibold">{m.location}</span></div><div><i className="fa-solid fa-users w-5 mr-1 text-gray-400"></i><span className={`${isFull ? 'font-bold text-red-500' : 'font-bold'}`}>{m.participantCount} / {m.maxParticipants}</span></div></>)}
                                                </div>
                                                <div className="flex-grow"></div>
                                                <div className="mt-auto pt-4 border-t">
                                                    {expandedCardId === m.id && (m.purpose || m.description) && (<div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-md animate-fadeIn">{m.purpose && <p className="font-semibold mb-1 text-gray-800">{m.purpose}</p>}{m.description && <p className="whitespace-pre-wrap">{m.description}</p>}</div>)}
                                                    <div className="flex justify-between items-center">
                                                        <UserDisplay userTarget={{ id: m.creatorId, nickname: m.creatorNickname }} context={{ type: 'meeting', id: m.id }} ><span className="text-sm font-medium text-gray-500 cursor-pointer"><i className="fa-regular fa-user mr-1.5"></i>{m.creatorNickname}</span></UserDisplay>
                                                        <div className="flex items-center space-x-2">
                                                            {(m.purpose || m.description) && (<button onClick={() => handleToggleDetails(m.id)} className="text-xs font-semibold text-gray-500 hover:text-black p-1">{expandedCardId === m.id ? '간략히' : '자세히'}</button>)}
                                                            {user && status === '모집중' && !isCreator && <button onClick={() => handleJoinLeave(m, isParticipant)} disabled={(isFull && !isParticipant) || isKicked} className={`px-3 py-1.5 rounded-md text-xs font-bold text-white transition ${ isKicked ? 'bg-gray-400' : isParticipant ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600' } ${ (isFull && !isParticipant) || isKicked ? 'cursor-not-allowed opacity-70' : ''}`}>{isParticipant ? '나가기' : '참여'}</button>}
                                                            {user && isParticipant && <button onClick={() => { setMeetingType('myMeetings'); setOpenChatId(m.id); }} className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition">채팅</button>}
                                                            {user && isCreator && <button onClick={() => handleDelete(m.id)} className="px-3 py-1.5 rounded-md bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold transition">삭제</button>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                               ) : <div className="col-span-full text-center py-16"><i className="fas fa-users text-6xl text-gray-300 mb-4"></i><h3 className="text-xl font-semibold text-gray-600 mb-2">모임이 없습니다</h3><p className="text-gray-500">새로운 모임을 만들어보세요!</p></div>
                            }
                        </div>
                    </>
                )}
            </main>

            {showSuccessModal && (<div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">모임이 성공적으로 생성되었습니다!</div>)}
            {user && <CreateMeetingModal show={showCreateModal} onClose={handleCreateModalClose} user={user} university={university} nickname={nickname} />}
            {user && <CreateCarpoolModal show={showCarpoolModal} onClose={handleCreateModalClose} user={user} university={university} nickname={nickname} />}
            {meetingToDelete && (<ConfirmModal message="정말로 이 모임을 삭제하시겠습니까?" onConfirm={executeDelete} onCancel={() => setMeetingToDelete(null)} />)}
            {alertModal.show && (<AlertModal  message={alertModal.message} onClose={() => setAlertModal({ show: false, message: ""})} />)}
        </div>
    );
}