"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

const Toast = ({ message, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"><i className="fas fa-info-circle"></i>{message}</div></div>;
};

const LoadingModal = ({ isOpen, message, progress }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]">
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl animate-scale-up border border-gray-100">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-800 font-bold mb-2">{message}</p>
                {progress !== null && (
                    <div className="w-64">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="text-center">
                            <span className="text-xs text-gray-500 font-medium">{Math.round(progress)}% 완료</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const availableParsers = [ { id: 'baekseok-major', name: '백석대학교 (전체)' } ];
const availableScrapers = [ { id: 'eulji-general', name: '을지대학교 (전체)' } ];
const availableDynamicScrapers = [ { id: 'gachon-general', name: '가천대학교 (전체)' } ];

export default function TimetableAdminPage() {
    const [activeTab, setActiveTab] = useState('pdf');
    
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('파일을 선택하세요');
    
    const [selectedPdfParser, setSelectedPdfParser] = useState(availableParsers[0]);
    const [pdfParserSearch, setPdfParserSearch] = useState(availableParsers[0].name);
    const [showPdfParserList, setShowPdfParserList] = useState(false);
    const [filteredPdfParsers, setFilteredPdfParsers] = useState(availableParsers);
    
    const [selectedScraper, setSelectedScraper] = useState(availableScrapers[0]);
    const [scraperSearch, setScraperSearch] = useState(availableScrapers[0].name);
    const [scrapeUrl, setScrapeUrl] = useState('');
    const [showScraperList, setShowScraperList] = useState(false);
    const [filteredScrapers, setFilteredScrapers] = useState(availableScrapers);

    const [selectedDynamicScraper, setSelectedDynamicScraper] = useState(availableDynamicScrapers[0]);
    const [dynamicScraperSearch, setDynamicScraperSearch] = useState(availableDynamicScrapers[0].name);
    const [dynamicScrapeUrl, setDynamicScrapeUrl] = useState('');
    const [showDynamicScraperList, setShowDynamicScraperList] = useState(false);
    const [filteredDynamicScrapers, setFilteredDynamicScrapers] = useState(availableDynamicScrapers);

    const [year, setYear] = useState('2025');
    const [semester, setSemester] = useState('1학기');

    const [previewText, setPreviewText] = useState('');
    const [lectureCount, setLectureCount] = useState(0);

    const [validationIssues, setValidationIssues] = useState([]);
    const [currentIssueIndex, setCurrentIssueIndex] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [progress, setProgress] = useState(null);
    const [toast, setToast] = useState({ show: false, message: "" });

    const [searchText, setSearchText] = useState('');
    const [searchMatches, setSearchMatches] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const textareaRef = useRef(null);
    const pdfSearchDropdownRef = useRef(null);
    const scraperSearchDropdownRef = useRef(null);
    const dynamicScraperSearchDropdownRef = useRef(null);

    const showToast = (msg) => setToast({ show: true, message: msg });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pdfSearchDropdownRef.current && !pdfSearchDropdownRef.current.contains(event.target)) {
                setShowPdfParserList(false);
            }
            if (scraperSearchDropdownRef.current && !scraperSearchDropdownRef.current.contains(event.target)) {
                setShowScraperList(false);
            }
            if (dynamicScraperSearchDropdownRef.current && !dynamicScraperSearchDropdownRef.current.contains(event.target)) {
                setShowDynamicScraperList(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        if (selectedFile) {
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const resetSearch = () => {
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
    };

    const resetPreview = () => {
        setPreviewText('');
        setLectureCount(0);
        setValidationIssues([]);
        setCurrentIssueIndex(0);
        resetSearch();
    };

    const runStrictValidation = (lectures, backendValidation) => {
        const issues = [];
        lectures.forEach((lec, index) => {
            const addError = (field, msg) => {
                issues.push({
                    index,
                    courseCode: lec.courseCode,
                    courseName: lec.courseName,
                    field,
                    message: msg,
                    type: 'CLIENT_STRICT'
                });
            };

            if (!/^[a-zA-Z0-9]+$/.test(lec.courseCode)) {
                addError('courseCode', `과목코드 특수문자 포함 불가: ${lec.courseCode}`);
            }

            if (/[!@#$%^&*=+{}[\]:;"'<>?,.~]/.test(lec.courseName)) {
                addError('courseName', `강의명 특수문자 포함 불가: ${lec.courseName}`);
            }

            if (lec.hours >= 10 || !/^\d+$/.test(String(lec.hours))) {
                addError('hours', `시수 오류 (두자리 불가, 숫자만): ${lec.hours}`);
            }

            if (lec.credits >= 10 || !/^\d+$/.test(String(lec.credits))) {
                addError('credits', `학점 오류 (두자리 불가, 숫자만): ${lec.credits}`);
            }

            if (!/^\d+$/.test(String(lec.capacity))) {
                addError('capacity', `정원 오류 (숫자만 가능): ${lec.capacity}`);
            }

            if (!/^[a-zA-Z가-힣\s]+$/.test(lec.professor)) {
                addError('professor', `교수명 오류 (한글/영어만 가능): ${lec.professor}`);
            }

            const isCyber = lec.classroom?.includes('사이버') || lec.classroom?.includes('Cyber') || lec.schedule?.some(s => s.day === '사이버' || s.day === 'Cyber');
            if (!isCyber) {
                if (!lec.schedule || lec.schedule.length === 0) {
                    addError('schedule', '시간표 데이터 누락 (사이버 강의 아님)');
                } else {
                    const hasEmptyPeriod = lec.schedule.some(s => !s.periods || s.periods.length === 0);
                    if (hasEmptyPeriod) {
                        addError('schedule', '시간표 교시 데이터 누락');
                    }
                }
            }
        });

        if (backendValidation && backendValidation.issues) {
            backendValidation.issues.forEach(issue => {
                issues.push({
                    index: issue.lectureIndex,
                    courseCode: issue.courseName, 
                    field: issue.field,
                    message: `[Server/AI] ${issue.message}`,
                    type: issue.type
                });
            });
        }
        return issues;
    };

    const processResponseData = (apiResponse) => {
        const rawData = apiResponse.data || apiResponse; 
        const backendValidation = apiResponse.validation || null;

        if (!rawData || !rawData.lectures) {
            throw new Error('데이터 형식이 올바르지 않습니다.');
        }

        const strictIssues = runStrictValidation(rawData.lectures, backendValidation);

        setPreviewText(JSON.stringify(rawData, null, 2));
        setLectureCount(rawData.lectures.length);
        setValidationIssues(strictIssues);
        
        if (strictIssues.length > 0) {
            showToast(`총 ${rawData.lectures.length}개 중 ${strictIssues.length}건의 오류 의심이 발견되었습니다.`);
        } else {
            showToast(`분석 완료: ${rawData.lectures.length}개 강의 정상 추출.`);
        }
    };

    const handlePreview = async () => {
        if (!file) {
            showToast('PDF 파일을 선택하세요.');
            return;
        }
        if (!selectedPdfParser) {
            showToast('대학/유형을 선택하세요.');
            return;
        }

        setLoadingMessage('AI가 PDF를 분석 및 검증 중입니다...');
        setIsLoading(true);
        setProgress(null);
        resetPreview();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', year);
        formData.append('semester', semester);
        formData.append('universityId', selectedPdfParser.id);
        formData.append('useAi', 'true');

        try {
            const response = await fetch('https://api.campuseat.shop/api/timetable/preview/pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '미리보기 생성에 실패했습니다.');
            }

            processResponseData(data);
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!previewText) {
            showToast('먼저 미리보기를 실행해주세요.');
            return;
        }

        if (validationIssues.length > 0) {
            if (!confirm(`${validationIssues.length}건의 오류 의심 데이터가 있습니다. 무시하고 저장하시겠습니까?`)) {
                return;
            }
        }

        setLoadingMessage('데이터 저장 준비 중...');
        setIsLoading(true);
        setProgress(0);

        let dataToSave;
        try {
            dataToSave = JSON.parse(previewText);
        } catch {
            showToast(`오류: JSON 형식이 올바르지 않습니다.`);
            setIsLoading(false);
            return;
        }

        const lectures = dataToSave.lectures;
        const totalLectures = lectures.length;
        const chunkSize = 500;
        let savedCount = 0;

        try {
            for (let i = 0; i < totalLectures; i += chunkSize) {
                const chunk = lectures.slice(i, i + chunkSize);
                
                const payload = {
                    ...dataToSave,
                    lectures: chunk
                };

                setLoadingMessage(`${i + 1} ~ ${Math.min(i + chunkSize, totalLectures)}번째 강의 저장 중...`);
                
                const response = await fetch('https://api.campuseat.shop/api/timetable/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || '중간 저장 실패');
                }

                savedCount += chunk.length;
                setProgress((savedCount / totalLectures) * 100);
            }

            showToast(`모두 저장 완료: 총 ${savedCount}개의 강의가 저장되었습니다.`);
            
            resetPreview();
            setFile(null);
            setFileName('파일을 선택하세요');
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    };

    const handleScrapePreview = async () => {
        if (!scrapeUrl) {
            showToast('스크래핑할 URL을 입력하세요.');
            return;
        }
        if (!selectedScraper) {
            showToast('대학/유형을 선택하세요.');
            return;
        }
        
        setLoadingMessage('웹 스크래핑 및 검증을 시작합니다...');
        setIsLoading(true);
        setProgress(null);
        resetPreview();

        try {
            const response = await fetch('https://api.campuseat.shop/api/timetable/preview/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: scrapeUrl,
                    year: year,
                    semester: semester,
                    universityId: selectedScraper.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '스크래핑에 실패했습니다.');
            }

            processResponseData(data);
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDynamicScrapePreview = async () => {
        if (!dynamicScrapeUrl) {
            showToast('스크래핑할 URL을 입력하세요.');
            return;
        }
        if (!selectedDynamicScraper) {
            showToast('대학/유형을 선택하세요.');
            return;
        }
        
        setLoadingMessage('동적 웹 스크래핑(대용량) 시작... 잠시만 기다려주세요.');
        setIsLoading(true);
        setProgress(null);
        resetPreview();

        try {
            const response = await fetch('https://api.campuseat.shop/api/timetable/preview/scrape-dynamic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: dynamicScrapeUrl,
                    year: year,
                    semester: semester,
                    universityId: selectedDynamicScraper.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '동적 스크래핑에 실패했습니다.');
            }

            processResponseData(data);
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToMatch = useCallback((index, matches) => {
        if (!textareaRef.current || !matches || matches.length === 0) return;

        const textarea = textareaRef.current;
        const startIndex = matches[index];
        const endIndex = startIndex + searchText.length;

        textarea.focus();
        textarea.setSelectionRange(startIndex, endIndex);
        
        const textBefore = textarea.value.substring(0, startIndex);
        const lines = textBefore.split('\n').length;
        const avgLineHeight = 16; 
        textarea.scrollTop = (lines - 10) * avgLineHeight; 

        setCurrentMatchIndex(index);
    }, [searchText]);
    
    const handleSearch = () => {
        if (!searchText || !textareaRef.current) {
            resetSearch();
            return;
        }

        const text = previewText;
        const query = searchText;
        const matches = [];
        let index = text.indexOf(query);
        while (index !== -1) {
            matches.push(index);
            index = text.indexOf(query, index + 1);
        }

        setSearchMatches(matches);

        if (matches.length > 0) {
            navigateToMatch(0, matches);
        } else {
            showToast('텍스트를 찾을 수 없습니다.');
            setCurrentMatchIndex(-1);
        }
    };

    const handleNextMatch = () => {
        if (searchMatches.length === 0) return;
        const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
        navigateToMatch(nextIndex, searchMatches);
    };

    const handlePrevMatch = () => {
        if (searchMatches.length === 0) return;
        const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
        navigateToMatch(prevIndex, searchMatches);
    };

    const handleSearchTextChange = (e) => {
        setSearchText(e.target.value);
        resetSearch();
    };
    
    const handlePreviewTextChange = (e) => {
        setPreviewText(e.target.value);
        resetSearch();
    };

    const handleJumpToIssue = (direction) => {
        if (validationIssues.length === 0) return;

        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIssueIndex + 1) % validationIssues.length;
        } else {
            newIndex = (currentIssueIndex - 1 + validationIssues.length) % validationIssues.length;
        }

        setCurrentIssueIndex(newIndex);
        const issue = validationIssues[newIndex];
        
        setSearchText(issue.courseCode);
        showToast(`이동: ${issue.message} (${newIndex + 1}/${validationIssues.length})`);
    };

    useEffect(() => {
        if (searchText && previewText) {
             const text = previewText;
             const query = searchText;
             const matches = [];
             let index = text.indexOf(query);
             while (index !== -1) {
                 matches.push(index);
                 index = text.indexOf(query, index + 1);
             }
             setSearchMatches(matches);
             if (matches.length > 0) {
                 navigateToMatch(0, matches);
             }
        }
    }, [searchText, previewText, navigateToMatch]);

    const handlePdfParserSearchChange = (e) => {
        const query = e.target.value;
        setPdfParserSearch(query);
        setSelectedPdfParser(null);
        if (query) {
            setFilteredPdfParsers(
                availableParsers.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase())
                )
            );
            setShowPdfParserList(true);
        } else {
            setFilteredPdfParsers(availableParsers);
            setShowPdfParserList(true);
        }
    };

    const handlePdfParserSelect = (parser) => {
        setSelectedPdfParser(parser);
        setPdfParserSearch(parser.name);
        setShowPdfParserList(false);
    };
    
    const handleScraperSearchChange = (e) => {
        const query = e.target.value;
        setScraperSearch(query);
        setSelectedScraper(null);
        if (query) {
            setFilteredScrapers(
                availableScrapers.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase())
                )
            );
            setShowScraperList(true);
        } else {
            setFilteredScrapers(availableScrapers);
            setShowScraperList(true);
        }
    };

    const handleScraperSelect = (scraper) => {
        setSelectedScraper(scraper);
        setScraperSearch(scraper.name);
        setShowScraperList(false);
    };
    
    const handleDynamicScraperSearchChange = (e) => {
        const query = e.target.value;
        setDynamicScraperSearch(query);
        setSelectedDynamicScraper(null);
        if (query) {
            setFilteredDynamicScrapers(
                availableDynamicScrapers.filter(p => 
                    p.name.toLowerCase().includes(query.toLowerCase())
                )
            );
            setShowDynamicScraperList(true);
        } else {
            setFilteredDynamicScrapers(availableDynamicScrapers);
            setShowDynamicScraperList(true);
        }
    };

    const handleDynamicScraperSelect = (scraper) => {
        setSelectedDynamicScraper(scraper);
        setDynamicScraperSearch(scraper.name);
        setShowDynamicScraperList(false);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">시간표 데이터 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">PDF 파싱 또는 웹 스크래핑을 통해 시간표 데이터를 DB에 적재합니다.</p>
                </div>
                <div className="bg-gray-100 p-1 rounded-xl flex overflow-x-auto max-w-full">
                    {[{id:'pdf', name:'PDF 업로드'}, {id:'scrape', name:'정적 스크래핑'}, {id:'scrape-dynamic', name:'동적 스크래핑'}].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); resetPreview(); }} 
                            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>
                        데이터 소스 설정
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">대상 대학교</label>
                            {activeTab === 'pdf' && (
                                <div className="relative" ref={pdfSearchDropdownRef}>
                                    <input 
                                        type="text" value={pdfParserSearch} 
                                        onChange={handlePdfParserSearchChange}
                                        onFocus={() => setShowPdfParserList(true)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-all"
                                        placeholder="대학 검색..."
                                    />
                                    {showPdfParserList && filteredPdfParsers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {filteredPdfParsers.map((parser) => (
                                                <div key={parser.id} onClick={() => handlePdfParserSelect(parser)} className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none">
                                                    {parser.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'scrape' && (
                                <div className="relative" ref={scraperSearchDropdownRef}>
                                    <input 
                                        type="text" value={scraperSearch} 
                                        onChange={handleScraperSearchChange}
                                        onFocus={() => setShowScraperList(true)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-all"
                                        placeholder="대학 검색..."
                                    />
                                    {showScraperList && filteredScrapers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {filteredScrapers.map((scraper) => (
                                                <div key={scraper.id} onClick={() => handleScraperSelect(scraper)} className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none">
                                                    {scraper.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {activeTab === 'scrape-dynamic' && (
                                <div className="relative" ref={dynamicScraperSearchDropdownRef}>
                                    <input 
                                        type="text" value={dynamicScraperSearch} 
                                        onChange={handleDynamicScraperSearchChange}
                                        onFocus={() => setShowDynamicScraperList(true)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-all"
                                        placeholder="대학 검색..."
                                    />
                                    {showDynamicScraperList && filteredDynamicScrapers.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {filteredDynamicScrapers.map((scraper) => (
                                                <div key={scraper.id} onClick={() => handleDynamicScraperSelect(scraper)} className="p-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-none">
                                                    {scraper.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">학기 정보</label>
                            <div className="flex gap-2">
                                <select value={year} onChange={e => setYear(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                                    <option value="2025">2025년</option>
                                    <option value="2026">2026년</option>
                                    <option value="2027">2027년</option>
                                    <option value="2028">2028년</option>
                                    <option value="2029">2029년</option>
                                    <option value="2030">2030년</option>
                                </select>
                                <select value={semester} onChange={e => setSemester(e.target.value)} className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none">
                                    <option value="1학기">1학기</option>
                                    <option value="2학기">2학기</option>
                                    <option value="여름계절">여름계절</option>
                                    <option value="겨울계절">겨울계절</option>
                                </select>
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">
                                {activeTab === 'pdf' ? 'PDF 파일' : '대상 URL'}
                            </label>
                            {activeTab === 'pdf' ? (
                                <div className="flex items-center gap-3">
                                    <label htmlFor="file-upload" className="flex-1 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 cursor-pointer hover:bg-gray-100 transition flex items-center justify-center gap-2">
                                        <i className="fas fa-file-pdf"></i> {fileName}
                                    </label>
                                    <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                                </div>
                            ) : (
                                <input 
                                    type="text" 
                                    value={activeTab === 'scrape' ? scrapeUrl : dynamicScrapeUrl}
                                    onChange={e => activeTab === 'scrape' ? setScrapeUrl(e.target.value) : setDynamicScrapeUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-all"
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button 
                            onClick={activeTab === 'pdf' ? handlePreview : (activeTab === 'scrape' ? handleScrapePreview : handleDynamicScrapePreview)}
                            disabled={isLoading}
                            className="px-8 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition transform active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            분석 및 미리보기
                        </button>
                    </div>
                </div>

                {previewText && (
                    <div className="animate-fade-in-up border-t border-gray-100 pt-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
                            데이터 검수 및 저장
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
                                <span className="text-sm font-bold text-blue-800">추출된 강의 수</span>
                                <span className="text-2xl font-extrabold text-blue-900">{lectureCount}개</span>
                            </div>

                            <div className={`p-4 border rounded-xl flex flex-col justify-center ${validationIssues.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-sm font-bold ${validationIssues.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                                        {validationIssues.length > 0 ? '⚠️ 데이터 오류 의심' : '✅ 데이터 무결성 확인'}
                                    </span>
                                    <span className={`text-2xl font-extrabold ${validationIssues.length > 0 ? 'text-red-900' : 'text-green-900'}`}>
                                        {validationIssues.length}건
                                    </span>
                                </div>
                                
                                {validationIssues.length > 0 && (
                                    <div className="flex items-center justify-between text-xs bg-white bg-opacity-60 p-2 rounded-lg">
                                        <button onClick={() => handleJumpToIssue('prev')} className="px-2 py-1 hover:bg-red-100 rounded font-bold text-red-700">{'< 이전 오류'}</button>
                                        <span className="text-red-600 font-medium">
                                            {currentIssueIndex + 1} / {validationIssues.length} (이동)
                                        </span>
                                        <button onClick={() => handleJumpToIssue('next')} className="px-2 py-1 hover:bg-red-100 rounded font-bold text-red-700">{'다음 오류 >'}</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {validationIssues.length > 0 && (
                            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
                                <strong>[오류 상세]</strong> {validationIssues[currentIssueIndex].message} <br/>
                                <span className="text-xs text-red-500">Field: {validationIssues[currentIssueIndex].field} | Code: {validationIssues[currentIssueIndex].courseCode}</span>
                            </div>
                        )}
                        
                        <div className="bg-gray-900 rounded-xl p-4 mb-4 overflow-hidden relative">
                            <div className="flex justify-between items-center mb-2 text-gray-400 text-xs">
                                <span>JSON Preview</span>
                                <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={searchText} 
                                        onChange={handleSearchTextChange} 
                                        placeholder="검색..." 
                                        className="bg-gray-800 border-none text-white text-xs px-2 py-1 rounded focus:outline-none"
                                    />
                                    <button onClick={handleSearch} className="text-white hover:text-blue-400"><i className="fas fa-search"></i></button>
                                    <button onClick={handlePrevMatch} className="text-white hover:text-blue-400"><i className="fas fa-chevron-up"></i></button>
                                    <button onClick={handleNextMatch} className="text-white hover:text-blue-400"><i className="fas fa-chevron-down"></i></button>
                                    <span className="ml-2">{searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}</span>
                                </div>
                            </div>
                            <textarea 
                                ref={textareaRef}
                                value={previewText}
                                onChange={handlePreviewTextChange}
                                className="w-full h-96 bg-transparent text-green-400 font-mono text-xs outline-none resize-none focus:bg-gray-800 transition-colors p-2 rounded"
                                spellCheck={false}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className={`px-8 py-3 rounded-xl font-bold text-sm shadow-lg transition transform active:scale-95 disabled:opacity-50 ${validationIssues.length > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                            >
                                {validationIssues.length > 0 ? '오류 무시하고 DB 저장' : 'DB에 저장하기'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <LoadingModal isOpen={isLoading} message={loadingMessage} progress={progress} />
            {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({show: false, message: ''})} />}
        </div>
    );
}