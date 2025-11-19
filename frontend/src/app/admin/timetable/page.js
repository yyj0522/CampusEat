"use client";

import React, { useState, useRef, useEffect } from 'react';

const availableParsers = [
  { id: 'baekseok-major', name: '백석대학교 (전체)' },
];

const availableScrapers = [
  { id: 'eulji-general', name: '을지대학교 (전체)' },
];

const availableDynamicScrapers = [
  { id: 'gachon-general', name: '가천대학교 (전체)' },
];

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const [searchText, setSearchText] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const textareaRef = useRef(null);
  const pdfSearchDropdownRef = useRef(null);
  const scraperSearchDropdownRef = useRef(null);
  const dynamicScraperSearchDropdownRef = useRef(null);

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

  const showModal = (modalMsg, loading = true) => {
    setModalMessage(modalMsg);
    setIsLoading(loading);
    setIsModalOpen(true);
  };

  const updateModal = (modalMsg, autoCloseDelay = 2000) => {
    setModalMessage(modalMsg);
    setIsLoading(false);
    if (autoCloseDelay > 0) {
      setTimeout(() => setIsModalOpen(false), autoCloseDelay);
    }
  };

  const resetSearch = () => {
    setSearchMatches([]);
    setCurrentMatchIndex(-1);
  };

  const resetPreview = () => {
    setPreviewData(null);
    setPreviewText('');
    setMessage('');
    resetSearch();
  };

  const handlePreview = async () => {
    if (!file) {
      alert('PDF 파일을 선택하세요.');
      return;
    }
    if (!selectedPdfParser) {
      alert('대학/유형을 선택하세요.');
      return;
    }

    showModal('AI가 PDF를 분석 중입니다...');
    setMessage('AI가 PDF를 분석 중입니다...');
    resetPreview();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', year);
    formData.append('semester', semester);
    formData.append('universityId', selectedPdfParser.id);

    try {
      const response = await fetch('http://localhost:3000/api/timetable/preview/pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '미리보기 생성에 실패했습니다.');
      }

      setPreviewData(data);
      setPreviewText(JSON.stringify(data, null, 2));
      setMessage(`미리보기 성공: ${data.lectures.length}개 강의가 감지되었습니다.`);
      updateModal('✅ 분석이 완료되었습니다!');
    } catch (error) {
      const errorMsg = `오류: ${error.message}`;
      setMessage(errorMsg);
      updateModal(`❌ ${errorMsg}`, 3000);
    }
  };

  const handleSave = async () => {
    if (!previewText) {
      alert('먼저 미리보기를 실행해주세요.');
      return;
    }

    showModal('데이터를 DB에 저장 중입니다...');
    setMessage('데이터를 DB에 저장 중입니다...');

    let dataToSave;
    try {
      dataToSave = JSON.parse(previewText);
    } catch (jsonError) {
      const errorMsg = `오류: JSON 형식이 올바르지 않습니다. ${jsonError.message}`;
      setMessage(errorMsg);
      updateModal(`❌ ${errorMsg}`, 3000);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/timetable/save', {
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

      setMessage(`성공: ${data.lectureCount}개의 강의가 DB에 저장되었습니다.`);
      updateModal('✅ 저장이 완료되었습니다!');
      resetPreview();
      setFile(null);
      setFileName('파일을 선택하세요');
    } catch (error) {
      const errorMsg = `오류: ${error.message}`;
      setMessage(errorMsg);
      updateModal(`❌ ${errorMsg}`, 3000);
    }
  };

  const handleScrapePreview = async () => {
    if (!scrapeUrl) {
      alert('스크래핑할 URL을 입력하세요.');
      return;
    }
    if (!selectedScraper) {
      alert('대학/유형을 선택하세요.');
      return;
    }
    
    showModal('웹 스크래핑을 시작합니다...');
    setMessage('웹 스크래핑 중...');
    resetPreview();

    try {
      const response = await fetch('http://localhost:3000/api/timetable/preview/scrape', {
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
      setMessage(`스크래핑 성공: ${data.lectures.length}개 강의가 감지되었습니다.`);
      updateModal('✅ 분석이 완료되었습니다!');
    } catch (error) {
      const errorMsg = `오류: ${error.message}`;
      setMessage(errorMsg);
      updateModal(`❌ ${errorMsg}`, 3000);
    }
  };
  
  const handleDynamicScrapePreview = async () => {
    if (!dynamicScrapeUrl) {
      alert('스크래핑할 URL을 입력하세요.');
      return;
    }
    if (!selectedDynamicScraper) {
      alert('대학/유형을 선택하세요.');
      return;
    }
    
    showModal('동적 웹 스크래핑을 시작합니다...');
    setMessage('동적 웹 스크래핑 중...');
    resetPreview();

    try {
      const response = await fetch('http://localhost:3000/api/timetable/preview/scrape-dynamic', {
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
      setMessage(`동적 스크래핑 성공: ${data.lectures.length}개 강의가 감지되었습니다.`);
      updateModal('✅ 분석이 완료되었습니다!');
    } catch (error) {
      const errorMsg = `오류: ${error.message}`;
      setMessage(errorMsg);
      updateModal(`❌ ${errorMsg}`, 3000);
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
    const avgLineHeight = textarea.scrollHeight / textarea.value.split('\n').length;
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
      alert('텍스트를 찾을 수 없습니다.');
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
  
  const styles = {
    container: {
      padding: '24px',
      fontFamily: '"Pretendard", sans-serif',
      maxWidth: '800px',
      margin: '40px auto',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    title: { margin: '0 0 8px 0', color: '#1a1a1a' },
    subtitle: { margin: '0 0 24px 0', color: '#666' },
    tabContainer: {
      display: 'flex',
      marginBottom: '20px',
      borderBottom: '1px solid #e0e0e0',
    },
    tab: (isActive) => ({
      padding: '12px 16px',
      cursor: 'pointer',
      backgroundColor: isActive ? '#fff' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '3px solid #007bff' : '3px solid transparent',
      color: isActive ? '#007bff' : '#333',
      fontWeight: isActive ? '600' : '500',
      fontSize: '16px',
    }),
    section: { marginBottom: '24px' },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#333',
    },
    inputGroup: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
    },
    textInput: {
      flex: '1',
      padding: '10px 12px',
      fontSize: '14px',
      borderRadius: '6px',
      border: '1px solid #ccc',
      fontFamily: 'inherit',
      backgroundColor: '#fff', 
    },
    searchDropdownContainer: {
      flex: '1',
      position: 'relative',
    },
    searchDropdownList: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '0 0 6px 6px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      maxHeight: '150px',
      overflowY: 'auto',
      zIndex: 10,
    },
    searchDropdownItem: (isHovered) => ({
      padding: '10px 12px',
      cursor: 'pointer',
      backgroundColor: isHovered ? '#f0f0f0' : 'white',
    }),
    fileInputLabel: {
      flex: '2',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      backgroundColor: '#f9f9f9',
      border: '1px dashed #ccc',
      borderRadius: '6px',
      cursor: 'pointer',
      color: '#555',
    },
    fileName: { fontStyle: 'italic', color: '#333' },
    hiddenInput: { display: 'none' },
    button: (variant = 'primary', disabled = false) => ({
      padding: '12px 16px',
      fontSize: '15px',
      fontWeight: '600',
      borderRadius: '6px',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: 'white',
      backgroundColor: variant === 'save' ? '#28a745' : '#007bff',
      opacity: disabled ? 0.6 : 1,
    }),
    searchButton: {
      padding: '10px 12px',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '6px',
      border: '1px solid #007bff',
      cursor: 'pointer',
      color: '#007bff',
      backgroundColor: '#fff',
    },
    message: {
      padding: '12px',
      backgroundColor: message.startsWith('오류') ? '#f8d7da' : (message.startsWith('성공') ? '#d4edda' : '#e2e3e5'),
      color: message.startsWith('오류') ? '#721c24' : (message.startsWith('성공') ? '#155724' : '#383d41'),
      border: `1px solid ${message.startsWith('오류') ? '#f5c6cb' : (message.startsWith('성공') ? '#c3e6cb' : '#d6d8db')}`,
      borderRadius: '6px',
      marginBottom: '16px',
      whiteSpace: 'pre-wrap',
      display: message ? 'block' : 'none',
    },
    textarea: {
      backgroundColor: '#f4f4f4',
      padding: '16px',
      borderRadius: '6px',
      height: '400px',
      overflowY: 'auto',
      border: '1px solid #e0e0e0',
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      fontSize: '13px',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '32px 40px',
      borderRadius: '8px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    },
    modalMessage: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#333',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    searchBar: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px',
      alignItems: 'center',
    },
    searchResult: {
      fontSize: '14px',
      color: '#555',
      minWidth: '70px',
      textAlign: 'center',
    }
  };

  return (
    <>
      <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
      </style>
      
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            {isLoading && <div style={styles.spinner}></div>}
            <span style={styles.modalMessage}>{modalMessage}</span>
          </div>
        </div>
      )}

      <div style={styles.container}>
        <h1 style={styles.title}>시간표 데이터 관리자</h1>
        <p style={styles.subtitle}>이 페이지는 관리자 전용이며 메뉴에 노출되지 않습니다.</p>

        <div style={styles.tabContainer}>
          <button style={styles.tab(activeTab === 'pdf')} onClick={() => { setActiveTab('pdf'); resetPreview(); }}>
            PDF 업로더
          </button>
          <button style={styles.tab(activeTab === 'scrape')} onClick={() => { setActiveTab('scrape'); resetPreview(); }}>
            웹 스크래퍼 (정적)
          </button>
          <button style={styles.tab(activeTab === 'scrape-dynamic')} onClick={() => { setActiveTab('scrape-dynamic'); resetPreview(); }}>
            웹 스크래퍼 (동적)
          </button>
        </div>

        {activeTab === 'pdf' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. PDF 업로드 설정</h3>
              <div style={styles.inputGroup}>
                <label htmlFor="file-upload" style={styles.fileInputLabel}>
                  <span style={styles.fileName}>{fileName}</span>
                  <span>파일 찾기</span>
                </label>
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={styles.hiddenInput}
                />
              </div>
              <div style={styles.inputGroup}>
                
                <div style={styles.searchDropdownContainer} ref={pdfSearchDropdownRef}>
                  <input
                    type="text"
                    placeholder="대학/유형 검색..."
                    value={pdfParserSearch}
                    onChange={handlePdfParserSearchChange}
                    onFocus={() => setShowPdfParserList(true)}
                    style={{...styles.textInput, width: '100%', boxSizing: 'border-box'}}
                  />
                  {showPdfParserList && filteredPdfParsers.length > 0 && (
                    <div style={styles.searchDropdownList}>
                      {filteredPdfParsers.map((parser) => (
                        <div
                          key={parser.id}
                          onClick={() => handlePdfParserSelect(parser)}
                          style={styles.searchDropdownItem(false)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {parser.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="2025">2025년</option>
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                  <option value="2028">2028년</option>
                  <option value="2029">2029년</option>
                  <option value="2030">2030년</option>
                </select>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="1학기">1학기</option>
                  <option value="2학기">2학기</option>
                  <option value="여름계절">여름계절</option>
                  <option value="겨울계절">겨울계절</option>
                </select>
              </div>
              <button 
                onClick={handlePreview} 
                disabled={isLoading || !file || !selectedPdfParser}
                style={styles.button('primary', isLoading || !file || !selectedPdfParser)}
              >
                {isLoading ? '처리 중...' : 'PDF 분석 및 미리보기'}
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'scrape' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. 웹 스크래핑 설정 (정적)</h3>
              
              <div style={styles.inputGroup}>
                <div style={styles.searchDropdownContainer} ref={scraperSearchDropdownRef}>
                  <input
                    type="text"
                    placeholder="대학/유형 검색..."
                    value={scraperSearch}
                    onChange={handleScraperSearchChange}
                    onFocus={() => setShowScraperList(true)}
                    style={{...styles.textInput, width: '100%', boxSizing: 'border-box'}}
                  />
                  {showScraperList && filteredScrapers.length > 0 && (
                    <div style={styles.searchDropdownList}>
                      {filteredScrapers.map((scraper) => (
                        <div
                          key={scraper.id}
                          onClick={() => handleScraperSelect(scraper)}
                          style={styles.searchDropdownItem(false)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {scraper.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <input 
                  type="text" 
                  value={scrapeUrl} 
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  placeholder="가져올 시간표 페이지 URL을 입력하세요"
                  style={styles.textInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="2025">2025년</option>
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                  <option value="2028">2028년</option>
                  <option value="2029">2029년</option>
                  <option value="2030">2030년</option>
                </select>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="1학기">1학기</option>
                  <option value="2학기">2학기</option>
                  <option value="여름계절">여름계절</option>
                  <option value="겨울계절">겨울계절</option>
                </select>
              </div>
              <button 
                onClick={handleScrapePreview} 
                disabled={isLoading || !scrapeUrl || !selectedScraper}
                style={styles.button('primary', isLoading || !scrapeUrl || !selectedScraper)}
              >
                {isLoading ? '처리 중...' : 'URL 분석 및 미리보기'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'scrape-dynamic' && (
          <div>
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>1. 웹 스크래핑 설정 (동적)</h3>
              
              <div style={styles.inputGroup}>
                <div style={styles.searchDropdownContainer} ref={dynamicScraperSearchDropdownRef}>
                  <input
                    type="text"
                    placeholder="대학/유형 검색..."
                    value={dynamicScraperSearch}
                    onChange={handleDynamicScraperSearchChange}
                    onFocus={() => setShowDynamicScraperList(true)}
                    style={{...styles.textInput, width: '100%', boxSizing: 'border-box'}}
                  />
                  {showDynamicScraperList && filteredDynamicScrapers.length > 0 && (
                    <div style={styles.searchDropdownList}>
                      {filteredDynamicScrapers.map((scraper) => (
                        <div
                          key={scraper.id}
                          onClick={() => handleDynamicScraperSelect(scraper)}
                          style={styles.searchDropdownItem(false)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          {scraper.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.inputGroup}>
                <input 
                  type="text" 
                  value={dynamicScrapeUrl} 
                  onChange={(e) => setDynamicScrapeUrl(e.target.value)}
                  placeholder="가져올 시간표 페이지 URL을 입력하세요"
                  style={styles.textInput}
                />
              </div>
              <div style={styles.inputGroup}>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="2025">2025년</option>
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                  <option value="2028">2028년</option>
                  <option value="2029">2029년</option>
                  <option value="2030">2030년</option>
                </select>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={styles.textInput}
                >
                  <option value="1학기">1학기</option>
                  <option value="2학기">2학기</option>
                  <option value="여름계절">여름계절</option>
                  <option value="겨울계절">겨울계절</option>
                </select>
              </div>
              <button 
                onClick={handleDynamicScrapePreview} 
                disabled={isLoading || !dynamicScrapeUrl || !selectedDynamicScraper}
                style={styles.button('primary', isLoading || !dynamicScrapeUrl || !selectedDynamicScraper)}
              >
                {isLoading ? '처리 중...' : 'URL 분석 및 미리보기'}
              </button>
            </div>
          </div>
        )}

        {(previewText || message) && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>2. 미리보기 및 저장</h3>
            <div style={styles.message}>
              {message}
            </div>
            
            {previewText && (
              <>
                <div style={styles.searchBar}>
                  <input
                    type="text"
                    placeholder="미리보기에서 텍스트 검색..."
                    value={searchText}
                    onChange={handleSearchTextChange}
                    style={styles.textInput}
                  />
                  <button
                    onClick={handleSearch}
                    style={styles.searchButton}
                  >
                    검색
                  </button>
                  <button
                    onClick={handlePrevMatch}
                    disabled={searchMatches.length === 0}
                    style={{...styles.searchButton, opacity: searchMatches.length === 0 ? 0.5 : 1}}
                  >
                    이전
                  </button>
                  <button
                    onClick={handleNextMatch}
                    disabled={searchMatches.length === 0}
                    style={{...styles.searchButton, opacity: searchMatches.length === 0 ? 0.5 : 1}}
                  >
                    다음
                  </button>
                  <span style={styles.searchResult}>
                    {searchMatches.length > 0 ? 
                      `${currentMatchIndex + 1} / ${searchMatches.length}` : 
                      (searchText ? '0 / 0' : '')
                    }
                  </span>
                </div>
              
                <textarea
                  ref={textareaRef}
                  style={styles.textarea}
                  value={previewText}
                  onChange={handlePreviewTextChange}
                />
                
                <button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  style={{ ...styles.button('save', isLoading), marginTop: '16px' }}
                >
                  {isLoading ? '저장 중...' : '이 데이터를 DB에 저장하기'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}