"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import TimetableGrid from "./TimetableGrid";
import LectureReviewModal from "./LectureReviewModal";
import html2canvas from "html2canvas";

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-80 shadow-2xl animate-fadeIn">
                <h3 className="text-lg font-bold mb-2">확인</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">확인</button>
                </div>
            </div>
        </div>
    );
};

function DirectAddModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({ courseName: '', professor: '', day: '월', startPeriod: 1, endPeriod: 1, classroom: '', credits: 3 });
    const handleSubmit = () => {
        const periods = [];
        const start = Number(form.startPeriod);
        const end = Number(form.endPeriod);
        if(start > end) { alert("시작 교시 오류"); return; }
        for (let i = start; i <= end; i++) periods.push(i);
        
        const parsedCredits = Number(form.credits) || 0;

        onSubmit({ 
            courseName: form.courseName, 
            professor: form.professor, 
            credits: parsedCredits,
            schedule: [{ day: form.day, periods, classroom: form.classroom }] 
        });
    };
    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold mb-4">새 수업 추가</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">강의 정보</label>
                        <input placeholder="과목명" className="w-full border p-2.5 rounded-lg outline-none" value={form.courseName} onChange={e=>setForm({...form, courseName:e.target.value})} />
                        <div className="flex gap-2">
                            <input placeholder="교수명" className="flex-1 border p-2.5 rounded-lg outline-none" value={form.professor} onChange={e=>setForm({...form, professor:e.target.value})} />
                            <div className="flex items-center gap-1 border p-2.5 rounded-lg w-24">
                                <input type="number" step="0.5" className="w-full outline-none text-center" value={form.credits} onChange={e=>setForm({...form, credits:e.target.value})} />
                                <span className="text-xs text-gray-500 whitespace-nowrap">학점</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <label className="block text-xs font-bold text-gray-500 mb-2">시간/장소</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <select className="border p-2 rounded-md bg-white outline-none" value={form.day} onChange={e=>setForm({...form, day:e.target.value})}>
                                    {['월','화','수','목','금'].map(d=><option key={d} value={d}>{d}요일</option>)}
                                </select>
                                <div className="flex items-center gap-1 bg-white border p-1 rounded-md">
                                    <input type="number" className="w-10 text-center outline-none" value={form.startPeriod} onChange={e=>setForm({...form, startPeriod:e.target.value})} />
                                    <span>~</span>
                                    <input type="number" className="w-10 text-center outline-none" value={form.endPeriod} onChange={e=>setForm({...form, endPeriod:e.target.value})} />
                                </div>
                            </div>
                            <input placeholder="강의실" className="w-full border p-2 rounded-md outline-none" value={form.classroom} onChange={e=>setForm({...form, classroom:e.target.value})} />
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">취소</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-red-500 text-white rounded-lg">저장</button>
                </div>
            </div>
        </div>
    );
}

