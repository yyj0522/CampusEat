"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import io from 'socket.io-client';
import '../../styles/style.css'; 
import UserDisplay from '../../components/UserDisplay';

const ChatContextMenu = ({ x, y, targetUser, onKick, onClose }) => {
    if (!targetUser) return null;
    return (
        <div className="fixed inset-0 z-[100]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div className="absolute bg-white rounded-md shadow-lg py-2 w-32" style={{ top: y, left: x }}>
                <button onClick={() => { onKick(targetUser); onClose(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">강퇴하기</button>
            </div>
        </div>
    );
};

const ChatView = ({ user, trade, socket, onKickUser, onLeaveTrade, onCompleteTrade, onCancelTrade }) => {
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
            .catch(error => console.error("채팅 내역 로딩 오류:", error));

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

    if (!trade) {
        return <div className="flex-1 flex items-center justify-center bg-gray-100 h-full rounded-r-lg"><p className="text-gray-500">왼쪽에서 진행중인 거래를 선택하세요.</p></div>;
    }
    
    return (
        <div className="flex-1 flex flex-col h-full bg-white rounded-r-lg border-l border-gray-200 relative">
            <header className="p-4 bg-white text-gray-800 font-bold border-b flex justify-between items-center flex-shrink-0">
                <div className="flex flex-col"><span className="truncate font-semibold text-base">{trade.title}</span></div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-normal">{trade.participantCount} / {trade.maxParticipants}명</span>
                    {isCreator && (
                         <div className="flex items-center gap-2">
                             <button onClick={() => onCompleteTrade(trade)} className="text-white bg-green-500 hover:bg-green-600 text-sm font-semibold px-3 py-1.5 rounded-lg transition" title="거래 완료하기">
                                 <i className="fa-solid fa-check mr-1.5"></i>거래 완료
                             </button>
                             <button onClick={() => onCancelTrade(trade)} className="text-white bg-red-500 hover:bg-red-600 text-sm font-semibold px-3 py-1.5 rounded-lg transition" title="거래 취소하기">
                                 <i className="fa-solid fa-times mr-1.5"></i>거래 취소
                             </button>
                         </div>
                    )}
                    {!isCreator && (
                        <button onClick={() => onLeaveTrade(trade)} className="text-gray-500 hover:text-red-500 transition" title="거래 나가기">
                            <i className="fa-solid fa-door-open fa-lg"></i>
                        </button>
                    )}
                </div>
            </header>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                {messages.map(msg => (
                    msg.isSystemMessage ? (
                        <div key={msg.id} className="text-center w-full my-2">
                           <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full"
                             dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                           />
                        </div>
                    ) : (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender?.id === user?.id ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender?.id !== user?.id && <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>}
                            <div className={`flex flex-col w-full ${msg.sender?.id === user?.id ? 'items-end' : 'items-start'}`}>
                                {msg.sender?.id !== user?.id && (
                                    <span className="text-xs text-gray-600 mb-1 cursor-pointer" onContextMenu={(e) => openChatContextMenu(e, msg.sender)}>
                                        {msg.sender.nickname}
                                    </span>
                                )}
                                <div className="flex items-end gap-2">
                                    {msg.sender?.id === user?.id && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                    <p className={`px-4 py-2 rounded-lg max-w-xs break-words ${msg.sender?.id === user?.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>{msg.text}</p>
                                    {msg.sender?.id !== user?.id && <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>}
                                </div>
                            </div>
                        </div>
                    )
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t flex bg-white rounded-br-lg">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="메시지를 입력하세요..." className="flex-1 border-gray-300 rounded-l-lg p-2 focus:ring-blue-500 focus:border-blue-500"/>
                <button type="submit" className="bg-blue-500 text-white px-4 rounded-r-lg font-semibold">전송</button>
            </form>
            {contextMenu.show && <ChatContextMenu {...contextMenu} onKick={onKickUser} onClose={() => setContextMenu({ show: false })} />}
        </div>
    );
};

const AlertModal = ({ message, onClose }) => { useEffect(() => { const handleKeyDown = (event) => { if (event.key === 'Enter') onClose(); }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [onClose]); return (<div className="modal-overlay fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]"><div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm"><p className="text-lg mb-6">{message}</p><button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full">확인</button></div></div>); };
const ConfirmModal = ({ message, onConfirm, onCancel, confirmText = "삭제" }) => { return (<div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]"><p className="text-lg font-medium text-gray-800 mb-8">{message}</p><div className="flex justify-center gap-4"><button onClick={onCancel} className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition w-1/2">취소</button><button onClick={onConfirm} className={`text-white px-8 py-2 rounded-lg transition w-1/2 ${confirmText === "삭제" || confirmText === "거래 취소" ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>{confirmText}</button></div></div></div>); };

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
            const uploadResponse = await apiClient.post("/uploads", imageFormData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
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
            console.error("거래글 생성 오류:", error);
            alert("거래글 생성 중 오류가 발생했습니다: " + (error.response?.data?.message || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    if (!show) return null;
    return (
        <div className="modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-800">교재 판매하기</h3>
                    <button type="button" onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="판매글 제목 (예: 1학년 전공책 일괄 판매)" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">교재 사진 (상태) <span className="text-red-500">*</span></label>
                        <input type="file" accept="image/*" onChange={handleImageChange} required className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                    </div>
                    
                    {imagePreview && (
                        <div className="mt-2">
                            <img src={imagePreview} alt="교재 미리보기" className="w-full max-w-sm mx-auto h-auto object-contain rounded-lg shadow-md" />
                        </div>
                    )}
                    
                    <hr className="border-t border-gray-200" />
                    
                    {books.map((book, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 relative">
                            {books.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeBookField(index)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
                                    title="이 항목 삭제"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">교재 이름 {index+1} <span className="text-red-500">*</span></label>
                                    <input type="text" value={book.bookTitle} onChange={e => handleBookChange(index, 'bookTitle', e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="정확한 교재명" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">강의명 {index+1}</label>
                                    <input type="text" value={book.courseName} onChange={e => handleBookChange(index, 'courseName', e.target.value)} className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="사용된 강의명 (선택)" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">원가 {index+1} <span className="text-red-500">*</span></label>
                                    <input type="number" step="500" min={0} value={book.originalPrice} onChange={e => handleBookChange(index, 'originalPrice', e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="숫자만 입력 (예: 30000)" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">판매가 {index+1} <span className="text-red-500">*</span></label>
                                    <input type="number" step="500" min={0} value={book.sellingPrice} onChange={e => handleBookChange(index, 'sellingPrice', e.target.value)} required className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="숫자만 입력 (예: 15000)" />
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <div>
                        <button type="button" onClick={addBookField} className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition">
                            <i className="fas fa-plus mr-2"></i>교재 추가하기
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="4" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="교재 상태, 필기 여부, 거래 희망 장소 등을 적어주세요."></textarea>
                    </div>
                </div>
                <div className="flex justify-end items-center p-5 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
                    <button type="button" onClick={() => onClose(false)} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100 transition mr-3">취소</button>
                    <button type="submit" disabled={isUploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400">
                        {isUploading ? "업로드 중..." : "판매글 작성"}
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

    const showAlert = (message) => setAlertModal({ show: true, message });
    const handleToggleDetails = (cardId) => { setExpandedCardId(prevId => (prevId === cardId ? null : cardId)); };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const fetchTrades = useCallback(async () => {
        if (!user?.university) return;
        setIsLoading(true);
        try {
            // --- 변경점: myTrades와 allTrades를 항상 함께 불러옵니다. ---
            const [myTradesRes, allTradesRes] = await Promise.all([
                apiClient.get('/trades/my'),
                apiClient.get('/trades', { params: { search: searchQuery } })
            ]);
            
            setMyTrades(myTradesRes.data);
            setAllTrades(allTradesRes.data);

        } catch (error) {
            console.error("거래 목록 로딩 오류:", error);
            showAlert("거래 목록을 불러오는 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [user, searchQuery]); // tradeType 의존성 제거

    useEffect(() => {
        if (!authLoading && user) {
            const newSocket = io('http://localhost:3000/trades', {
                query: { userId: user.id }
            });
            setSocket(newSocket);
            
            newSocket.on('updateTrade', (updatedTrade) => {
                // allTrades 목록을 갱신합니다.
                setAllTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
                
                const isParticipant = updatedTrade.participants && updatedTrade.participants.some(p => (p.user && p.user.id === user.id) || p.userId === user.id);
                const isCreator = updatedTrade.creator && updatedTrade.creator.id === user.id;
                
                // myTrades 목록을 갱신합니다.
                setMyTrades(prev => {
                    const exists = prev.some(t => t.id === updatedTrade.id);
                    
                    if (exists) { // 이미 목록에 있음
                        if (!isParticipant && !isCreator) { // 내가 나갔거나 강퇴당함
                            return prev.filter(t => t.id !== updatedTrade.id);
                        }
                        return prev.map(t => t.id === updatedTrade.id ? updatedTrade : t); // 정보 갱신
                    } 
                    else { // 목록에 없음
                        if (isParticipant || isCreator) { // 내가 새로 참여함
                            return [updatedTrade, ...prev];
                        }
                    }
                    return prev; // 변경 없음
                });

                // 선택된 채팅방 정보도 갱신합니다.
                if (selectedTrade?.id === updatedTrade.id) {
                    setSelectedTrade(updatedTrade);
                }
            });

            newSocket.on('tradeCompleted', ({ tradeId }) => {
                setAllTrades(prev => prev.filter(t => t.id !== tradeId));
                setMyTrades(prev => prev.filter(t => t.id !== tradeId));
                if (selectedTrade?.id === tradeId) {
                    setSelectedTrade(null);
                }
            });

            const handleRemoved = (data) => {
                showAlert(data.title ? `'${data.title}' 거래에서 강퇴당했습니다.` : '거래에서 나갔습니다.');
                fetchTrades(); 
            };
            newSocket.on('kicked', handleRemoved);
            newSocket.on('leftTrade', handleRemoved);

            return () => {
                newSocket.off('updateTrade');
                newSocket.off('tradeCompleted');
                newSocket.off('kicked');
                newSocket.off('leftTrade');
                newSocket.disconnect();
            };
        }
    }, [user, authLoading, selectedTrade, fetchTrades]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchTrades();
        }
    }, [authLoading, user, fetchTrades]);
    
    useEffect(() => {
        setFilteredTrades(allTrades);
    }, [allTrades]); 
    
    useEffect(() => {
        if (tradeType === 'myTrades') {
            const tradeToSelect = myTrades.find(m => m.id === openChatId) || myTrades[0] || null;
            setSelectedTrade(tradeToSelect);
        } else {
            setSelectedTrade(null);
        }
    }, [tradeType, myTrades, openChatId]);
    
    const handleCreateTrade = async (tradeData) => {
        try {
            await apiClient.post("/trades", tradeData);
            setShowCreateModal(false);
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
            setTradeType('all');
            fetchTrades(); // 생성 후 목록 새로고침
        } catch (error) {
            console.error("거래글 생성 오류:", error);
            showAlert(error.response?.data?.message || "거래글 생성 중 오류가 발생했습니다.");
        }
    };

    const handleJoinLeave = async (trade, isParticipant) => {
        if (!user) return;
        const endpoint = isParticipant ? `/trades/${trade.id}/leave` : `/trades/${trade.id}/join`;
        try {
            await apiClient.post(endpoint);
            
            // --- 변경점: 즉시 탭 전환 로직 제거 ---
            // "meeting" 페이지와 동일하게, 데이터 새로고침만 수행합니다.
            // 백엔드의 웹소켓이 'updateTrade' 이벤트를 보내주길 기다립니다.
            // 수동 fetchTrades()도 제거하여 웹소켓에 데이터 갱신을 100% 위임합니다.
            // fetchTrades(); // 이 코드가 Race Condition을 유발했습니다.

            // '나가기'의 경우, 목록에서 즉시 제거
            if (isParticipant) {
                 setMyTrades(prev => prev.filter(t => t.id !== trade.id));
                 if(selectedTrade?.id === trade.id) {
                     setSelectedTrade(null);
                 }
            }

        } catch (error) {
            console.error(`거래 ${isParticipant ? '나가기' : '참여'} 오류:`, error);
            showAlert(error.response?.data?.message || "작업 중 오류가 발생했습니다.");
        }
    };
    
    const handleComplete = (trade) => { setTradeToComplete(trade); };
    const handleCancel = (trade) => { setTradeToCancel(trade); };
    
    const executeComplete = async () => {
        if (!tradeToComplete) return;
        try { 
            await apiClient.post(`/trades/${tradeToComplete.id}/complete`);
            showAlert('거래가 성공적으로 완료되었습니다.');
        } catch (error) { 
            console.error("거래 완료 오류:", error); 
            showAlert("거래 완료 중 오류가 발생했습니다."); 
        } finally { 
            setTradeToComplete(null); 
        }
    };

    const executeCancel = async () => {
        if (!tradeToCancel) return;
        try { 
            await apiClient.post(`/trades/${tradeToCancel.id}/complete`); // '거래 취소'도 'complete' 엔드포인트를 사용합니다.
            showAlert('거래가 취소되었습니다.');
        } catch (error) { 
            console.error("거래 취소 오류:", error); 
            showAlert("거래 취소 중 오류가 발생했습니다."); 
        } finally { 
            setTradeToCancel(null); 
        }
    };

    const handleKickUser = (targetUser) => {
        if (!socket || !selectedTrade || !user) return;
        socket.emit('kickUser', {
            tradeId: selectedTrade.id,
            targetUserId: targetUser.id,
            creatorId: user.id
        });
    };

    const calculateDiscount = (original, selling) => {
        if (!original || original === 0) return 0;
        return Math.round(((original - selling) / original) * 100);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600">사용자 정보 확인 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <main className="py-8 max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <div ref={helpRef} className="relative flex justify-center items-center gap-2">
                         <h1 className="text-4xl font-bold text-gray-800">중고교재 거래</h1>
                         <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 transition-colors"><i className="fa-solid fa-circle-question fa-lg"></i></button>
                         {showHelp && (
                         <div className="absolute top-full mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                             <h4 className="font-bold text-md mb-2 text-gray-800"> 중고교재 거래 유의사항</h4>
                             <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                 <li>거래는 가급적 교내 또는 공공장소에서 진행하세요.</li>
                                 <li>사기 피해에 주의하세요. 비대면 거래 시 인증을 철저히 확인하세요.</li>
                                 <li>거래가 완료되면 판매자는 '거래 완료' 버튼을 눌러주세요.</li>
                                 <li>판매글은 30일이 지나면 자동으로 삭제됩니다.</li>
                             </ul>
                             <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><i className="fa-solid fa-times"></i></button>
                         </div>
                         )}
                    </div>
                    <p className="text-xl text-gray-600 mt-4">사용하던 교재를 학우들과 안전하게 거래해보세요!</p>
                    <div className="mt-8 flex justify-center">
                        <button onClick={() => setTradeType('all')} className={`px-6 py-3 font-semibold transition ${tradeType === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>교재 거래</button>
                        <button onClick={() => setTradeType('myTrades')} className={`px-6 py-3 font-semibold transition ${tradeType === 'myTrades' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}>진행중인 거래</button>
                    </div>
                </div>

                {tradeType === 'myTrades' ? (
                    <div className="bg-white rounded-lg shadow-lg flex" style={{height: '70vh'}}>
                        <aside className="w-1/3 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b font-semibold text-lg">채팅 목록</div>
                            <div className="overflow-y-auto flex-1">
                                {myTrades.length > 0 ? (
                                    myTrades.map(t => (
                                        <div key={t.id} className={`w-full text-left p-4 hover:bg-gray-100 relative group ${selectedTrade?.id === t.id ? 'bg-blue-50' : ''}`}>
                                            <button onClick={() => setOpenChatId(t.id)} className="w-full text-left">
                                                <h3 className={`font-semibold truncate ${selectedTrade?.id === t.id ? 'text-blue-600' : 'text-gray-800'}`}>{t.title}</h3>
                                                <p className="text-xs text-gray-500">{t.books?.[0]?.bookTitle || '교재 정보 없음'}{t.books?.length > 1 ? ` 외 ${t.books.length - 1}권` : ''}</p>
                                            </button>
                                            {user.id !== t.creator.id && (
                                                <button onClick={() => handleJoinLeave(t, true)} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" title="거래 나가기">
                                                    <i className="fa-solid fa-door-open"></i>
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">참여중인 거래가 없습니다.</div>
                                )}
                            </div>
                               <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
                                   <p className="mb-2"><i className="fa-solid fa-circle-info mr-1.5"></i>거래가 완료되면 판매자는 '거래 완료' 버튼을 눌러주세요.</p>
                                   <p><i className="fa-solid fa-database mr-1.5"></i>모든 채팅 데이터는 30일 경과 시 거래글과 함께 자동 삭제됩니다.</p>
                               </div>
                        </aside>
                        <ChatView 
                            user={user} 
                            trade={selectedTrade} 
                            socket={socket} 
                            onKickUser={handleKickUser} 
                            onLeaveTrade={() => handleJoinLeave(selectedTrade, true)} 
                            onCompleteTrade={handleComplete}
                            onCancelTrade={handleCancel}
                        />
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105">
                                교재 판매하기
                            </button>
                        </div>
                        <form className="mb-8" onSubmit={(e) => { e.preventDefault(); fetchTrades(); }}>
                            <div className="relative">
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="교재 이름, 강의명, 제목으로 검색" className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"/>
                                <button type="submit" className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 hover:text-blue-500">
                                    <i className="fa-solid fa-search"></i>
                                </button>
                            </div>
                        </form>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {isLoading ? <div className="col-span-full text-center py-8"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-500">거래 목록을 불러오는 중...</p></div>
                             : filteredTrades.length > 0 ? (
                                filteredTrades.map(t => {
                                    const isParticipant = myTrades.some(myT => myT.id === t.id);
                                    const isCreator = user ? t.creator.id === user.id : false;
                                    const isTrading = t.status === 'trading';
                                    
                                    const firstBook = t.books?.[0];
                                    if (!firstBook) return null;

                                    const discount = calculateDiscount(firstBook.originalPrice, firstBook.sellingPrice);
                                    
                                    return (
                                        <div key={t.id} className={`bg-white rounded-lg shadow-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isTrading ? 'opacity-90' : ''}`}>
                                            <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-t-lg">
                                                <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover rounded-t-lg" />
                                                {isTrading && (
                                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-t-lg">
                                                        <span className="text-white text-lg font-bold"><i className="fa-solid fa-lock mr-2"></i>거래중</span>
                                                    </div>
                                                )}
                                                {discount > 0 && (
                                                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{discount}% 할인</span>
                                                )}
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow">
                                                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{t.title}</h3>
                                                <p className="text-sm text-gray-700 font-semibold line-clamp-1">
                                                    {firstBook.bookTitle}
                                                    {t.books.length > 1 && (
                                                        <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                                                            외 {t.books.length - 1}권
                                                        </span>
                                                    )}
                                                </p>
                                                {firstBook.courseName && <p className="text-xs text-gray-500 mb-3 line-clamp-1">({firstBook.courseName})</p>}
                                                
                                                <div className="my-3">
                                                    <span className="text-xl font-bold text-blue-600">{firstBook.sellingPrice.toLocaleString()}원</span>
                                                    {firstBook.originalPrice > firstBook.sellingPrice && (
                                                        <span className="text-sm text-gray-400 line-through ml-2">{firstBook.originalPrice.toLocaleString()}원</span>
                                                    )}
                                                </div>

                                                <div className="flex-grow"></div>
                                                <div className="mt-auto pt-4 border-t">
                                                    {(expandedCardId === t.id && (t.description || t.books.length > 1)) && (
                                                        <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-md animate-fadeIn">
                                                            {t.description && <p className="whitespace-pre-wrap mb-3">{t.description}</p>}
                                                            {t.books.length > 1 && (
                                                                <div>
                                                                    <h5 className="font-semibold text-gray-800 mb-2">판매 목록</h5>
                                                                    <ul className="list-disc list-inside space-y-1">
                                                                        {t.books.map(book => (
                                                                            <li key={book.id}>
                                                                                {book.bookTitle} - <span className="font-semibold">{book.sellingPrice.toLocaleString()}원</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center">
                                                         <UserDisplay userTarget={{ id: t.creator.id, nickname: t.creator.nickname }} context={{ type: 'trade', id: t.id }} ><span className="text-sm font-medium text-gray-500 cursor-pointer"><i className="fa-regular fa-user mr-1.5"></i>{t.creator.nickname}</span></UserDisplay>
                                                        <div className="flex items-center space-x-2">
                                                            {(t.description || t.books.length > 1) && (<button onClick={() => handleToggleDetails(t.id)} className="text-xs font-semibold text-gray-500 hover:text-black p-1">{expandedCardId === t.id ? '간략히' : '자세히'}</button>)}
                                                            
                                                            {user && isCreator && (
                                                                <button onClick={() => { setTradeType('myTrades'); setOpenChatId(t.id); }} className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition">채팅</button>
                                                            )}
                                                            
                                                            {user && isParticipant && !isCreator && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleJoinLeave(t, true)} className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition">나가기</button>
                                                                    <button onClick={() => { setTradeType('myTrades'); setOpenChatId(t.id); }} className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition">채팅</button>
                                                                </div>
                                                            )}
                                                            
                                                            {user && !isCreator && !isParticipant && (
                                                                <button onClick={() => handleJoinLeave(t, false)} disabled={isTrading} className={`px-3 py-1.5 rounded-md text-xs font-bold text-white transition ${isTrading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>참여</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                               ) : <div className="col-span-full text-center py-16"><i className="fas fa-book text-6xl text-gray-300 mb-4"></i><h3 className="text-xl font-semibold text-gray-600 mb-2">거래글이 없습니다</h3><p className="text-gray-500">첫 번째 판매글을 작성해보세요!</p></div>
                            }
                        </div>
                    </>
                )}
            </main>

            {showSuccessModal && (<div className="fixed top-20 left-1/2 -translate-x-1.2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">거래글이 성공적으로 작성되었습니다!</div>)}
            {user && <CreateTradeModal show={showCreateModal} onCreate={handleCreateTrade} onClose={() => setShowCreateModal(false)} user={user} />}
            {tradeToComplete && (<ConfirmModal message={`'${tradeToComplete.title}' 거래를 완료하시겠습니까? 완료된 거래는 채팅방과 함께 삭제됩니다.`} onConfirm={executeComplete} onCancel={() => setTradeToComplete(null)} confirmText="거래 완료" />)}
            {tradeToCancel && (<ConfirmModal message={`'${tradeToCancel.title}' 거래를 취소하시겠습니까? 이 작업은 거래글과 채팅방을 모두 삭제합니다.`} onConfirm={executeCancel} onCancel={() => setTradeToCancel(null)} confirmText="거래 취소" />)}
            {alertModal.show && (<AlertModal  message={alertModal.message} onClose={() => setAlertModal({ show: false, message: ""})} />)}
        </div>
    );
}