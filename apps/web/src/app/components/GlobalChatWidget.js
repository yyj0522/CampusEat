"use client";

import { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatProvider';
import { useAuth } from '../context/AuthProvider';
import { db, functions } from '../../firebase';
import { httpsCallable } from "firebase/functions";
import { collection, query, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import '../styles/style.css';

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

const ChatModal = ({ meeting, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [nickname, setNickname] = useState("");
    const messagesEndRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null });

    useEffect(() => {
        const fetchNickname = async () => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) setNickname(userDoc.data().nickname);
            }
        };
        fetchNickname();
    }, [user]);
    
    useEffect(() => {
        if (!meeting?.id || !user?.uid) return;

        const joinTimestamp = meeting.participantInfo?.[user.uid]?.joinedAt;
        let q = query(collection(db, `meetings/${meeting.id}/messages`), orderBy("createdAt", "asc"));

        if (joinTimestamp) {
            q = query(q, where("createdAt", ">=", joinTimestamp));
        }

        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
                setMessages(msgs);
            },
            (error) => {
                if (error.code === 'permission-denied') {
                    onClose();
                } else {
                    console.error("채팅 메시지 구독 오류:", error);
                }
            }
        );
        return () => unsubscribe();
    }, [meeting, user, onClose]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !nickname) return;
        await addDoc(collection(db, `meetings/${meeting.id}/messages`), {
            text: newMessage,
            senderId: user.uid,
            senderNickname: nickname,
            createdAt: serverTimestamp(),
        });
        setNewMessage("");
    };
    
    const handleKickUser = async (targetUser) => {
        if (user?.uid !== meeting.creatorId || user?.uid === targetUser.id) return;
        
        try {
            const kickUserFunction = httpsCallable(functions, 'kickUserFromMeeting');
            await kickUserFunction({ 
                meetingId: meeting.id, 
                targetUserId: targetUser.id,
            });
        } catch (error) {
            console.error("강퇴 처리 오류:", error);
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

    return (
        <div className="fixed bottom-28 right-5 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50">
            <header className="p-4 bg-blue-500 text-white font-bold rounded-t-lg flex justify-between items-center">
                <span className="truncate">{meeting.title}</span>
                <button onClick={onClose} className="text-xl leading-none">&times;</button>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== user.uid && msg.senderId !== 'system' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                        )}
                        <div className={`flex flex-col w-full ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}>
                            {msg.senderId !== user.uid && msg.senderId !== 'system' && (
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
                                    {msg.senderId === user.uid && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                    <p className={`px-4 py-2 rounded-lg max-w-xs break-words ${msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                        {msg.text}
                                    </p>
                                    {msg.senderId !== user.uid && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t flex">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 border-gray-300 rounded-l-lg p-2 focus:ring-blue-500 focus:border-blue-500"/>
                <button type="submit" className="bg-blue-500 text-white px-4 rounded-r-lg font-semibold">전송</button>
            </form>
            {contextMenu.show && <ChatContextMenu {...contextMenu} onKick={handleKickUser} onClose={() => setContextMenu({ show: false })} />}
        </div>
    );
};

export default function GlobalChatWidget() {
    const { activeMeetings, openChatId, setOpenChatId } = useChat();
    if (!activeMeetings || activeMeetings.length === 0) return null;
    const openMeeting = activeMeetings.find(m => m.id === openChatId);

    return (
        <>
            <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end space-y-2">
                {activeMeetings.map(m => (
                    <button key={m.id} onClick={() => setOpenChatId(m.id)} className="w-24 h-24 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition hover:bg-blue-600">
                        <i className="fas fa-comments text-4xl"></i>
                    </button>
                ))}
            </div>
            {openMeeting && <ChatModal meeting={openMeeting} onClose={() => setOpenChatId(null)} />}
        </>
    );
}