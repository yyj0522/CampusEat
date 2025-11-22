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

const ChatView = ({ user, trade, socket, onKickUser, onLeaveTrade, onCompleteTrade, onCancelTrade, onBack }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null });

    const isCreator = trade && user && trade.creator.id === user.id;

    useEffect(() => {
        if (!socket || !trade?.id) {
            setMessages([]);
            return;
        };

        apiClient.get(`/trades/${trade.id}/messages`)
            .then(response => setMessages(response.data))
            .catch(error => console.error(error));

        socket.emit('joinRoom', trade.id);
        const handleNewMessage = (message) => setMessages(prev => [...prev, message]);
        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
            socket.emit('leaveRoom', trade.id);
        };
    }, [socket, trade]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !user || !socket) return;
        socket.emit('sendMessage', { tradeId: trade.id, text: newMessage, senderId: user.id });
        setNewMessage("");
    };

    const openChatContextMenu = (e, sender) => {
        e.preventDefault();
        if (isCreator && user?.id !== sender.id) {
            setContextMenu({ show: true, x: e.clientX, y: e.clientY, targetUser: sender });
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    if (!trade) return <div className="flex-1 flex items-center justify-center bg-gray-50 h-full text-gray-400">거래를 선택해주세요</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-white md:rounded-r-3xl border-l border-gray-100 relative overflow-hidden">
            <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/90 backdrop-blur z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden text-gray-500 hover:text-black"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                    <div>
                        <h3 className="font-bold text-gray-900 truncate max-w-[150px] sm:max-w-[200px]">{trade.title}</h3>
                        <span className="text-xs text-gray-500">{trade.participantCount} / {trade.maxParticipants}명 참여중</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isCreator ? (
                        <>
                            <button onClick={() => onCompleteTrade(trade)} className="text-white bg-green-500 hover:bg-green-600 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm">
                                거래 완료
                            </button>
                            <button onClick={() => onCancelTrade(trade)} className="text-white bg-red-500 hover:bg-red-600 text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm">
                                거래 취소
                            </button>
                        </>
                    ) : (
                        <button onClick={() => onLeaveTrade(trade)} className="text-gray-400 hover:text-red-500 transition p-2">
                            <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
                        </button>
                    )}
                </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                {messages.map(msg => (
                    msg.isSystemMessage ? (
                        <div key={msg.id} className="text-center w-full my-4">
                            <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </div>
                    ) : (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender?.id !== user?.id && <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>}
                            <div className={`flex flex-col max-w-[70%] ${msg.sender?.id === user?.id ? 'items-end' : 'items-start'}`}>
                                {msg.sender?.id !== user?.id && (
                                    <span className="text-xs text-gray-500 ml-1 mb-1 cursor-pointer hover:text-black" onContextMenu={(e) => openChatContextMenu(e, msg.sender)}>
                                        {msg.sender.nickname}
                                    </span>
                                )}
                                <div className={`flex items-end gap-1.5 ${msg.sender?.id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`px-4 py-2 rounded-2xl text-sm ${msg.sender?.id === user?.id ? 'bg-black text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>{msg.text}</div>
                                    <span className="text-[10px] text-gray-400 mb-1 min-w-fit">{formatTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="메시지 입력..." className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5 text-sm focus:ring-1 focus:ring-gray-200 transition-all" />
                <button type="submit" className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition"><i className="fa-solid fa-paper-plane text-sm"></i></button>
            </form>
            {contextMenu.show && <ChatContextMenu {...contextMenu} onKick={onKickUser} onClose={() => setContextMenu({ show: false })} />}
        </div>
    );
};

const AlertModal = ({ message, onClose }) => {
    useEffect(() => { const h = (e) => { if (e.key === 'Enter') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-center w-full max-w-sm transform transition-all scale-100">
                <p className="text-gray-800 font-medium mb-6">{message}</p>
                <button onClick={onClose} className="bg-black text-white px-6 py-2.5 rounded-full w-full text-sm font-medium hover:bg-gray-800 transition">확인</button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel, confirmText = "삭제" }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 text-center w-full max-w-sm">
                <p className="text-gray-800 font-medium mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-full text-sm font-medium hover:bg-gray-200 transition">취소</button>
                    <button onClick={onConfirm} className={`flex-1 text-white py-2.5 rounded-full text-sm font-medium transition ${confirmText === "삭제" || confirmText === "거래 취소" ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const CreateTradeModal = ({ user, onCreate, show, onClose }) => {
    const [title, setTitle] = useState("");
    const [books, setBooks] = useState([{ bookTitle: '', courseName: '', originalPrice: '', sellingPrice: '' }]);
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const bookItemTemplate = { bookTitle: '', courseName: '', originalPrice: '', sellingPrice: '' };

    useEffect(() => {
        if (show) {
            setTitle("");
            setBooks([{ ...bookItemTemplate }]);
            setDescription("");
            setImageFile(null);
            setImagePreview(null);
            setIsUploading(false);
        }
    }, [show]);

    const handleBookChange = (index, field, value) => {
        const newBooks = [...books];
        newBooks[index][field] = value;
        setBooks(newBooks);
    };

    const addBookField = () => {
        setBooks([...books, { ...bookItemTemplate }]);
    };

    const removeBookField = (index) => {
        if (books.length <= 1) return;
        setBooks(books.filter((_, i) => i !== index));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasEmptyBookField = books.some(b => !b.bookTitle || !b.originalPrice || !b.sellingPrice);
        if (!user || !title || hasEmptyBookField || !imageFile) {
            alert("필수 항목(*)을 모두 입력해주세요.");
            return;
        }
        setIsUploading(true);
        try {
            const imageFormData = new FormData();
            imageFormData.append("file", imageFile);
            const uploadResponse = await apiClient.post("/uploads", imageFormData, { headers: { "Content-Type": "multipart/form-data" }, });
            const imageUrl = uploadResponse.data.imageUrl;
            if (!imageUrl) throw new Error("이미지 업로드 실패");
            const tradeData = {
                title,
                description,
                imageUrl,
                books: books.map(b => ({
                    bookTitle: b.bookTitle,
                    courseName: b.courseName,
                    originalPrice: Number(b.originalPrice),
                    sellingPrice: Number(b.sellingPrice),
                })),
            };
            onCreate(tradeData);
        } catch (error) {
            console.error(error);
            alert("오류 발생: " + (error.response?.data?.message || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
                    <h3 className="text-xl font-bold text-gray-900">교재 판매하기</h3>
                    <button type="button" onClick={() => onClose(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"><i className="fas fa-times text-gray-500"></i></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto bg-white">
                    <div>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-black transition" placeholder="판매글 제목 (예: 1학년 전공책 일괄 판매)" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-bold text-gray-700 mb-2">교재 사진</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} required className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition" />
                        {imagePreview && <div className="mt-3"><img src={imagePreview} alt="미리보기" className="w-full max-h-48 object-contain rounded-lg border border-gray-200" /></div>}
                    </div>
                    <div className="space-y-4">
                        {books.map((book, index) => (
                            <div key={index} className="p-4 border border-gray-100 rounded-2xl relative bg-white shadow-sm">
                                {books.length > 1 && (
                                    <button type="button" onClick={() => removeBookField(index)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition p-1"><i className="fas fa-times"></i></button>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <input type="text" value={book.bookTitle} onChange={e => handleBookChange(index, 'bookTitle', e.target.value)} required className="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black" placeholder={`교재명 #${index + 1}`} />
                                    <input type="text" value={book.courseName} onChange={e => handleBookChange(index, 'courseName', e.target.value)} className="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black" placeholder="강의명 (선택)" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" step="500" min={0} value={book.originalPrice} onChange={e => handleBookChange(index, 'originalPrice', e.target.value)} required className="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black" placeholder="원가" />
                                    <input type="number" step="500" min={0} value={book.sellingPrice} onChange={e => handleBookChange(index, 'sellingPrice', e.target.value)} required className="bg-gray-50 border-0 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-black" placeholder="판매가" />
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addBookField} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-gray-400 hover:text-gray-600 transition">+ 교재 추가</button>
                    </div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black resize-none" placeholder="상세 설명 (상태, 필기감 등)"></textarea>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button type="button" onClick={() => onClose(false)} className="px-6 py-2.5 rounded-full text-gray-500 font-medium hover:bg-gray-100 transition text-sm">취소</button>
                    <button type="submit" disabled={isUploading} className="px-6 py-2.5 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm shadow-lg shadow-black/20 disabled:bg-gray-400">
                        {isUploading ? "업로드 중..." : "등록하기"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default function BookPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [allTrades, setAllTrades] = useState([]);
    const [filteredTrades, setFilteredTrades] = useState([]);
    const [myTrades, setMyTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tradeType, setTradeType] = useState('all');
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [tradeToComplete, setTradeToComplete] = useState(null);
    const [tradeToCancel, setTradeToCancel] = useState(null);
    const [alertModal, setAlertModal] = useState({ show: false, message: "" });
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [openChatId, setOpenChatId] = useState(null);
    const [socket, setSocket] = useState(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const showAlert = (message) => setAlertModal({ show: true, message });
    const handleToggleDetails = (cardId) => { setExpandedCardId(prevId => (prevId === cardId ? null : cardId)); };

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

    const fetchTrades = useCallback(async () => {
        if (!user?.university) return;
        setIsLoading(true);
        try {
            const [myTradesRes, allTradesRes] = await Promise.all([
                apiClient.get('/trades/my'),
                apiClient.get('/trades', { params: { search: searchQuery } })
            ]);
            setMyTrades(myTradesRes.data);
            setAllTrades(allTradesRes.data);
        } catch (error) {
            console.error(error);
            showAlert("목록 로딩 실패");
        } finally {
            setIsLoading(false);
        }
    }, [user, searchQuery]);

    useEffect(() => {
        if (!authLoading && user) {
            const newSocket = io('https://api.campuseat.shop/trades', { query: { userId: user.id } });
            setSocket(newSocket);
            newSocket.on('updateTrade', (updatedTrade) => {
                setAllTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
                const isParticipant = updatedTrade.participants && updatedTrade.participants.some(p => (p.user && p.user.id === user.id) || p.userId === user.id);
                const isCreator = updatedTrade.creator && updatedTrade.creator.id === user.id;
                setMyTrades(prev => {
                    const exists = prev.some(t => t.id === updatedTrade.id);
                    if (exists) {
                        if (!isParticipant && !isCreator) return prev.filter(t => t.id !== updatedTrade.id);
                        return prev.map(t => t.id === updatedTrade.id ? updatedTrade : t);
                    } else {
                        if (isParticipant || isCreator) return [updatedTrade, ...prev];
                    }
                    return prev;
                });
                if (selectedTrade?.id === updatedTrade.id) setSelectedTrade(updatedTrade);
            });
            newSocket.on('tradeCompleted', ({ tradeId }) => {
                setAllTrades(prev => prev.filter(t => t.id !== tradeId));
                setMyTrades(prev => prev.filter(t => t.id !== tradeId));
                if (selectedTrade?.id === tradeId) setSelectedTrade(null);
            });
            const handleRemoved = (data) => { showAlert(data.title ? `'${data.title}' 강퇴됨` : '나감'); fetchTrades(); };
            newSocket.on('kicked', handleRemoved);
            newSocket.on('leftTrade', handleRemoved);
            return () => { newSocket.disconnect(); };
        }
    }, [user, authLoading, selectedTrade, fetchTrades]);

    useEffect(() => { if (!authLoading && user) fetchTrades(); }, [authLoading, user, fetchTrades]);
    useEffect(() => { setFilteredTrades(allTrades); }, [allTrades]);
    useEffect(() => {
        if (tradeType === 'myTrades') {
            const tradeToSelect = myTrades.find(m => m.id === openChatId) || null;
            setSelectedTrade(tradeToSelect);
        } else {
            setSelectedTrade(null);
        }
    }, [tradeType, myTrades, openChatId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [tradeType, searchQuery]);

    const handleCreateTrade = async (tradeData) => {
        try {
            await apiClient.post("/trades", tradeData);
            setShowCreateModal(false);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
            setTradeType('all');
            fetchTrades();
        } catch (error) {
            showAlert(error.response?.data?.message || "오류 발생");
        }
    };

    const handleJoinLeave = async (trade, isParticipant) => {
        if (!user) return;
        const endpoint = isParticipant ? `/trades/${trade.id}/leave` : `/trades/${trade.id}/join`;
        try {
            await apiClient.post(endpoint);
            if (isParticipant) {
                setMyTrades(prev => prev.filter(t => t.id !== trade.id));
                if (selectedTrade?.id === trade.id) setSelectedTrade(null);
            }
        } catch (error) {
            showAlert(error.response?.data?.message || "오류 발생");
        }
    };

    const handleComplete = (trade) => { setTradeToComplete(trade); };
    const handleCancel = (trade) => { setTradeToCancel(trade); };
    const executeComplete = async () => { if (!tradeToComplete) return; try { await apiClient.post(`/trades/${tradeToComplete.id}/complete`); showAlert('거래 완료'); } catch (e) { showAlert("오류"); } finally { setTradeToComplete(null); } };
    const executeCancel = async () => { if (!tradeToCancel) return; try { await apiClient.post(`/trades/${tradeToCancel.id}/complete`); showAlert('거래 취소됨'); } catch (e) { showAlert("오류"); } finally { setTradeToCancel(null); } };
    const handleKickUser = (targetUser) => { if (!socket || !selectedTrade || !user) return; socket.emit('kickUser', { tradeId: selectedTrade.id, targetUserId: targetUser.id, creatorId: user.id }); };
    const calculateDiscount = (original, selling) => { if (!original || original === 0) return 0; return Math.round(((original - selling) / original) * 100); };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTrades = filteredTrades.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (authLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div></div>;

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
                <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg relative">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl font-extrabold">중고교재 거래</h1>
                        <div ref={helpRef} className="relative">
                            <button onClick={() => setShowHelp(!showHelp)} className="text-white/70 hover:text-white transition-colors">
                                <i className="fa-solid fa-circle-question fa-lg"></i>
                            </button>
                            {showHelp && (
                                <>
                                    <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setShowHelp(false)} />
                                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 text-left z-50 animate-fadeIn md:absolute md:top-full md:left-0 md:translate-x-0 md:translate-y-0 md:mt-3 md:w-80 md:shadow-xl text-gray-800">
                                        <h4 className="font-bold text-md mb-2 text-gray-800">중고거래 이용 수칙</h4>
                                        <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                            <li>거래 시 직거래를 우선으로 하며, 사기 피해 예방에 주의해주세요.</li>
                                            <li>도서 상태(필기, 파손 등)를 정확하게 기재해야 합니다.</li>
                                            <li>부적절한 언행이나 사기 의심 시 계정이 제재될 수 있습니다.</li>
                                            <li>거래 완료 후에는 '거래 완료' 버튼을 눌러주세요.</li>
                                        </ul>
                                        <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <p className="text-lg opacity-90">더 이상 보지 않는 전공책, 교양서적을 후배들과 학우들에게 합리적인 가격으로 판매/구매해보세요.</p>
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center relative mb-8 gap-4">
                    <div className="inline-flex bg-gray-100 p-1.5 rounded-full z-10 justify-center">
                        {[{ id: 'all', label: '교재 거래' }, { id: 'myTrades', label: '진행중인 거래' }].map(t => (
                            <button key={t.id} onClick={() => setTradeType(t.id)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${tradeType === t.id ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>{t.label}</button>
                        ))}
                    </div>

                    {tradeType === 'all' && (
                        <div className="w-full md:w-auto md:absolute md:right-0 flex items-center gap-3 justify-end">
                            <div className={`flex items-center bg-white transition-all duration-300 origin-right ${isSearchOpen ? "w-full md:w-60 opacity-100 border-b border-black" : "w-0 opacity-0 overflow-hidden"}`}>
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색..." className="w-full py-1 px-2 focus:outline-none text-sm" />
                            </div>
                            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-gray-400 hover:text-black transition p-2"><i className="fa-solid fa-magnifying-glass text-lg"></i></button>
                        </div>
                    )}
                </div>

                {tradeType === 'myTrades' ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row overflow-hidden h-[80vh] md:h-[75vh]">
                        <aside className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-100 bg-white flex flex-col ${selectedTrade ? 'hidden md:flex' : 'flex'} h-[60vh] md:h-auto`}>
                            <div className="p-6 border-b border-gray-50"><h2 className="font-bold text-xl">내 채팅</h2></div>
                            <div className="overflow-y-auto flex-1 p-3 space-y-2">
                                {myTrades.length > 0 ? myTrades.map((t) => (
                                    <div key={t.id} className={`group relative p-4 rounded-2xl cursor-pointer transition-all ${selectedTrade?.id === t.id ? "bg-black text-white" : "hover:bg-gray-50 text-gray-800"}`} onClick={() => setOpenChatId(t.id)}>
                                        <h3 className="font-bold truncate pr-6">{t.title}</h3>
                                        <p className={`text-xs mt-1 truncate ${selectedTrade?.id === t.id ? "text-gray-400" : "text-gray-500"}`}>{t.books?.[0]?.bookTitle}</p>
                                        {user.id !== t.creator.id && (
                                            <button onClick={(e) => { e.stopPropagation(); handleJoinLeave(t, true); }} className={`absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition text-xs ${selectedTrade?.id === t.id ? "text-gray-300 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}><i className="fa-solid fa-arrow-right-from-bracket"></i></button>
                                        )}
                                    </div>
                                )) : <div className="p-6 text-center text-gray-400 text-sm">참여중인 거래가 없습니다</div>}
                            </div>
                        </aside>
                        <div className={`flex-1 h-[80vh] md:h-auto ${selectedTrade ? 'flex' : 'hidden md:flex'}`}>
                            {selectedTrade ? (
                                <ChatView user={user} trade={selectedTrade} socket={socket} onKickUser={handleKickUser} onLeaveTrade={() => handleJoinLeave(selectedTrade, true)} onCompleteTrade={handleComplete} onCancelTrade={handleCancel} onBack={() => setOpenChatId(null)} />
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50">채팅방을 선택해주세요</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-[2rem] aspect-[3/4] animate-pulse"></div>) : currentTrades.length > 0 ? (
                                currentTrades.map(t => {
                                    const isParticipant = myTrades.some(myT => myT.id === t.id);
                                    const isCreator = user ? t.creator.id === user.id : false;
                                    const isTrading = t.status === 'trading';
                                    const firstBook = t.books?.[0];
                                    const discount = firstBook ? calculateDiscount(firstBook.originalPrice, firstBook.sellingPrice) : 0;

                                    if (!firstBook) return null;

                                    return (
                                        <div key={t.id} className="group relative bg-white rounded-[2rem] flex flex-col h-full overflow-hidden hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-2xl border border-gray-100">
                                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                                <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                {isTrading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold px-4 py-1 border-2 border-white rounded-full">거래중</span></div>}
                                                {discount > 0 && <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discount}%</span>}
                                            </div>
                                            <div className="p-6 flex flex-col flex-grow justify-between">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{t.title}</h3>
                                                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">{firstBook.bookTitle} {t.books.length > 1 && `외 ${t.books.length - 1}권`}</p>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-lg font-black text-blue-600">{firstBook.sellingPrice.toLocaleString()}원</span>
                                                        {firstBook.originalPrice > firstBook.sellingPrice && <span className="text-xs text-gray-400 line-through">{firstBook.originalPrice.toLocaleString()}원</span>}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end border-t border-gray-50 pt-4 mt-4">
                                                    <UserDisplay userTarget={{ id: t.creator.id, nickname: t.creator.nickname }} context={{ type: 'trade', id: t.id }}>
                                                        <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition">
                                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400">{t.creator.nickname[0]}</div>
                                                            <span className="text-xs font-bold text-gray-900">{t.creator.nickname}</span>
                                                        </div>
                                                    </UserDisplay>
                                                </div>
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 border-t border-gray-100">
                                                    {user && isCreator && <button onClick={() => { setTradeType('myTrades'); setOpenChatId(t.id); }} className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-bold transition hover:bg-gray-800">관리/채팅</button>}
                                                    {user && isParticipant && !isCreator && (
                                                        <>
                                                            <button onClick={(e) => { e.stopPropagation(); handleJoinLeave(t, true); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-xl text-xs font-bold transition">나가기</button>
                                                            <button onClick={() => { setTradeType('myTrades'); setOpenChatId(t.id); }} className="flex-1 bg-black hover:bg-gray-800 text-white py-3 rounded-xl text-xs font-bold transition">채팅</button>
                                                        </>
                                                    )}
                                                    {user && !isCreator && !isParticipant && !isTrading && (
                                                        <button onClick={() => handleJoinLeave(t, false)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold transition">구매 채팅 참여</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : <div className="col-span-full py-24 text-center text-gray-300"><i className="fa-regular fa-folder-open text-5xl mb-4 block"></i><span className="font-bold">등록된 거래가 없습니다</span></div>}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition"
                                >
                                    <i className="fa-solid fa-chevron-left text-xs"></i>
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                    <button
                                        key={number}
                                        onClick={() => handlePageChange(number)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition ${currentPage === number ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-white transition"
                                >
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {tradeType === 'all' && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button 
                        onClick={() => setShowCreateModal(true)} 
                        className="relative bg-black text-white shadow-xl px-6 py-4 rounded-full hover:bg-gray-800 transition flex items-center gap-2"
                    >
                        <i className="fas fa-pen"></i>
                        <span className="font-bold">판매글 작성하기</span>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </button>
                </div>
            )}

            {showSuccessModal && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-4 rounded-full shadow-2xl z-50 animate-bounce text-sm font-bold">완료되었습니다!</div>}
            {user && <CreateTradeModal show={showCreateModal} onCreate={handleCreateTrade} onClose={() => setShowCreateModal(false)} user={user} />}
            {tradeToComplete && <ConfirmModal message="거래를 완료하시겠습니까?" onConfirm={executeComplete} onCancel={() => setTradeToComplete(null)} confirmText="완료" />}
            {tradeToCancel && <ConfirmModal message="거래를 취소하시겠습니까?" onConfirm={executeCancel} onCancel={() => setTradeToCancel(null)} confirmText="취소" />}
            {alertModal.show && <AlertModal message={alertModal.message} onClose={() => setAlertModal({ show: false, message: "" })} />}
        </div>
    );
}