"use client";

import { forwardRef } from "react";

const TimetableGrid = forwardRef(({ currentTimetable, onDeleteLecture, onLectureClick }, ref) => {
    
    const getLectureClassroom = (lecture) => {
        if (lecture.classroom) return lecture.classroom;
        if (lecture.schedule && lecture.schedule.length > 0) return lecture.schedule[0].classroom;
        return "장소미정";
    };

    const days = ['월', '화', '수', '목', '금'];
    const startHour = 9;
    const hours = Array.from({ length: 14 }, (_, i) => startHour + i);
    const cellHeight = 90;

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
                    className="absolute w-[20%] p-1 z-10 group cursor-pointer"
                    style={{ top: `${top}px`, left: left, height: `${height}px` }}
                    onClick={() => onLectureClick(lec)}
                >
                    <div className="w-full h-full p-2 flex flex-col justify-center overflow-hidden rounded-md border-l-4 relative shadow-sm hover:brightness-95 transition"
                        style={{ backgroundColor: lec.color || '#eeeeee', borderColor: 'rgba(0,0,0,0.1)', borderLeftColor: 'rgba(0,0,0,0.2)' }}>
                        <span className="font-bold text-xs leading-tight mb-1" style={{color: '#1f2937'}}>{lec.courseName}</span>
                        <span className="text-[10px] block" style={{color: '#4b5563'}}>{lec.professor}</span>
                        <span className="text-[10px] block" style={{color: '#4b5563'}}>{getLectureClassroom(lec)}</span>
                        <button 
                            data-html2canvas-ignore="true"
                            onClick={(e) => { e.stopPropagation(); onDeleteLecture(lec.id); }}
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
        <div className="bg-white w-full h-auto" ref={ref} data-html2canvas-target style={{ backgroundColor: '#ffffff' }}>
            <div className="relative bg-white border border-gray-200 rounded-lg select-none h-auto flex flex-col" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex border-b bg-gray-50" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                    <div className="w-12 flex-shrink-0 border-r" style={{ borderColor: '#e5e7eb' }}></div>
                    {days.map(day => (
                        <div key={day} className="flex-1 text-center py-2 font-medium border-r last:border-r-0" style={{ color: '#4b5563', borderColor: '#e5e7eb' }}>
                            {day}
                        </div>
                    ))}
                </div>
                <div className="flex relative w-full" style={{ height: `${hours.length * cellHeight}px` }}>
                    <div className="w-12 flex-shrink-0 flex flex-col border-r bg-gray-50 text-xs" style={{ backgroundColor: '#f9fafb', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                        {hours.map(h => (
                            <div key={h} className="flex-1 border-b relative" style={{ height: `${cellHeight}px`, borderColor: '#e5e7eb' }}>
                                <span className="absolute top-1 right-1">{h}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 relative bg-white h-full" style={{ backgroundColor: '#ffffff' }}>
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
                        <h4 className="text-sm font-bold mb-2" style={{ color: '#4b5563' }}>기타 / 사이버 강의</h4>
                        <div className="flex flex-wrap gap-2">
                            {cyberLectures.map(lec => (
                                <div key={lec.id} onClick={() => onLectureClick(lec)} className="bg-white px-3 py-2 rounded border shadow-sm text-sm flex items-center gap-2 group cursor-pointer" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                                    <div>
                                        <span className="font-semibold mr-2" style={{ color: '#374151' }}>{lec.courseName}</span>
                                        <span className="text-xs" style={{ color: '#6b7280' }}>{lec.professor}</span>
                                    </div>
                                    <button 
                                        data-html2canvas-ignore="true"
                                        onClick={(e) => { e.stopPropagation(); onDeleteLecture(lec.id); }}
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
});

TimetableGrid.displayName = "TimetableGrid";

export default TimetableGrid;