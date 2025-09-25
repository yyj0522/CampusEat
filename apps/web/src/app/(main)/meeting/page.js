"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { useChat } from "../../context/ChatProvider";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc, getDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot,
    runTransaction, arrayUnion, arrayRemove, Timestamp, deleteDoc
} from "firebase/firestore";
import Image from "next/image";
import '../../styles/style.css';
import UserDisplay from '../../components/UserDisplay';

// --- 컴포넌트 및 헬퍼 함수 ---

// 삭제 확인 모달 컴포넌트
const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
      <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-[500px]">
          <p className="text-lg font-medium text-gray-800 mb-8">{message}</p>
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

// 모임 생성 모달 (기존)
const CreateMeetingModal = ({ show, onClose, user, university, nickname }) => {
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
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
      }
    }, [show]);

    const handleTagToggle = (tag) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !date || !time || !location) {
            alert("필수 항목(*)을 모두 입력해주세요.");
            return;
        }
        const meetingDateTime = Timestamp.fromDate(new Date(`${date}T${time}`));
        if (meetingDateTime.toDate() < new Date()) {
            alert("현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다.");
            return;
        }

        try {
            await addDoc(collection(db, "meetings"), {
                title, datetime: meetingDateTime, maxParticipants: Number(maxParticipants),
                location, purpose, description, tags, 
                type: 'meeting',
                university, status: 'active',
                creatorId: user.uid, creatorNickname: nickname,
                participantIds: [user.uid], participantCount: 1,
                createdAt: serverTimestamp(),
            });
            onClose(true);
        } catch (error) {
            console.error("모임 생성 오류:", error);
            alert("모임 생성 중 오류가 발생했습니다.");
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl max-w-2xl w-full p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">새 모임 만들기</h3>
                    <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="모임 제목을 입력하세요" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">날짜 *</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">시간 *</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">최대 인원 *</label>
                            <input type="number" min={2} max={20} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">장소 *</label>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="만날 장소를 입력하세요" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">목적</label>
                            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full border p-2 rounded-lg" placeholder="모임의 목적을 간단히 설명해주세요" />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                            <div className="flex flex-wrap gap-2">
                                {["점심", "술", "취미", "스터디", "운동", "게임"].map(tag => (
                                    <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={`tag-btn tag tag-${tag.toLowerCase()} ${tags.includes(tag) ? "selected" : ""}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="모임에 대한 자세한 설명을 적어주세요"></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => onClose(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">취소</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">모임 만들기</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// 택시/카풀 생성 모달
const CreateCarpoolModal = ({ show, onClose, user, university, nickname }) => {
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("");
    const [maxParticipants, setMaxParticipants] = useState(4);
    const [departure, setDeparture] = useState("");
    const [arrival, setArrival] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const today = new Date();
        const [hour, minute] = time.split(':');
        today.setHours(hour, minute, 0, 0);

        if (!title || !time || !departure || !arrival) {
            alert("필수 항목(*)을 모두 입력해주세요.");
            return;
        }
        if (today < new Date()) {
            alert("현재 시간보다 이전의 시간으로는 모임을 생성할 수 없습니다.");
            return;
        }

        const meetingDateTime = Timestamp.fromDate(today);

        try {
            await addDoc(collection(db, "meetings"), {
                title,
                datetime: meetingDateTime,
                maxParticipants: Number(maxParticipants),
                departure,
                arrival,
                description,
                tags: ["카풀/택시"],
                type: 'carpool',
                university,
                status: 'active',
                creatorId: user.uid,
                creatorNickname: nickname,
                participantIds: [user.uid],
                participantCount: 1,
                createdAt: serverTimestamp(),
            });
            onClose(true);
        } catch (error) {
            console.error("카풀 모임 생성 오류:", error);
            alert("모임 생성 중 오류가 발생했습니다.");
        }
    };

    if (!show) return null;

    return (
        <div className="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl max-w-2xl w-full p-6 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">택시/카풀 동승자 구하기</h3>
                    <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="예: 천안역 갈 사람 2명 구해요" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">출발 시간 * (오늘)</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">최대 인원 * (본인 포함)</label>
                            <input type="number" min={2} max={10} value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} required className="w-full border p-2 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">출발지 *</label>
                            <input type="text" value={departure} onChange={e => setDeparture(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="예: 백석대학교 정문" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">도착지 *</label>
                            <input type="text" value={arrival} onChange={e => setArrival(e.target.value)} required className="w-full border p-2 rounded-lg" placeholder="예: 천안역" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full border p-2 rounded-lg" placeholder="탑승 관련 추가 정보를 입력해주세요."></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => onClose(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">취소</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">구하기</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// 메인 페이지 컴포넌트
export default function MeetingPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");
    const [university, setUniversity] = useState("");
    const { setOpenChatId, isInMeeting, isInCarpool } = useChat();
    
    const [meetings, setMeetings] = useState([]);
    const [filteredMeetings, setFilteredMeetings] = useState([]);
    const [activeTag, setActiveTag] = useState("전체");
    const [statusFilter, setStatusFilter] = useState("active");
    const [isLoading, setIsLoading] = useState(true);
    
    const [meetingType, setMeetingType] = useState('meeting');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCarpoolModal, setShowCarpoolModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [meetingToDelete, setMeetingToDelete] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const snap = await getDoc(doc(db, "users", currentUser.uid));
                if (snap.exists()) {
                    setNickname(snap.data().nickname);
                    setUniversity(snap.data().university);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!university) return;
        setIsLoading(true);
        const q = query(collection(db, "meetings"), 
            where("university", "==", university),
            where("type", "==", meetingType),
            orderBy("datetime", "asc")
        );
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
        if (statusFilter !== "all") {
            if (statusFilter === "active") {
                tempMeetings = tempMeetings.filter(m => m.status === 'active' && m.datetime.toDate() > new Date());
            } else {
                tempMeetings = tempMeetings.filter(m => m.status !== 'active' || m.datetime.toDate() <= new Date());
            }
        }
        if (meetingType === 'meeting' && activeTag !== "전체") {
            tempMeetings = tempMeetings.filter(m => m.tags.includes(activeTag));
        }
        setFilteredMeetings(tempMeetings);
    }, [meetings, activeTag, statusFilter, meetingType]);
    
    const handleCreateModalClose = (isSuccess) => {
        setShowCreateModal(false);
        setShowCarpoolModal(false);
        if (isSuccess) {
            setShowSuccessModal(true);
            setTimeout(() => setShowSuccessModal(false), 2000);
        }
    };

    const handleJoinLeave = async (meeting, isParticipant) => {
        if (!isParticipant) {
            if (meeting.type === 'meeting' && isInMeeting) {
                alert("이미 다른 '취미&약속' 모임에 참여 중입니다. 하나의 모임만 참여할 수 있습니다.");
                return;
            }
            if (meeting.type === 'carpool' && isInCarpool) {
                alert("이미 다른 '택시&카풀'에 참여 중입니다. 하나의 모임만 참여할 수 있습니다.");
                return;
            }
        }
        
        const meetingRef = doc(db, "meetings", meeting.id);
        try {
            await runTransaction(db, async (transaction) => {
                const meetingDoc = await transaction.get(meetingRef);
                if (!meetingDoc.exists()) throw "모임이 존재하지 않습니다.";
                const currentCount = meetingDoc.data().participantCount;
                if (!isParticipant && currentCount >= meeting.maxParticipants) {
                    throw "모집 인원이 가득 찼습니다.";
                }
                transaction.update(meetingRef, {
                    participantIds: isParticipant ? arrayRemove(user.uid) : arrayUnion(user.uid),
                    participantCount: isParticipant ? currentCount - 1 : currentCount + 1
                });
            });
        } catch (error) {
            console.error("참여/나가기 오류:", error);
            alert(String(error));
        }
    };
    
    const handleDelete = (meetingId) => {
        setMeetingToDelete(meetingId);
    };

    const executeDelete = async () => {
        if (!meetingToDelete) return;
        try {
            await deleteDoc(doc(db, "meetings", meetingToDelete));
        } catch (error) {
            console.error("모임 삭제 오류:", error);
            alert("모임 삭제 중 오류가 발생했습니다.");
        } finally {
            setMeetingToDelete(null);
        }
    };
    
    const getTagText = (tag) => ({ "점심": "lunch", "술": "alcohol", "취미": "hobby", "스터디": "study", "운동": "exercise", "게임": "game" }[tag] || "default");

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="py-8 max-w-7xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">번개모임</h1>
                    <p className="text-xl text-gray-600 mt-4">함께할 친구들을 찾아보세요!</p>
                    <div className="mt-8 flex justify-center border-b">
                        <button onClick={() => setMeetingType('meeting')} className={`px-6 py-3 font-semibold transition ${meetingType === 'meeting' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                            취미&약속
                        </button>
                        <button onClick={() => setMeetingType('carpool')} className={`px-6 py-3 font-semibold transition ${meetingType === 'carpool' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
                            택시&카풀
                        </button>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <button
                      onClick={() => meetingType === 'meeting' ? setShowCreateModal(true) : setShowCarpoolModal(true)}
                      disabled={(meetingType === 'meeting' && isInMeeting) || (meetingType === 'carpool' && isInCarpool)}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        (meetingType === 'meeting' && isInMeeting) ? "이미 참여 중인 '취미&약속' 모임이 있습니다." :
                        (meetingType === 'carpool' && isInCarpool) ? "이미 참여 중인 '택시&카풀'이 있습니다." : ""
                      }
                    >
                      {meetingType === 'meeting' ? '모임 만들기' : '택시/카풀 구하기'}
                    </button>
                </div>
                
                {meetingType === 'meeting' && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                                <span className="font-medium">태그 필터:</span>
                                {["전체", "점심", "술", "취미", "스터디", "운동", "게임"].map(tag => (
                                    <button key={tag} onClick={() => setActiveTag(tag)} className={`tag-filter-btn tag tag-${getTagText(tag)} ${activeTag === tag ? 'active' : ''}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className="font-medium">상태:</span>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg">
                                    <option value="active">모집중</option>
                                    <option value="completed">완료</option>
                                    <option value="all">전체</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    {isLoading ? <div className="text-center py-8"><div className="loading mx-auto mb-4"></div><p className="text-gray-500">모임을 불러오는 중...</p></div>
                     : filteredMeetings.length > 0 ? (
                        filteredMeetings.map(m => {
                            const isParticipant = m.participantIds.includes(user?.uid);
                            const isCreator = m.creatorId === user?.uid;
                            const isFull = m.participantCount >= m.maxParticipants;
                            const isExpired = m.datetime.toDate() < new Date();
                            const status = isExpired || m.status !== 'active' ? '종료' : '모집중';

                            return (
                                <div key={m.id} className="meeting-card bg-white p-6 rounded-xl shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-lg font-semibold text-gray-800 flex-1">{m.title}</h3>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {isCreator && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">방장</span>}
                                            <span className={`status-badge ${status === '종료' ? 'expired' : 'active'}`}>{status}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-gray-600">
                                        {m.type === 'carpool' ? (
                                            <>
                                                <span><i className="fas fa-clock mr-2 text-green-500"></i>{m.datetime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span><i className="fas fa-users mr-2 text-purple-500"></i>{m.participantCount}/{m.maxParticipants}명</span>
                                                <span><i className="fas fa-map-marker-alt mr-2 text-blue-500"></i>{m.departure}</span>
                                                <span><i className="fas fa-flag-checkered mr-2 text-red-500"></i>{m.arrival}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span><i className="fas fa-calendar-alt mr-2 text-blue-500"></i>{m.datetime.toDate().toLocaleDateString()}</span>
                                                <span><i className="fas fa-clock mr-2 text-green-500"></i>{m.datetime.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span><i className="fas fa-users mr-2 text-purple-500"></i>{m.participantCount}/{m.maxParticipants}명</span>
                                                <span><i className="fas fa-map-marker-alt mr-2 text-red-500"></i>{m.location}</span>
                                            </>
                                        )}
                                    </div>
                                    {m.tags && m.tags.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{m.tags.map(tag => <span key={tag} className={`tag tag-${getTagText(tag)}`}>{tag}</span>)}</div>}
                                    {m.purpose && <div className="mb-3 text-sm text-gray-600"><strong>목적:</strong> {m.purpose}</div>}
                                    {m.description && <p className="text-gray-700 mb-4 text-sm">{m.description}</p>}
                                    <div className="flex justify-between items-center pt-4 border-t">
                                        <UserDisplay
                                            userTarget={{ id: m.creatorId, nickname: m.creatorNickname }}
                                            context={{ type: 'meeting', id: m.id }}
                                        >
                                            <span className="text-sm text-gray-500 cursor-pointer"><i className="fas fa-user-circle mr-1"></i>방장: {m.creatorNickname}</span>
                                        </UserDisplay>
                                        <div className="flex space-x-2">
                                            {status === '모집중' && !isCreator &&
                                                <button onClick={() => handleJoinLeave(m, isParticipant)} disabled={isFull && !isParticipant}
                                                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${isParticipant ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} ${isFull && !isParticipant ? 'btn-disabled' : ''}`}>
                                                    <i className={`fas ${isParticipant ? 'fa-minus' : 'fa-plus'} mr-1`}></i>
                                                    {isParticipant ? '나가기' : isFull ? '모집완료' : '참여하기'}
                                                </button>
                                            }
                                            {isParticipant && <button onClick={() => setOpenChatId(m.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"><i className="fas fa-comments mr-1"></i>채팅방</button>}
                                            {isCreator && <button onClick={() => handleDelete(m.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"><i className="fas fa-trash mr-1"></i>삭제</button>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                     ) : <div className="text-center py-16"><i className="fas fa-users text-6xl text-gray-300 mb-4"></i><h3 className="text-xl font-semibold text-gray-600 mb-2">모임이 없습니다</h3><p className="text-gray-500">새로운 모임을 만들어보세요!</p></div>
                    }
                </div>
            </main>

            {showSuccessModal && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
                    모임이 성공적으로 생성되었습니다!
                </div>
            )}
            <CreateMeetingModal show={showCreateModal} onClose={handleCreateModalClose} user={user} university={university} nickname={nickname} />
            <CreateCarpoolModal show={showCarpoolModal} onClose={handleCreateModalClose} user={user} university={university} nickname={nickname} />
            
            {meetingToDelete && (
                <ConfirmModal
                    message="정말로 이 모임을 삭제하시겠습니까?"
                    onConfirm={executeDelete}
                    onCancel={() => setMeetingToDelete(null)}
                />
            )}
        </div>
    );
}