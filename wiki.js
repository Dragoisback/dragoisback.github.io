// A custom hook for detecting clicks outside a component
function useOutsideClick(ref, callback) {
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref, callback]);
}

// Custom Dropdown Component for Novel Selection
const NovelSelector = ({ novels, selectedNovel, onSelect, darkMode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const wrapperRef = React.useRef(null);
    useOutsideClick(wrapperRef, () => setIsOpen(false));

    const filteredNovels = novels.filter(novel =>
        novel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (novel) => {
        onSelect(novel);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative w-full" ref={wrapperRef}> {/* md:w-72 removed to allow full width on mobile when stacked */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-2 border rounded-md flex justify-between items-center text-left ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            >
                <span>{selectedNovel === 'All Novels' ? 'Select a Novel' : selectedNovel}</span>
                <span className="transform transition-transform">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded-md shadow-lg max-h-60 overflow-y-auto`}>
                    <input
                        type="text"
                        placeholder="Search novels..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full p-2 border-b sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`}
                    />
                    <ul>
                        <li onClick={() => handleSelect('All Novels')} className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            All Novels
                        </li>
                        {filteredNovels.map(novel => (
                            <li key={novel} onClick={() => handleSelect(novel)} className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                                {novel}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

// Download Button Component
const DownloadButton = ({ data, novelName, darkMode }) => {
    const handleDownload = () => {
        // Prepare CSV content: "chinese,english"
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Chinese,English\n" 
            + data.map(e => `"${e.chinese.replace(/"/g, '""')}","${e.english.replace(/"/g, '""')}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${novelName.replace(/ /g, '_')}_glossary.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button onClick={handleDownload} className="download-button">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
        </button>
    );
};

// Results Table Component
const ResultsTable = ({ entries, darkMode, isLoading, loadingMessage, onHideEntry }) => {
    if (isLoading && entries.length === 0) {
        return (
            <div className="loading-container p-4">
                <div className="loading-spinner" style={{borderTopColor: darkMode ? '#60a5fa' : '#3498db'}}></div>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{loadingMessage || "Loading entries..."}</p>
            </div>
        );
    }

    if (entries.length === 0) {
        return <p className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No results found. {loadingMessage}</p>;
    }

    return (
        <div className="overflow-x-auto">
            {/* Optionally, display a small loading indicator or message during incremental loads */}
            {isLoading && entries.length > 0 && (
                <div className="text-center p-2 text-sm">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{loadingMessage}</p>
                </div>
            )}
            <table className="glossary-table w-full">
                <thead>
                    <tr>
                        <th className={`px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Chinese</th>
                        <th className={`px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>English</th>
                        <th className={`px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Novel</th>
                        <th className={`px-2 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                    </tr>
                </thead>
                <tbody className={darkMode ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}>
                    {entries.map(entry => (
                        <tr key={entry.id} className={darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}>
                            <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{entry.chinese}</td>
                            <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{entry.english}</td>
                            <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{entry.novel}</td>
                            <td className={`px-2 py-2 sm:px-4 sm:py-3 whitespace-nowrap`}>
                                <button
                                    onClick={() => onHideEntry(entry.id)}
                                    className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    aria-label={`Hide entry ${entry.chinese}`}
                                >
                                    Hide
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Main Glossary Component
function WikiGlossary({ entries, isLoading, loadingMessage }) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedNovel, setSelectedNovel] = React.useState('All Novels');
    const [darkMode, setDarkMode] = React.useState(false);
    const [isClearingCache, setIsClearingCache] = React.useState(false);
    const [clearCacheMessage, setClearCacheMessage] = React.useState('');
    const [hiddenEntryIds, setHiddenEntryIds] = React.useState([]);
    const [hideStatusMessage, setHideStatusMessage] = React.useState('');

    // Effect for loading initial states from localStorage (dark mode, hidden entries)
    React.useEffect(() => {
        // Dark mode
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        setDarkMode(darkThemeMq.matches);
        const mqListener = (e) => setDarkMode(e.matches);
        darkThemeMq.addListener(mqListener);
        document.documentElement.className = darkThemeMq.matches ? 'dark' : 'light';

        // Hidden entries
        try {
            const storedHiddenIds = localStorage.getItem('hiddenGlossaryEntryIds');
            if (storedHiddenIds) {
                const parsedIds = JSON.parse(storedHiddenIds);
                if (Array.isArray(parsedIds)) {
                    setHiddenEntryIds(parsedIds);
                }
            }
        } catch (error) {
            console.error("Error loading hidden entries from localStorage:", error);
        }
        
        return () => darkThemeMq.removeListener(mqListener);
    }, []);

    const handleDarkModeToggle = React.useCallback(() => {
        setDarkMode(prev => {
            document.documentElement.className = !prev ? 'dark' : 'light';
            return !prev;
        });
    }, []);

    const handleClearCache = React.useCallback(() => {
        setIsClearingCache(true);
        setClearCacheMessage('');
        try {
            let itemsCleared = 0;
            const totalFilesToClear = 12; // Should match totalFiles in index.html
            for (let i = 1; i <= totalFilesToClear; i++) {
                const cacheKey = `glossary_data_${i}_json`;
                if (localStorage.getItem(cacheKey)) {
                    localStorage.removeItem(cacheKey);
                    itemsCleared++;
                }
            }
            if (itemsCleared > 0) {
                setClearCacheMessage(`Glossary cache cleared (${itemsCleared} items). Please reload the page to fetch the latest data.`);
            } else {
                setClearCacheMessage("No glossary data found in cache to clear.");
            }
            // alert is modal, so using a message state instead
        } catch (e) {
            console.error("Error clearing cache:", e);
            setClearCacheMessage(`Error clearing cache: ${e.message}. Please check console.`);
            // alert(`Error clearing cache: ${e.message}`);
        } finally {
            setIsClearingCache(false);
        }
    }, []);

    const handleHideEntry = React.useCallback((entryId) => {
        setHiddenEntryIds(prevIds => {
            if (prevIds.includes(entryId)) return prevIds; // Already hidden
            const newIds = [...prevIds, entryId];
            try {
                localStorage.setItem('hiddenGlossaryEntryIds', JSON.stringify(newIds));
            } catch (error) {
                console.error("Error saving hidden entries to localStorage:", error);
                setHideStatusMessage("Error saving hide preference. See console.");
            }
            return newIds;
        });
    }, []);

    const handleClearHiddenEntries = React.useCallback(() => {
        setHiddenEntryIds([]);
        try {
            localStorage.removeItem('hiddenGlossaryEntryIds');
            setHideStatusMessage("All hidden entries are now shown. Results will update.");
        } catch (error) {
            console.error("Error clearing hidden entries from localStorage:", error);
            setHideStatusMessage("Error clearing hidden entries. See console.");
        }
        // Message will auto-clear on next status update or can be timed out
        setTimeout(() => setHideStatusMessage(''), 3000);
    }, []);

    const uniqueNovels = React.useMemo(() => {
        // Filter out hidden entries first before determining unique novels
        const visibleEntries = entries.filter(entry => !hiddenEntryIds.includes(entry.id));
        const novels = new Set(visibleEntries.map(e => e.novel));
        return Array.from(novels).sort();
    }, [entries, hiddenEntryIds]);

    const filteredAndSortedEntries = React.useMemo(() => {
        // 1. Filter out hidden entries
        let results = entries.filter(entry => !hiddenEntryIds.includes(entry.id));

        // 2. Filter by Novel
        if (selectedNovel !== 'All Novels') {
            results = results.filter(entry => entry.novel === selectedNovel);
        }

        // 2. Filter by Search Term
        const searchTermLower = searchTerm.toLowerCase().trim();
        if (searchTermLower) {
            results = results.filter(entry =>
                entry.chinese.toLowerCase().includes(searchTermLower) ||
                entry.english.toLowerCase().includes(searchTermLower)
            );
        }

        // 3. Smart Sorting (only if there's a search term)
        if (searchTermLower) {
            results.sort((a, b) => {
                const aChinese = a.chinese.toLowerCase();
                const bChinese = b.chinese.toLowerCase();
                const aEnglish = a.english.toLowerCase();
                const bEnglish = b.english.toLowerCase();

                const aIsExact = aChinese === searchTermLower || aEnglish === searchTermLower;
                const bIsExact = bChinese === searchTermLower || bEnglish === searchTermLower;

                if (aIsExact && !bIsExact) return -1;
                if (!aIsExact && bIsExact) return 1;

                const aLength = aChinese.includes(searchTermLower) ? aChinese.length : aEnglish.length;
                const bLength = bChinese.includes(searchTermLower) ? bChinese.length : bEnglish.length;

                return aLength - bLength;
            });
        }

        return results;
    }, [entries, searchTerm, selectedNovel]);

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 gap-4">
                    <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left">Novel Glossary</h1>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2"> {/* Added flex-wrap */}
                        <button
                            onClick={handleClearHiddenEntries}
                            className={`px-3 py-2 text-sm font-medium text-center rounded-lg transition-colors ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                        >
                            Show All Entries ({entries.length - hiddenEntryIds.length} visible)
                        </button>
                        <button
                            onClick={handleClearCache}
                            disabled={isClearingCache}
                            className={`px-3 py-2 text-sm font-medium text-center rounded-lg transition-colors ${
                                darkMode 
                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-800 text-white' 
                                : 'bg-red-500 hover:bg-red-600 focus:ring-red-300 text-white'
                            } ${isClearingCache ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isClearingCache ? 'Clearing Cache...' : 'Clear Cache'}
                        </button>
                        <button
                            onClick={handleDarkModeToggle}
                            className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>
                {clearCacheMessage && (
                    <div className={`p-3 mb-4 text-sm rounded-lg ${darkMode ? 'bg-blue-700 text-blue-200' : 'bg-blue-100 text-blue-700'}`} role="alert">
                        {clearCacheMessage}
                    </div>
                )}
                {hideStatusMessage && (
                    <div className={`p-3 mb-4 text-sm rounded-lg ${darkMode ? 'bg-green-700 text-green-200' : 'bg-green-100 text-green-700'}`} role="alert">
                        {hideStatusMessage}
                    </div>
                )}

                <main className={`p-4 sm:p-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Controls Bar: Search, Novel Selector, Download. Stacks on mobile. */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <input
                            type="text"
                            placeholder="Search Chinese or English..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full flex-grow p-3 border rounded-md shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 placeholder-gray-500'}`}
                        />
                        <div className="w-full md:w-72"> {/* Wrapper for NovelSelector to control width in flex row */}
                            <NovelSelector 
                                novels={uniqueNovels}
                                selectedNovel={selectedNovel}
                                onSelect={setSelectedNovel}
                                darkMode={darkMode}
                            />
                        </div>
                        {selectedNovel !== 'All Novels' && (
                           <div className="w-full md:w-auto"> {/* Wrapper for button to control width */}
                             <DownloadButton data={filteredAndSortedEntries} novelName={selectedNovel} darkMode={darkMode}/>
                           </div>
                        )}
                    </div>
                    
                    {/* Non-critical error display area */}
                    <div 
                        id="non-critical-error-display" 
                        className={`my-2 p-3 border rounded-md text-sm ${
                            darkMode 
                            ? 'bg-yellow-900 border-yellow-700 text-yellow-300' 
                            : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                        }`} // Visibility will be based on whether content is added by showNonCriticalError
                    ></div>
                    
                    <ResultsTable 
                        entries={filteredAndSortedEntries} 
                        darkMode={darkMode}
                        isLoading={isLoading} 
                        loadingMessage={loadingMessage}
                        onHideEntry={handleHideEntry}
                    />
                </main>
            </div>
        </div>
    );
}

// Make the component available globally
window.WikiGlossary = WikiGlossary;
