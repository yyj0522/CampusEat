"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import '../../styles/style.css';

const Toast = ({ message, show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 2000);
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


export default function InformationPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");
    const [university, setUniversity] = useState("");
    const [activeTab, setActiveTab] = useState("meal");
    const [shuttleData, setShuttleData] = useState([]);
    const [filteredShuttles, setFilteredShuttles] = useState([]);
    const [loadingShuttle, setLoadingShuttle] = useState(true);
    const [dayType, setDayType] = useState("monThu");
    const [showHelp, setShowHelp] = useState(false);
    const helpRef = useRef(null);

    const [showCopyToast, setShowCopyToast] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const docRef = doc(db, "users", currentUser.uid);
                const snap = await getDoc(docRef);
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
        function handleClickOutside(event) {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setShowHelp(false);
            }
        }
        if (showHelp) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showHelp]);

    useEffect(() => {
        if (!university) return;

        const fetchShuttle = async () => {
            setLoadingShuttle(true);
            try {
                const docRef = doc(db, "shuttles", university);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const dataArray = snap.data().data || [];
                    const parsedRoutes = dataArray.flatMap((routeStr) => {
                        try {
                            return JSON.parse(routeStr);
                        } catch (e) {
                            console.error("셔틀 문자열 파싱 오류:", e);
                            return null;
                        }
                    }).filter(Boolean);
                    setShuttleData(parsedRoutes);
                } else {
                    console.log("해당 대학 셔틀 정보가 없습니다.");
                    setShuttleData([]);
                }
            } catch (error) {
                console.error("셔틀 정보 로드 오류:", error);
                setShuttleData([]);
            } finally {
                setLoadingShuttle(false);
            }
        };
        fetchShuttle();
    }, [university]);

    useEffect(() => {
        const filtered = shuttleData.filter((route) => {
            if (!route || !route.route_name) return false;

            const routeName = route.route_name;
            
            if (dayType === "monThu") {
                return routeName === "두정역 ↔ 캠퍼스(등교)" || routeName === "캠퍼스 ↔ 두정역(하교)(월~목)";
            } else if (dayType === "fri") {
                return routeName === "두정역 ↔ 캠퍼스(등교)" || routeName === "캠퍼스 ↔ 두정역(하교)(금)";
            }
            return false;
        });
        setFilteredShuttles(filtered);
    }, [shuttleData, dayType]);

    const handleCopyEmail = () => {
        const email = "projectc029@gmail.com";
        navigator.clipboard.writeText(email).then(() => {
            setShowCopyToast(true);
        }).catch(err => {
            console.error('이메일 복사 실패:', err);
        });
    };

    const renderShuttleCards = () => {
        if (loadingShuttle) {
            return <p className="text-center py-16">셔틀 정보 로딩중...</p>;
        }
        if (filteredShuttles.length === 0) {
            return (
                <div className="text-center py-16">
                    <i className="fas fa-bus text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">운행 정보가 없습니다</h3>
                    <p className="text-gray-500">선택한 조건에 해당하는 셔틀버스 운행 정보가 없습니다.</p>
                </div>
            );
        }

        const routeGroups = filteredShuttles.reduce((groups, route) => {
            const key = route.route_name;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(route);
            return groups;
        }, {});

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(routeGroups).map(([routeName, schedules], idx) => {
                    const sortedTimes = schedules[0].times.sort((a, b) => a.localeCompare(b));
                    
                    const now = new Date();
                    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
                    let nextShuttleTime = null;

                    for (const time of sortedTimes) {
                        const [hour, minute] = time.split(':').map(Number);
                        const shuttleTimeInMinutes = hour * 60 + minute;
                        if (shuttleTimeInMinutes > currentTimeInMinutes) {
                            nextShuttleTime = time;
                            break;
                        }
                    }

                    return (
                        <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4">
                                <h3 className="font-semibold text-lg flex items-center justify-between">
                                    <span>{routeName}</span>
                                </h3>
                                <p className="text-sm opacity-90 mt-1">총 {sortedTimes.length}회 운행</p>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                    {sortedTimes.map((time, timeIdx) => {
                                        const [hour, minute] = time.split(':').map(Number);
                                        const isPast = (hour * 60 + minute) <= currentTimeInMinutes;
                                        const isNext = time === nextShuttleTime;
                                        
                                        return (
                                            <div
                                                key={timeIdx}
                                                className={`text-center p-2 rounded-lg border ${
                                                    isPast ? 'bg-gray-100 text-gray-400' : isNext ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="text-sm">{time}</div>
                                                {isNext && <div className="text-xs text-blue-500 mt-1">다음차</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                                    <div className="flex items-center justify-between">
                                        <span>
                                            <i className="fas fa-map-marker-alt mr-1 text-green-500"></i>
                                            출발: {schedules[0].departure_location}
                                        </span>
                                        <span>
                                            <i className="fas fa-flag-checkered mr-1 text-red-500"></i>
                                            도착: {schedules[0].arrival_location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div ref={helpRef} className="relative flex justify-center items-center gap-2">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">학식 & 셔틀</h1>
                        <button onClick={() => setShowHelp(!showHelp)} className="text-gray-400 hover:text-gray-600 mb-2 transition-colors">
                            <i className="fa-solid fa-circle-question fa-lg"></i>
                        </button>
                        {showHelp && (
                            <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-left z-20 animate-fadeIn">
                                <h4 className="font-bold text-md mb-2 text-gray-800">정보 추가/수정 안내</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                    우리 학교 학식 또는 셔틀/통학버스 정보가 없거나 다른가요?
                                </p>
                                <p className="text-sm text-gray-600">
                                    아래 이메일로 정확한 정보를 보내주시면, 사실 여부 확인 후 신속하게 반영하겠습니다.
                                </p>
                                <div className="mt-3 text-sm font-semibold text-blue-600 bg-blue-50 p-2 rounded-md flex items-center justify-between">
                                    <span>projectc029@gmail.com</span>
                                    <button onClick={handleCopyEmail} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-md">
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                                <button onClick={() => setShowHelp(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                                    <i className="fa-solid fa-times"></i>
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-xl text-gray-600">
                        {university
                            ? `${university} 학식 메뉴와 셔틀버스 시간표를 한눈에 확인하세요`
                            : "학식 메뉴와 셔틀버스 시간표를 한눈에 확인하세요"}
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <div className="bg-white rounded-lg p-1 shadow-sm flex space-x-1">
                        <button
                            className={`px-6 py-3 rounded-md font-medium transition ${
                                activeTab === "meal"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500 hover:bg-gray-100"
                            }`}
                            onClick={() => setActiveTab("meal")}
                        >
                            <i className="fas fa-utensils mr-2"></i>
                            학식 메뉴
                        </button>
                        <button
                            className={`px-6 py-3 rounded-md font-medium transition ${
                                activeTab === "shuttle"
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-500 hover:bg-gray-100"
                            }`}
                            onClick={() => setActiveTab("shuttle")}
                        >
                            <i className="fas fa-bus mr-2"></i>
                            셔틀 시간표
                        </button>
                    </div>
                </div>

                {activeTab === "meal" && (
                    <div>
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-center">
                            <h2 className="text-xl font-semibold mb-4 md:mb-0">학식 메뉴</h2>
                            <div className="flex items-center space-x-4">
                                <button className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition">◀</button>
                                <span className="font-medium text-gray-700">이번 주</span>
                                <button className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition">▶</button>
                            </div>
                        </div>
                        <p className="text-gray-500 text-center py-16 bg-white rounded-xl shadow-sm">학식 데이터가 비어 있습니다.</p>
                    </div>
                )}

                {activeTab === "shuttle" && (
                    <div>
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-center">
                            <h2 className="text-xl font-semibold mb-4 md:mb-0">셔틀버스 시간표</h2>
                            <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={dayType}
                                onChange={(e) => setDayType(e.target.value)}
                            >
                                <option value="monThu">월~목</option>
                                <option value="fri">금</option>
                            </select>
                        </div>
                        {renderShuttleCards()}
                    </div>
                )}

                <Toast message="이메일 주소가 복사되었습니다." show={showCopyToast} onClose={() => setShowCopyToast(false)} />
            </div>
        </div>
    );
}