export default function TimetablePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [year, setYear] = useState(2025);
    const [semester, setSemester] = useState("1학기");
    const [timetables, setTimetables] = useState([]);
    const [activeTimetableId, setActiveTimetableId] = useState(null);
    const [currentTimetable, setCurrentTimetable] = useState(null);
    const [showHelp, setShowHelp] = useState(false);
    
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isDirectAddOpen, setIsDirectAddOpen] = useState(false);
    const [selectedReviewLecture, setSelectedReviewLecture] = useState(null);
    
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [lectureTree, setLectureTree] = useState({});
    const [expandedDepts, setExpandedDepts] = useState({});
    const [expandedMajors, setExpandedMajors] = useState({});
    const [allLectures, setAllLectures] = useState([]);
    const [lectureStats, setLectureStats] = useState({});
    
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
    const helpRef = useRef(null);
    const timetableGridRef = useRef(null);

    useEffect(() => { if (!authLoading && !user) router.push("/login"); }, [user, authLoading, router]);

    const createDefaultTimetable = useCallback(async () => {
        try {
            const res = await apiClient.post('/timetable/my', { name: "시간표 1", year, semester });
            setTimetables([res.data]);
            setActiveTimetableId(res.data.id);
        } catch (err) { console.error(err); }
    }, [year, semester]);

    const fetchTimetables = useCallback(async () => {
        try {
            const res = await apiClient.get(`/timetable/my?year=${year}&semester=${encodeURIComponent(semester)}`);
            if (res.data && res.data.length > 0) {
                setTimetables(res.data);
                if (!activeTimetableId) setActiveTimetableId(res.data[0].id);
            } else {
                createDefaultTimetable();
            }
        } catch (err) { console.error(err); }
    }, [year, semester, activeTimetableId, createDefaultTimetable]);

    useEffect(() => {
        if (!user) return;
        fetchTimetables();
    }, [user, year, semester, fetchTimetables]);

    useEffect(() => {
        if (timetables.length > 0 && activeTimetableId) {
            setCurrentTimetable(timetables.find(t => t.id === activeTimetableId));
        } else if (timetables.length > 0) {
            setActiveTimetableId(timetables[0].id);
        } else {
            setCurrentTimetable(null);
        }
    }, [activeTimetableId, timetables]);

    const createNewTimetable = async () => {
        try {
            await apiClient.post('/timetable/my', { name: `시간표 ${timetables.length + 1}`, year, semester });
            fetchTimetables();
        } catch { alert("생성 실패"); }
    };

    const handleDeleteTimetable = (e, id) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            message: "시간표를 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/timetable/my/${id}`);
                    const newTimetables = timetables.filter(t => t.id !== id);
                    setTimetables(newTimetables);
                    if (id === activeTimetableId) setActiveTimetableId(newTimetables.length > 0 ? newTimetables[0].id : null);
                    fetchTimetables();
                } catch { alert("삭제 실패"); }
                setConfirmModal({ isOpen: false });
            }
        });
    };

    const fetchLectureStats = async (lectureIds) => {
        if (!lectureIds || lectureIds.length === 0) return;
        try {
            const res = await apiClient.post('/timetable/lectures/stats', { ids: lectureIds });
            const statsMap = {};
            res.data.forEach(stat => statsMap[stat.id] = stat);
            setLectureStats(prev => ({ ...prev, ...statsMap }));
        } catch (err) { console.error(err); }
    };

    const handleDeleteLecture = async (lectureId) => {
        setConfirmModal({
            isOpen: true,
            message: "강의를 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/timetable/my/lecture/${lectureId}`);
                    fetchTimetables();
                    if (allLectures.length > 0) fetchLectureStats(allLectures.map(l => l.id));
                } catch (err) { console.error(err); }
                setConfirmModal({ isOpen: false });
            }
        });
    };

    const fetchAllLectures = async () => {
        try {
            const res = await apiClient.get('/timetable/lectures');
            
            if (res.data.length > 0) {
                console.log("🔥 [강의 데이터 확인]", res.data[0]);
            }

            setAllLectures(res.data);
            const tree = {};
            res.data.forEach(lec => {
                const d = lec.department || "기타";
                const m = lec.major || "전공 없음";
                if (!tree[d]) tree[d] = {};
                if (!tree[d][m]) tree[d][m] = [];
                tree[d][m].push(lec);
            });
            setLectureTree(tree);
            fetchLectureStats(res.data.map(l => l.id));
        } catch (err) { console.error(err); }
    };

    const handleSearchOpen = () => {
        setIsSearchOpen(true);
        if (allLectures.length === 0) fetchAllLectures();
        else fetchLectureStats(allLectures.map(l => l.id));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setSearchResults(allLectures.filter(l => l.courseName.includes(searchQuery) || l.professor.includes(searchQuery)));
    };

    const checkTimeConflict = (currentLectures, newLectureId) => {
        const newLecture = allLectures.find(l => l.id === newLectureId);
        if (!newLecture) return false;

        if (currentLectures.some(l => l.lectureId === newLectureId)) {
            alert("이미 시간표에 담긴 강의입니다.");
            return true;
        }

        if (!newLecture.schedule || newLecture.schedule.length === 0) return false;

        for (const existing of currentLectures) {
            if (!existing.schedule || existing.schedule.length === 0) continue;

            for (const existTime of existing.schedule) {
                for (const newTime of newLecture.schedule) {
                    if (existTime.day === newTime.day) {
                        const overlap = existTime.periods.some(p => newTime.periods.includes(p));
                        if (overlap) {
                            alert(`'${existing.courseName}' 강의와 시간이 겹칩니다!`);
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    const addLecture = async (lectureId) => {
        if (!activeTimetableId) return;
        
        if (checkTimeConflict(currentTimetable.lectures, lectureId)) return;

        try {
            await apiClient.post(`/timetable/my/${activeTimetableId}/lecture`, { lectureId });
            fetchTimetables();
            fetchLectureStats([lectureId]);
            setIsSearchOpen(false);
        } catch { alert("추가 실패"); }
    };

    const handleDirectAdd = async (formData) => {
        if (!activeTimetableId) return;
        try {
            await apiClient.post(`/timetable/my/${activeTimetableId}/custom-lecture`, formData);
            fetchTimetables();
            setIsDirectAddOpen(false);
        } catch { alert("추가 실패"); }
    };

    const handleSaveImage = async () => {
        if (!timetableGridRef.current) return;
        try {
            const canvas = await html2canvas(timetableGridRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true,
                allowTaint: true,
            });
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `${year}-${semester}-${currentTimetable?.name || 'timetable'}.png`;
            link.click();
        } catch (err) {
            console.error(err);
            alert("이미지 저장 중 오류가 발생했습니다.");
        }
    };

    const getLectureClassroom = (lecture) => {
        if (lecture.classroom) return lecture.classroom;
        if (lecture.schedule && lecture.schedule.length > 0) return lecture.schedule[0].classroom;
        return "장소미정";
    };

    const renderLectureStats = (lecture) => {
        const stat = lectureStats[lecture.id];
        if (!stat) return null;
        return (
            <div className="flex items-center gap-1.5 text-xs mt-1.5 text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">
                <span>정원 {stat.capacity}명</span>
                <span className="text-gray-300">/</span>
                <span className="font-semibold text-blue-600">담은 인원 {stat.savedCount}명</span>
                <span className="text-gray-400 font-normal">
                    (경쟁률 {stat.capacity > 0 ? `${stat.competitionRate}:1` : '-'})
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedReviewLecture(lecture); }}
                    className="ml-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded hover:bg-yellow-200 transition font-bold"
                >
                    강의평
                </button>
            </div>
        );
    };

    const getCreditDisplay = (lecture) => {
        const val = lecture.credits ?? lecture.credit ?? lecture.CREDITS ?? 0;
        return Number(val);
    };

    const calculateTotalCredits = (lectures) => {
        if (!lectures) return 0;
        return lectures.reduce((acc, l) => acc + getCreditDisplay(l), 0);
    };

    return (
        <div className="min-h-screen bg-white">
            <style>{`.animate-slideUp{animation:slideUp 0.3s ease-out forwards}.animate-fadeIn{animation:fadeIn 0.2s ease-out forwards}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes fadeIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}`}</style>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8 p-8 rounded-3xl bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg relative">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-4xl font-extrabold">시간표</h1>
                        <div ref={helpRef} className="relative">
                            <button onClick={() => setShowHelp(!showHelp)} className="text-white/70 hover:text-white"><i className="fa-solid fa-circle-question fa-lg"></i></button>
                            {showHelp && (
                                <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 p-4 rounded-xl shadow-xl z-50 w-72 text-sm">
                                    <h4 className="font-bold mb-2">도움말</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>새 시간표를 만들고 관리하세요.</li>
                                        <li>강의를 클릭하면 실시간 강의평 채팅방이 열립니다.</li>
                                        <li>이미지로 저장하여 공유할 수 있습니다.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-lg opacity-90">필수 강의를 담고 나만의 시간표를 완성해보세요!</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 h-auto items-start">
                    <div className="lg:w-72 flex-shrink-0 flex flex-col gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <select className="w-full p-2 border rounded-md mb-2" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                                <option value={2025}>2025년</option>
                                <option value={2024}>2024년</option>
                            </select>
                            <select className="w-full p-2 border rounded-md" value={semester} onChange={(e) => setSemester(e.target.value)}>
                                <option value="1학기">1학기</option>
                                <option value="2학기">2학기</option>
                            </select>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-1 flex-1 overflow-y-auto">
                            {timetables.map(t => (
                                <div key={t.id} className="group flex justify-between items-center hover:bg-gray-50 rounded-md pr-2">
                                    <button onClick={() => setActiveTimetableId(t.id)} className={`flex-1 text-left px-3 py-2 text-sm ${activeTimetableId === t.id ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>{t.name}</button>
                                    <button onClick={(e) => handleDeleteTimetable(e, t.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 px-2"><i className="fas fa-trash-alt"></i></button>
                                </div>
                            ))}
                            <button onClick={createNewTimetable} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 mt-2 border-t pt-2"><i className="fas fa-plus mr-2"></i>새 시간표</button>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                            <button onClick={handleSaveImage} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"><i className="fas fa-camera mr-2"></i> 이미지 저장</button>
                        </div>
                    </div>

                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-700">{currentTimetable?.name || "시간표"}</h2>
                            <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">
                                {currentTimetable?.lectures?.length || 0}과목 / {calculateTotalCredits(currentTimetable?.lectures)}학점
                            </span>
                        </div>
                        <div className="p-4 relative">
                            <TimetableGrid 
                                ref={timetableGridRef}
                                currentTimetable={currentTimetable} 
                                onDeleteLecture={handleDeleteLecture} 
                                onLectureClick={(lec) => setSelectedReviewLecture(lec)} 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                <button onClick={() => setIsDirectAddOpen(true)} className="bg-white text-gray-700 shadow-lg p-4 rounded-full hover:bg-gray-50"><i className="fas fa-pen"></i></button>
                <button onClick={handleSearchOpen} className="bg-red-500 text-white shadow-lg px-6 py-4 rounded-full hover:bg-red-600 font-bold"><i className="fas fa-search mr-2"></i>강의 검색</button>
            </div>

            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <div className="bg-white w-full h-[70vh] rounded-t-2xl p-6 flex flex-col animate-slideUp shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">수업 검색</h3>
                            <button onClick={() => setIsSearchOpen(false)}><i className="fas fa-times fa-lg"></i></button>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input className="flex-1 border rounded-lg px-4 py-2" placeholder="강의명/교수명" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg">검색</button>
                        </form>
                        <div className="flex-1 overflow-y-auto space-y-2">
                            {(searchQuery ? searchResults : []).map(lec => (
                                <div key={lec.id} className="border-b py-3 px-2 hover:bg-gray-50 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {lec.courseName}
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                {getCreditDisplay(lec)}학점
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {lec.professor} | {getLectureClassroom(lec)} | {lec.schedule?.map(s => `${s.day}${s.periods.join(',')}`).join(', ')}
                                        </div>
                                        {renderLectureStats(lec)}
                                    </div>
                                    <button onClick={(e) => {e.stopPropagation(); addLecture(lec.id);}} className="bg-blue-50 text-blue-600 px-3 py-1 h-fit rounded text-xs font-bold">추가</button>
                                </div>
                            ))}
                            {!searchQuery && Object.keys(lectureTree).map(dept => (
                                <div key={dept} className="border rounded-lg overflow-hidden">
                                    <button onClick={() => setExpandedDepts(p => ({...p, [dept]:!p[dept]}))} className="w-full px-4 py-3 bg-gray-50 flex justify-between font-bold text-gray-700">
                                        {dept} <i className={`fas fa-chevron-${expandedDepts[dept]?'up':'down'}`}></i>
                                    </button>
                                    {expandedDepts[dept] && (
                                        <div className="bg-white border-t">
                                            {Object.keys(lectureTree[dept]).map(major => (
                                                <div key={major}>
                                                    <button onClick={() => setExpandedMajors(p => ({...p, [major]:!p[major]}))} className="w-full px-6 py-2 text-left text-sm border-b font-medium text-gray-600 flex justify-between">
                                                        {major} <i className={`fas fa-chevron-${expandedMajors[major]?'up':'down'} text-xs`}></i>
                                                    </button>
                                                    {expandedMajors[major] && (
                                                        <div className="bg-gray-50 px-6 py-2 space-y-2">
                                                            {lectureTree[dept][major].map(lec => (
                                                                <div key={lec.id} className="bg-white p-3 rounded border flex justify-between hover:shadow-sm" onClick={()=>setSelectedReviewLecture(lec)}>
                                                                    <div>
                                                                        <div className="font-bold text-sm flex items-center gap-2">
                                                                            {lec.courseName}
                                                                            <span className="text--[10px] font-normal text-gray-500 border px-1 rounded">
                                                                                {getCreditDisplay(lec)}학점
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            {lec.professor} | {getLectureClassroom(lec)} | {lec.schedule?.map(s => `${s.day}${s.periods.join(',')}`).join(', ')}
                                                                        </div>
                                                                        {renderLectureStats(lec)}
                                                                    </div>
                                                                    <button onClick={(e) => {e.stopPropagation(); addLecture(lec.id);}} className="bg-blue-50 text-blue-600 px-3 py-1 h-fit rounded text-xs font-bold">추가</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isDirectAddOpen && <DirectAddModal onClose={() => setIsDirectAddOpen(false)} onSubmit={handleDirectAdd} />}
            <ConfirmModal isOpen={confirmModal.isOpen} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
            <LectureReviewModal isOpen={!!selectedReviewLecture} onClose={() => setSelectedReviewLecture(null)} lecture={selectedReviewLecture} />
        </div>
    );
}