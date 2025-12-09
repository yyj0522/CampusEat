"use client";
import { useState, useEffect } from "react";

export default function AutoScheduleModal({ isOpen, onClose, onGenerate, departments }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [config, setConfig] = useState({
        targetDepartment: '',
        majorCount: 0,
        geCount: 0,
        minCredits: 14,
        maxCredits: 18,
        preferredDays: [],
        avoidLunch: false,
        includeCyber: false
    });

    const [results, setResults] = useState([]);

    const days = ['월', '화', '수', '목', '금'];

    useEffect(() => {
        if(isOpen) {
            setStep(1);
            setResults([]);
            setConfig(prev => ({...prev, preferredDays: []}));
        }
    }, [isOpen]);

    const handleDayToggle = (day) => {
        setConfig(prev => {
            const current = prev.preferredDays;
            if (current.includes(day)) return { ...prev, preferredDays: current.filter(d => d !== day) };
            return { ...prev, preferredDays: [...current, day] };
        });
    };

    const handleGenerate = async () => {
        if (!config.targetDepartment) {
            alert("학부를 선택해주세요.");
            return;
        }
        if (config.preferredDays.length === 0) {
            alert("최소 하루 이상의 요일을 선택해주세요.");
            return;
        }
        if (Number(config.minCredits) > Number(config.maxCredits)) {
            alert("최소 학점이 최대 학점보다 클 수 없습니다.");
            return;
        }

        setLoading(true);
        try {
            const data = await onGenerate(config);
            if (data && data.combinations && data.combinations.length > 0) {
                setResults(data.combinations);
                setStep(2);
            } else {
                alert("조건에 맞는 시간표 조합을 찾을 수 없습니다.\n조건을 조금 더 완화해보세요.");
            }
        } catch (e) {
            console.error(e);
            alert("생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (lectures) => {
        onClose(lectures); 
    };

    const renderResults = () => {
        const grouped = {};
        results.forEach(combo => {
            const total = combo.reduce((acc, l) => acc + (Number(l.credits)||0), 0);
            if(!grouped[total]) grouped[total] = [];
            grouped[total].push(combo);
        });
        
        const sortedCredits = Object.keys(grouped).sort((a,b) => Number(a) - Number(b));

        return sortedCredits.map(credit => (
            <div key={credit} className="mb-8">
                <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <span className="bg-red-500 text-white py-1 px-3 rounded-full text-sm shadow-sm">+{credit}학점</span>
                    <span className="text-gray-500 text-sm font-normal">조합 결과</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {grouped[credit].map((combo, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:border-red-400 hover:shadow-lg transition-all cursor-pointer group bg-white flex flex-col justify-between h-full" onClick={() => handleApply(combo)}>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded text-xs">옵션 {idx + 1}</span>
                                    <span className="text-xs font-bold text-red-500">{combo.length}과목 추가</span>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {combo.map((lec, lIdx) => (
                                        <div key={lIdx} className="text-sm flex justify-between items-start text-gray-700 bg-gray-50 p-2 rounded-lg">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="font-semibold truncate">{lec.courseName}</div>
                                                <div className="text-xs text-gray-500 truncate">{lec.professor}</div>
                                            </div>
                                            <span className="text-xs font-medium text-gray-400 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border">
                                                {lec.schedule?.[0]?.day || '사이버'}{lec.schedule?.[0]?.periods?.join(',')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-3 border-t mt-auto text-center">
                                <span className="text-blue-500 font-bold text-sm group-hover:text-blue-600 flex items-center justify-center gap-1">
                                    이 조합 적용하기 <i className="fas fa-check-circle"></i>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className={`bg-white rounded-2xl w-full shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh] transition-all duration-300 ease-in-out ${step === 1 ? 'max-w-lg' : 'max-w-7xl'}`}>
                <div className="p-5 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                            {step === 1 ? (
                                <>
                                    <i className="fas fa-magic text-orange-500"></i> 시간표 자동 완성
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-list-check text-blue-500"></i> 추천 결과 확인
                                </>
                            )}
                        </h3>
                        {step === 1 && <p className="text-xs text-gray-500 mt-1 pl-1">공강 최소화 & 최적의 시간표를 찾아드려요</p>}
                    </div>
                    <button onClick={() => onClose(null)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">1</span>
                                    학부 선택
                                </label>
                                <select 
                                    className="w-full border-gray-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-200 bg-white shadow-sm transition-all"
                                    value={config.targetDepartment}
                                    onChange={(e) => setConfig({ ...config, targetDepartment: e.target.value })}
                                >
                                    <option value="">학부를 선택하세요</option>
                                    {departments.filter(d => d !== '교양').map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">2</span>
                                        희망 전공 수
                                    </label>
                                    <input type="number" min="0" max="10" 
                                        className="w-full border-gray-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-200 bg-white text-center font-bold text-gray-700 shadow-sm"
                                        value={config.majorCount}
                                        onChange={(e) => setConfig({ ...config, majorCount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">3</span>
                                        희망 교양 수
                                    </label>
                                    <input type="number" min="0" max="10" 
                                        className="w-full border-gray-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-red-200 bg-white text-center font-bold text-gray-700 shadow-sm"
                                        value={config.geCount}
                                        onChange={(e) => setConfig({ ...config, geCount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">4</span>
                                    목표 학점 범위
                                </label>
                                <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex-1 text-center">
                                        <input type="number" min="7" max="24"
                                            className="w-full bg-gray-50 border p-2 rounded-lg text-center font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                                            value={config.minCredits}
                                            onChange={(e) => setConfig({ ...config, minCredits: Number(e.target.value) })}
                                        />
                                        <span className="text-xs text-gray-400 mt-1 block">최소 학점</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-gray-300">
                                        <div className="w-8 h-0.5 bg-gray-200"></div>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <input type="number" min="7" max="24"
                                            className="w-full bg-gray-50 border p-2 rounded-lg text-center font-bold outline-none focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
                                            value={config.maxCredits}
                                            onChange={(e) => setConfig({ ...config, maxCredits: Number(e.target.value) })}
                                        />
                                        <span className="text-xs text-gray-400 mt-1 block">최대 학점</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">5</span>
                                    수업 가능한 요일
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {days.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => handleDayToggle(day)}
                                            className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all shadow-sm min-w-[50px] ${
                                                config.preferredDays.includes(day)
                                                    ? "bg-gray-800 text-white transform scale-105"
                                                    : "bg-white border text-gray-400 hover:bg-gray-50"
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                    <span className="bg-gradient-to-br from-red-400 to-red-600 text-white w-6 h-6 flex items-center justify-center rounded-lg text-xs shadow-sm">6</span>
                                    추가 옵션
                                </label>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${config.avoidLunch ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={config.avoidLunch} onChange={(e) => setConfig({...config, avoidLunch: e.target.checked})} />
                                        <i className="fas fa-utensils"></i> 점심시간 비우기
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${config.includeCyber ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={config.includeCyber} onChange={(e) => setConfig({...config, includeCyber: e.target.checked})} />
                                        <i className="fas fa-laptop"></i> 사이버강의 포함
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                           {renderResults()}
                        </div>
                    )}
                </div>

                <div className="p-5 border-t bg-white flex-shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    {step === 1 ? (
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex justify-center items-center gap-2 transform active:scale-95"
                        >
                            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                            {loading ? "최적의 시간표 계산 중..." : "시간표 생성하기"}
                        </button>
                    ) : (
                        <button onClick={() => setStep(1)} className="w-full py-4 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm transition-all">
                            <i className="fas fa-arrow-left mr-2"></i>조건 다시 설정하기
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}