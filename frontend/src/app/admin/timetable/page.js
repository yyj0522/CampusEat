"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from "@/lib/api";

const Toast = ({ message, show, onClose }) => {
    useEffect(() => { if (show) { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); } }, [show, onClose]);
    if (!show) return null;
    return <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down"><div className="bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center gap-2"><i className="fas fa-info-circle"></i>{message}</div></div>;
};

const LoadingModal = ({ isOpen, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[200]">
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center shadow-2xl animate-scale-up border border-gray-100">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-800 font-bold">{message}</p>
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

    const [previewData, setPreviewData] = useState(null);
    const [previewText, setPreviewText] = useState('');
    const [lectureCount, setLectureCount] = useState(0);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
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
        setPreviewData(null);
        setPreviewText('');
        setLectureCount(0);
        resetSearch();
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

        setLoadingMessage('AI가 PDF를 분석 중입니다...');
        setIsLoading(true);
        resetPreview();

        const formData = new FormData();
        formData.append('file', file);
        formData.append('year', year);
        formData.append('semester', semester);
        formData.append('universityId', selectedPdfParser.id);

        try {
            const response = await fetch('https://api.campuseat.shop/api/timetable/preview/pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '미리보기 생성에 실패했습니다.');
            }

            setPreviewData(data);
            setPreviewText(JSON.stringify(data, null, 2));
            setLectureCount(data.lectures.length);
            showToast(`분석 완료: ${data.lectures.length}개 강의가 감지되었습니다.`);
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

        setLoadingMessage('데이터를 DB에 저장 중입니다...');
        setIsLoading(true);

        let dataToSave;
        try {
            dataToSave = JSON.parse(previewText);
        } catch (jsonError) {
            showToast(`오류: JSON 형식이 올바르지 않습니다.`);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('https://api.campuseat.shop/api/timetable/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'DB 저장에 실패했습니다.');
            }

            const savedCount = data.lectureCount || data.count || lectureCount;
            showToast(`저장 완료: ${savedCount}개의 강의가 저장되었습니다.`);
            
            resetPreview();
            setFile(null);
            setFileName('파일을 선택하세요');
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
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
        
        setLoadingMessage('웹 스크래핑을 시작합니다...');
        setIsLoading(true);
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

            setPreviewData(data);
            setPreviewText(JSON.stringify(data, null, 2));
            setLectureCount(data.lectures.length);
            showToast(`스크래핑 성공: ${data.lectures.length}개 강의가 감지되었습니다.`);
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
        
        setLoadingMessage('동적 웹 스크래핑을 시작합니다...');
        setIsLoading(true);
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

            setPreviewData(data);
            setPreviewText(JSON.stringify(data, null, 2));
            setLectureCount(data.lectures.length);
            showToast(`동적 스크래핑 성공: ${data.lectures.length}개 강의가 감지되었습니다.`);
        } catch (error) {
            showToast(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const navigateToMatch = (index, matches) => {
        if (!textareaRef.current || !matches || matches.length === 0) return;

        const textarea = textareaRef.current;
        const startIndex = matches[index];
        const endIndex = startIndex + searchText.length;

        textarea.focus();
        textarea.setSelectionRange(startIndex, endIndex);
        
        const lines = textarea.value.substring(0, startIndex).split('\n').length;
        const avgLineHeight = 16; 
        textarea.scrollTop = (lines - 5) * avgLineHeight; 

        setCurrentMatchIndex(index);
    };
    
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

                {(previewText) && (
                    <div className="animate-fade-in-up border-t border-gray-100 pt-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>
                            데이터 검수 및 저장
                        </h3>

                        <div className="flex justify-between items-center mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-800">
                            <span>총 감지된 강의 수: </span>
                            <span className="text-lg">{lectureCount}개</span>
                        </div>
                        
                        <div className="bg-gray-900 rounded-xl p-4 mb-4 overflow-hidden">
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
                                className="w-full h-96 bg-transparent text-green-400 font-mono text-xs outline-none resize-none"
                                spellCheck={false}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition transform active:scale-95 disabled:opacity-50"
                            >
                                DB에 저장하기
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <LoadingModal isOpen={isLoading} message={loadingMessage} />
            {toast.show && <Toast message={toast.message} show={toast.show} onClose={() => setToast({show: false, message: ''})} />}
        </div>
    );
}