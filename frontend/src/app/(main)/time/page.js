"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthProvider";
import apiClient from "@/lib/api";
import html2canvas from "html2canvas";
import '../../styles/style.css';

const Toast = ({ message, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 2000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);
    if (!show) return null;
    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm z-50">
            {message}
        </div>
    );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-80 shadow-2xl animate-fadeIn">
                <h3 className="text-lg font-bold mb-2 text-gray-800">확인</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">확인</button>
                </div>
            </div>
        </div>
    );
};

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
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [lectureTree, setLectureTree] = useState({});
    const [expandedDepts, setExpandedDepts] = useState({});
    const [expandedMajors, setExpandedMajors] = useState({});
    const [allLectures, setAllLectures] = useState([]);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
    const helpRef = useRef(null);
    const timetableRef = useRef(null);

    useEffect(() => {
        if (!authLoading && !user) router.push("/login");
    }, [user, authLoading, router]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        }
        if (showHelp) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showHelp]);

    useEffect(() => {
        if (!user) return;
        fetchTimetables();
    }, [user, year, semester]);

    useEffect(() => {
        if (timetables.length > 0 && activeTimetableId) {
            const target = timetables.find(t => t.id === activeTimetableId);
            setCurrentTimetable(target);
        } else if (timetables.length > 0) {
            setActiveTimetableId(timetables[0].id);
        } else {
            setCurrentTimetable(null);
        }
    }, [activeTimetableId, timetables]);

    const fetchTimetables = async () => {
        try {
            const res = await apiClient.get(`/timetable/my?year=${year}&semester=${encodeURIComponent(semester)}`);
            if (res.data && res.data.length > 0) {
                setTimetables(res.data);
                if (!activeTimetableId) setActiveTimetableId(res.data[0].id);
            } else {
                await createDefaultTimetable();
            }
        } catch (err) {
            console.error("시간표 로드 실패:", err);
        }
    };

    const createDefaultTimetable = async () => {
        try {
            const res = await apiClient.post('/timetable/my', { name: "시간표 1", year, semester });
            setTimetables([res.data]);
            setActiveTimetableId(res.data.id);
        } catch (err) {
            console.error("시간표 생성 실패:", err);
        }
    };
    
    const createNewTimetable = async () => {
        const newName = `시간표 ${timetables.length + 1}`;
        try {
            await apiClient.post('/timetable/my', { name: newName, year, semester });
            fetchTimetables();
        } catch(err) {
            alert("시간표 생성 실패");
        }
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
                    if (id === activeTimetableId) {
                        setActiveTimetableId(newTimetables.length > 0 ? newTimetables[0].id : null);
                    }
                    fetchTimetables(); 
                } catch (err) {
                    console.error("삭제 실패", err);
                    alert("시간표 삭제 중 오류가 발생했습니다.");
                }
                setConfirmModal({ isOpen: false, message: "", onConfirm: null });
            }
        });
    };

    const handleDeleteLecture = async (lectureId) => {
        setConfirmModal({
            isOpen: true,
            message: "강의를 삭제하시겠습니까?",
            onConfirm: async () => {
                try {
                    await apiClient.delete(`/timetable/my/lecture/${lectureId}`);
                    fetchTimetables();
                } catch (err) {
                    console.error("강의 삭제 실패", err);
                }
                setConfirmModal({ isOpen: false, message: "", onConfirm: null });
            }
        });
    };

    const fetchAllLectures = async () => {
        try {
            const res = await apiClient.get('/timetable/lectures'); 
            setAllLectures(res.data);
            buildLectureTree(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const buildLectureTree = (lectures) => {
        const tree = {};
        lectures.forEach(lec => {
            const dept = lec.department || "기타";
            const major = lec.major || "전공 없음";
            
            if (!tree[dept]) tree[dept] = {};
            if (!tree[dept][major]) tree[dept][major] = [];
            tree[dept][major].push(lec);
        });
        setLectureTree(tree);
    };

    const toggleDept = (dept) => {
        setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
    };

    const toggleMajor = (major) => {
        setExpandedMajors(prev => ({ ...prev, [major]: !prev[major] }));
    };

    const handleSearchOpen = () => {
        setIsSearchOpen(true);
        if (allLectures.length === 0) {
            fetchAllLectures();
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        const filtered = allLectures.filter(l => 
            l.courseName.includes(searchQuery) || l.professor.includes(searchQuery)
        );
        setSearchResults(filtered);
    };

    const addLecture = async (lectureId) => {
        if (!activeTimetableId) return;
        try {
            await apiClient.post(`/timetable/my/${activeTimetableId}/lecture`, { lectureId });
            fetchTimetables();
            setIsSearchOpen(false);
        } catch (err) {
            alert("강의 추가 실패");
        }
    };
    
    const handleDirectAdd = async (formData) => {
        if (!activeTimetableId) return;
        try {
            await apiClient.post(`/timetable/my/${activeTimetableId}/custom-lecture`, formData);
            fetchTimetables();
            setIsDirectAddOpen(false);
        } catch (err) {
            alert("직접 추가 실패");
        }
    };

    const handleSaveImage = async () => {
        if (!timetableRef.current) return;

        try {
            const canvas = await html2canvas(timetableRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-html2canvas-target]');
                    if (clonedElement) {
                        clonedElement.style.color = '#000000';
                    }
                }
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `${year}-${semester}-${currentTimetable?.name || 'timetable'}.png`;
            link.click();
        } catch (err) {
            console.error("캡처 실패:", err);
            alert("이미지 저장 중 오류가 발생했습니다. 관리자에게 문의하세요.");
        }
    };
    
    const getLectureClassroom = (lecture) => {
        if (lecture.classroom) return lecture.classroom;
        if (lecture.schedule && lecture.schedule.length > 0 && lecture.schedule[0].classroom) {
            return lecture.schedule[0].classroom;
        }
        return "장소미정";
    };

    const renderTimeGrid = () => {
        const days = ['월', '화', '수', '목', '금'];
        const startHour = 9;
        const hours = Array.from({ length: 14 }, (_, i) => startHour + i);
        const cellHeight = 60;

        const lectureBlocks = [];
        const cyberLectures = [];

        currentTimetable?.lectures?.forEach(lec => {
            if (!lec.schedule || lec.schedule.length === 0 || lec.schedule.some(s => s.day === "사이버" || s.day === "Cyber")) {
                cyberLectures.push(lec);
                return;
            }

            lec.schedule.forEach(item => {
                const dayIndex = days.indexOf(item.day);
                if (dayIndex === -1) return;

                const startPeriod = Math.min(...item.periods);
                const endPeriod = Math.max(...item.periods);
                const duration = endPeriod - startPeriod + 1;
                const top = (startPeriod - 1) * cellHeight;
                const height = duration * cellHeight;
                const left = `${dayIndex * 20}%`;
                
                lectureBlocks.push(
                    <div
                        key={`${lec.id}-${item.day}`}
                        className="absolute w-[20%] p-1 z-10 group"
                        style={{ top: `${top}px`, left: left, height: `${height}px` }}
                    >
                        <div 
                            className="w-full h-full p-2 flex flex-col justify-center overflow-hidden rounded-md border-l-4 relative shadow-sm"
                            style={{ 
                                backgroundColor: lec.color || '#eeeeee', 
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderLeftColor: 'rgba(0,0,0,0.2)',
                                boxShadow: 'none' 
                            }}
                        >
                            <span className="font-bold text-gray-800 text-xs leading-tight mb-1" style={{color: '#1f2937'}}>{lec.courseName}</span>
                            <span className="text-[10px] text-gray-600 block" style={{color: '#4b5563'}}>{lec.professor}</span>
                            <span className="text-[10px] text-gray-600 block" style={{color: '#4b5563'}}>{getLectureClassroom(lec)}</span>
                        
                            <button 
                                data-html2canvas-ignore="true"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLecture(lec.id);
                                }}
                                className="absolute top-1 right-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                );
            });
        });

        return (
            <div className="bg-white" ref={timetableRef} data-html2canvas-target style={{ backgroundColor: '#ffffff' }}>
                <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden select-none" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex border-b bg-gray-50" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                        <div className="w-12 flex-shrink-0 border-r" style={{ borderColor: '#e5e7eb' }}></div>
                        {days.map(day => (
                            <div key={day} className="flex-1 text-center py-2 font-medium text-gray-600 border-r last:border-r-0" style={{ color: '#4b5563', borderColor: '#e5e7eb' }}>
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="flex relative" style={{ height: `${hours.length * cellHeight}px` }}>
                        <div className="w-12 flex-shrink-0 flex flex-col border-r bg-gray-50 text-xs text-gray-400" style={{ backgroundColor: '#f9fafb', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                            {hours.map(h => (
                                <div key={h} className="flex-1 border-b relative" style={{ height: `${cellHeight}px`, borderColor: '#e5e7eb' }}>
                                    <span className="absolute top-1 right-1">{h}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 relative bg-white" style={{ backgroundColor: '#ffffff' }}>
                            {hours.map(h => (
                                <div key={`row-${h}`} className="absolute w-full border-b border-gray-100" style={{ top: `${(h - startHour + 1) * cellHeight}px`, borderColor: '#f3f4f6' }}></div>
                            ))}
                            {[1, 2, 3, 4].map(i => (
                                <div key={`col-${i}`} className="absolute h-full border-r border-gray-100" style={{ left: `${i * 20}%`, borderColor: '#f3f4f6' }}></div>
                            ))}
                            {lectureBlocks}
                        </div>
                    </div>

                    {cyberLectures.length > 0 && (
                        <div className="p-4 border-t bg-gray-50" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                            <h4 className="text-sm font-bold text-gray-600 mb-2" style={{ color: '#4b5563' }}>기타 / 사이버 강의</h4>
                            <div className="flex flex-wrap gap-2">
                                {cyberLectures.map(lec => (
                                    <div key={lec.id} className="bg-white px-3 py-2 rounded border shadow-sm text-sm flex items-center gap-2 group" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                                        <div>
                                            <span className="font-semibold text-gray-700 mr-2" style={{ color: '#374151' }}>{lec.courseName}</span>
                                            <span className="text-gray-500 text-xs" style={{ color: '#6b7280' }}>{lec.professor}</span>
                                        </div>
                                        <button 
                                            data-html2canvas-ignore="true"
                                            onClick={() => handleDeleteLecture(lec.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-white">
             <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div ref={helpRef} className="relative flex justify-center items-center gap-2">
                        <h1 className="text-4xl font-bold text-gray-800">시간표</h1>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <i className="fa-solid fa-circle-question fa-lg"></i>
                        </button>
                        {showHelp && (
                            <div className="absolute top-full mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                <h4 className="font-bold text-md mb-2 text-gray-800">시간표 기능 사용 안내</h4>
                                <ul className="space-y-1.5 text-sm text-gray-600 list-disc list-inside">
                                    <li>좌측 사이드바에서 '새 시간표 만들기'로 여러 개의 시간표를 관리할 수 있습니다.</li>
                                    <li>'수업 목록에서 검색'을 통해 학교에 개설된 실제 강의를 추가할 수 있습니다.</li>
                                    <li>'직접 추가'를 통해 목록에 없는 일정이나 스터디 등을 자유롭게 등록하세요.</li>
                                    <li>'이미지로 저장' 버튼을 누르면 내 시간표를 이미지 파일로 소장할 수 있습니다.</li>
                                </ul>
                                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xl text-gray-600 mt-4">수강신청한 강의들을 등록하고 나만의 시간표를 완성해보세요!</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-64 flex-shrink-0 space-y-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <select 
                                className="w-full p-2 border rounded-md mb-2"
                                value={year} onChange={(e) => setYear(Number(e.target.value))}
                            >
                                <option value={2025}>2025년</option>
                                <option value={2024}>2024년</option>
                            </select>
                            <select 
                                className="w-full p-2 border rounded-md"
                                value={semester} onChange={(e) => setSemester(e.target.value)}
                            >
                                <option value="1학기">1학기</option>
                                <option value="2학기">2학기</option>
                            </select>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <div className="space-y-1">
                                {timetables.map(t => (
                                    <div key={t.id} className="group flex items-center justify-between hover:bg-gray-50 rounded-md pr-2">
                                        <button
                                            onClick={() => setActiveTimetableId(t.id)}
                                            className={`flex-1 text-left px-3 py-2 text-sm ${activeTimetableId === t.id ? 'text-blue-600 font-semibold' : 'text-gray-700'}`}
                                        >
                                            {t.name}
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteTimetable(e, t.id)}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={createNewTimetable} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 mt-2 border-t pt-2">
                                    <i className="fas fa-plus mr-2"></i>새 시간표 만들기
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                             <button onClick={handleSaveImage} className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium flex items-center justify-center">
                                <i className="fas fa-camera mr-2"></i> 이미지로 저장
                            </button>
                        </div>
                    </div>

                    <div className="flex-1">
                        {renderTimeGrid()}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                <button 
                    onClick={() => setIsDirectAddOpen(true)}
                    className="bg-white text-gray-700 shadow-lg p-4 rounded-full hover:bg-gray-50 transition flex items-center gap-2"
                >
                    <i className="fas fa-pen"></i> <span className="text-sm font-semibold">직접 추가</span>
                </button>
                <button 
                    onClick={handleSearchOpen}
                    className="bg-red-500 text-white shadow-lg px-6 py-4 rounded-full hover:bg-red-600 transition flex items-center gap-2"
                >
                    <i className="fas fa-search"></i> <span className="font-semibold">수업 목록에서 검색</span>
                </button>
            </div>

            {isSearchOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <div className="bg-white w-full h-[50vh] rounded-t-2xl p-6 flex flex-col animate-slideUp shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">수업 검색</h3>
                            <button onClick={() => setIsSearchOpen(false)} className="text-gray-500 hover:text-gray-700"><i className="fas fa-times fa-lg"></i></button>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                placeholder="강의명 또는 교수명 검색" 
                                className="flex-1 border rounded-lg px-4 py-2"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded-lg">검색</button>
                        </form>
                        
                        <div className="flex-1 overflow-y-auto">
                            {searchQuery === "" ? (
                                <div className="space-y-2">
                                    {Object.keys(lectureTree).map(dept => (
                                        <div key={dept} className="border rounded-lg overflow-hidden">
                                            <button 
                                                onClick={() => toggleDept(dept)}
                                                className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 font-semibold text-gray-700"
                                            >
                                                <span>{dept}</span>
                                                <i className={`fas fa-chevron-${expandedDepts[dept] ? 'up' : 'down'}`}></i>
                                            </button>
                                            
                                            {expandedDepts[dept] && (
                                                <div className="bg-white border-t">
                                                    {Object.keys(lectureTree[dept]).map(major => (
                                                        <div key={major}>
                                                            <button 
                                                                onClick={() => toggleMajor(major)}
                                                                className="w-full px-6 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center text-gray-600 border-b last:border-b-0"
                                                            >
                                                                <span>{major}</span>
                                                                <i className={`fas fa-chevron-${expandedMajors[major] ? 'up' : 'down'} text-xs`}></i>
                                                            </button>
                                                            
                                                            {expandedMajors[major] && (
                                                                <div className="bg-gray-50 px-6 py-2 space-y-1">
                                                                    {lectureTree[dept][major].map(lecture => (
                                                                        <div key={lecture.id} className="bg-white p-3 rounded border flex justify-between items-center hover:shadow-sm">
                                                                            <div>
                                                                                <div className="font-semibold text-sm text-gray-800">{lecture.courseName}</div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    {lecture.professor} | {getLectureClassroom(lecture)}
                                                                                </div>
                                                                                <div className="text-xs text-gray-400 mt-0.5">
                                                                                    {lecture.schedule?.map(s => `${s.day}${s.periods.join(',')}`).join(' / ')}
                                                                                </div>
                                                                            </div>
                                                                            <button onClick={() => addLecture(lecture.id)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-100">
                                                                                추가
                                                                            </button>
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
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map(lecture => (
                                        <div key={lecture.id} className="border-b py-3 flex justify-between items-center hover:bg-gray-50 px-2">
                                            <div>
                                                <div className="font-semibold text-gray-800">{lecture.courseName}</div>
                                                <div className="text-sm text-gray-500">{lecture.professor} | {getLectureClassroom(lecture)}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {lecture.schedule?.map(s => `${s.day}${s.periods.join(',')}`).join(' / ')}
                                                </div>
                                            </div>
                                            <button onClick={() => addLecture(lecture.id)} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm font-medium">추가</button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && (
                                        <div className="text-center text-gray-400 py-10">검색 결과가 없습니다.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isDirectAddOpen && (
                <DirectAddModal onClose={() => setIsDirectAddOpen(false)} onSubmit={handleDirectAdd} />
            )}
            
            <ConfirmModal 
                isOpen={confirmModal.isOpen} 
                message={confirmModal.message} 
                onConfirm={confirmModal.onConfirm} 
                onCancel={() => setConfirmModal({ isOpen: false, message: "", onConfirm: null })} 
            />
        </div>
    );
}

function DirectAddModal({ onClose, onSubmit }) {
    const [form, setForm] = useState({ courseName: '', professor: '', day: '월', startPeriod: 1, endPeriod: 1, classroom: '' });

    const handleSubmit = () => {
        const periods = [];
        const start = Number(form.startPeriod);
        const end = Number(form.endPeriod);
        
        if(start > end) {
            alert("시작 교시가 종료 교시보다 클 수 없습니다.");
            return;
        }

        for (let i = start; i <= end; i++) periods.push(i);
        
        const data = {
            courseName: form.courseName,
            professor: form.professor,
            schedule: [{ day: form.day, periods, classroom: form.classroom }]
        };
        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
                <h3 className="text-lg font-bold mb-4 text-gray-800">새 수업 추가</h3>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-600">강의 정보</label>
                        <input 
                            placeholder="과목명 (필수)" 
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={form.courseName} 
                            onChange={e => setForm({...form, courseName: e.target.value})} 
                        />
                        <input 
                            placeholder="교수명" 
                            className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={form.professor} 
                            onChange={e => setForm({...form, professor: e.target.value})} 
                        />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 mb-2">시간 및 장소 설정</label>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <select 
                                    className="border border-gray-300 p-2 rounded-md bg-white outline-none focus:border-blue-500" 
                                    value={form.day} 
                                    onChange={e => setForm({...form, day: e.target.value})}
                                >
                                    {['월','화','수','목','금'].map(d => <option key={d} value={d}>{d}요일</option>)}
                                </select>
                                <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-md px-2 py-1">
                                    <input 
                                        type="number" 
                                        min="1" max="14"
                                        className="w-10 text-center outline-none" 
                                        value={form.startPeriod} 
                                        onChange={e => setForm({...form, startPeriod: e.target.value})} 
                                    />
                                    <span className="text-gray-400">~</span>
                                    <input 
                                        type="number" 
                                        min="1" max="14"
                                        className="w-10 text-center outline-none" 
                                        value={form.endPeriod} 
                                        onChange={e => setForm({...form, endPeriod: e.target.value})} 
                                    />
                                    <span className="text-xs text-gray-500">교시</span>
                                </div>
                            </div>
                            <input 
                                placeholder="강의실 (예: 본부303)" 
                                className="w-full border border-gray-300 p-2 rounded-md outline-none focus:border-blue-500" 
                                value={form.classroom} 
                                onChange={e => setForm({...form, classroom: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">취소</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 shadow-md transition">저장</button>
                </div>
            </div>
        </div>
    );
}