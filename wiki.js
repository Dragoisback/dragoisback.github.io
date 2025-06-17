const DB_NAME = 'GlossaryDB';
const DB_VERSION = 1;
const STORE_NAME = 'glossary';
const DATA_VERSION_KEY = 'glossary_data_version';
// IMPORTANT: Increment this version number whenever you update your data files on GitHub
const CURRENT_DATA_VERSION = '1.0.0';

// --- IndexedDB Helper Functions ---
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const saveDataToDB = (db, data) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear(); // Clear old data
        data.forEach(item => store.put(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = (event) => reject(event.target.error);
    });
};

const loadDataFromDB = (db) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

// --- Custom Hook for Data Fetching and Caching ---
function useGlossaryData() {
    const [entries, setEntries] = React.useState([]);
    const [status, setStatus] = React.useState('loading'); // loading, success, error

    const fetchAndCacheData = React.useCallback(async () => {
        setStatus('loading');
        try {
            let allData = [];
            let i = 1;
            while (true) {
                const response = await fetch(`content/data${i}.json?v=${CURRENT_DATA_VERSION}`);
                if (!response.ok) { if (response.status === 404 && i > 1) break; throw new Error(`HTTP error! status: ${response.status}`); }
                const text = await response.text();
                // This regex handles the "][" malformed JSON by treating it as a delimiter
                const validJsonStrings = text.replace(/\]\s*\[/g, ']||[').split('||');
                validJsonStrings.forEach(jsonString => {
                    if (jsonString.trim()) {
                        const data = JSON.parse(jsonString);
                        if (Array.isArray(data)) allData = allData.concat(data);
                    }
                });
                i++;
            }
            
            const processedData = allData.map((item, index) => ({ id: index, ...item }));
            
            const db = await openDB();
            await saveDataToDB(db, processedData);
            localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
            setEntries(processedData);
            setStatus('success');
        } catch (error) {
            console.error("Failed to fetch from network:", error);
            setStatus('error');
        }
    }, []);

    React.useEffect(() => {
        const init = async () => {
            const cachedVersion = localStorage.getItem(DATA_VERSION_KEY);
            if (cachedVersion === CURRENT_DATA_VERSION) {
                try {
                    const db = await openDB();
                    const data = await loadDataFromDB(db);
                    if (data && data.length > 0) {
                        setEntries(data);
                        setStatus('success');
                        return;
                    }
                } catch (e) {
                    console.error("Failed to load from DB, fetching from network.", e);
                }
            }
            fetchAndCacheData();
        };
        init();
    }, [fetchAndCacheData]);

    return { entries, status, forceRefresh: fetchAndCacheData };
}

// --- UI Components ---

function useOutsideClick(ref, callback) {
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) callback();
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, callback]);
}

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
        <div className="relative w-full md:w-72" ref={wrapperRef}>
            <button onClick={() => setIsOpen(!isOpen)} className={`w-full p-2 border rounded-md flex justify-between items-center text-left ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                <span>{selectedNovel === 'All Novels' ? 'Select a Novel' : selectedNovel}</span>
                <span className="transform transition-transform">{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
                <div className={`absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded-md shadow-lg max-h-60 overflow-y-auto`}>
                    <input type="text" placeholder="Search novels..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full p-2 border-b sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
                    <ul>
                        <li onClick={() => handleSelect('All Novels')} className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>All Novels</li>
                        {filteredNovels.map(novel => (
                            <li key={novel} onClick={() => handleSelect(novel)} className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>{novel}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const DownloadButton = ({ data, novelName, darkMode }) => {
    const handleDownload = () => {
        const csvHeader = "chinese,english\n";
        const csvRows = data.map(e => `"${e.chinese.replace(/"/g, '""')}","${e.english.replace(/"/g, '""')}"`).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;

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

const ResultsTable = ({ entries, deletedIds, onDeleteToggle, darkMode }) => {
    if (entries.length === 0) {
        return <p className={`text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No results found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="glossary-table">
                <thead>
                    <tr>
                        <th className="w-1/3">Chinese</th>
                        <th className="w-1/3">English</th>
                        <th className="w-1/3">Novel</th>
                        <th className="w-auto text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map(entry => {
                        const isDeleted = deletedIds.has(entry.id);
                        return (
                            <tr key={entry.id} className={isDeleted ? 'deleted' : ''}>
                                <td className={darkMode ? 'text-gray-200' : 'text-gray-800'}>{entry.chinese}</td>
                                <td className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{entry.english}</td>
                                <td className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{entry.novel}</td>
                                <td className="text-right">
                                    <button onClick={() => onDeleteToggle(entry.id)} className={`px-2 py-1 text-xs rounded ${isDeleted ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                                        {isDeleted ? 'Undo' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const DeletionManager = ({ allEntries, deletedIds, onConfirmDeletion, onClearDeletions, darkMode }) => {
    if (deletedIds.size === 0) return null;

    const handleDownload = () => {
        const finalData = allEntries.filter(entry => !deletedIds.has(entry.id)).map(({ id, ...rest }) => rest);
        const jsonString = JSON.stringify(finalData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'glossary_updated.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onConfirmDeletion();
    };

    return (
        <div className={`p-4 rounded-lg my-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${darkMode ? 'bg-red-900 bg-opacity-30 border border-red-500' : 'bg-red-100 border border-red-200'}`}>
            <div className="text-center sm:text-left">
                <p className="font-bold">Deletion Mode</p>
                <p>{deletedIds.size} item(s) marked for deletion.</p>
            </div>
            <div className="flex gap-2">
                <button onClick={onClearDeletions} className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400'}`}>Cancel All</button>
                <button onClick={handleDownload} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Download Updated File</button>
            </div>
        </div>
    );
};

// Main Glossary Component
function WikiGlossary() {
    const { entries, status, forceRefresh } = useGlossaryData();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedNovel, setSelectedNovel] = React.useState('All Novels');
    const [darkMode, setDarkMode] = React.useState(false);
    const [displayCount, setDisplayCount] = React.useState(100);
    const [deletedIds, setDeletedIds] = React.useState(new Set());

    React.useEffect(() => {
        const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
        setDarkMode(darkThemeMq.matches);
        document.documentElement.className = darkThemeMq.matches ? 'dark' : 'light';
        const mqListener = (e) => setDarkMode(e.matches);
        darkThemeMq.addListener(mqListener);
        return () => darkThemeMq.removeListener(mqListener);
    }, []);

    const handleDarkModeToggle = React.useCallback(() => {
        setDarkMode(prev => {
            const newMode = !prev;
            document.documentElement.className = newMode ? 'dark' : 'light';
            return newMode;
        });
    }, []);
    
    const handleDeleteToggle = (id) => {
        setDeletedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    const handleConfirmDeletion = () => {
        setDeletedIds(new Set());
        alert("Your new 'glossary_updated.json' file has been downloaded. Please go to your GitHub repository, delete the old data files, and upload this new one.");
    };

    const uniqueNovels = React.useMemo(() => {
        const novels = new Set(entries.map(e => e.novel));
        return Array.from(novels).sort();
    }, [entries]);

    const filteredAndSortedEntries = React.useMemo(() => {
        let results = entries;
        if (selectedNovel !== 'All Novels') results = results.filter(e => e.novel === selectedNovel);
        
        const term = searchTerm.toLowerCase().trim();
        if (term) {
            results = results.filter(e => e.chinese.toLowerCase().includes(term) || e.english.toLowerCase().includes(term));
        }

        if (term) {
            results.sort((a, b) => {
                const aChinese = a.chinese.toLowerCase();
                const bChinese = b.chinese.toLowerCase();
                const aEnglish = a.english.toLowerCase();
                const bEnglish = b.english.toLowerCase();
                const aIsExact = aChinese === term || aEnglish === term;
                const bIsExact = bChinese === term || bEnglish === term;

                if (aIsExact && !bIsExact) return -1;
                if (!aIsExact && bIsExact) return 1;

                return (aChinese.includes(term) ? aChinese.length : aEnglish.length) - (bChinese.includes(term) ? bChinese.length : bEnglish.length);
            });
        }
        return results;
    }, [entries, searchTerm, selectedNovel]);

    if (status === 'loading') {
        return <div className="loading-container"><div className="loading-spinner"></div><div>Loading Glossary...</div></div>;
    }
    if (status === 'error') {
         return <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}><h2>Failed to Load Glossary</h2><p>Could not fetch data. Please fix JSON formatting errors (e.g., unescaped quotes) in your data files and click Retry.</p><button onClick={forceRefresh} style={{ padding: '8px 16px', marginTop: '10px', cursor: 'pointer' }}>Retry</button></div>;
    }

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-800 text-white'}`}>
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold">Novel Glossary</h1>
                    <div className="flex items-center gap-4">
                        <button onClick={forceRefresh} title="Force refresh data from server" className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>🔄</button>
                        <button onClick={handleDarkModeToggle} className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>{darkMode ? '☀️' : '🌙'}</button>
                    </div>
                </header>

                <main className={`p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <input type="text" placeholder="Search Chinese or English..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`flex-grow p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                        <NovelSelector novels={uniqueNovels} selectedNovel={selectedNovel} onSelect={setSelectedNovel} darkMode={darkMode} />
                        {selectedNovel !== 'All Novels' && (
                           <DownloadButton data={filteredAndSortedEntries} novelName={selectedNovel} darkMode={darkMode}/>
                        )}
                    </div>

                    <DeletionManager allEntries={entries} deletedIds={deletedIds} onConfirmDeletion={handleConfirmDeletion} onClearDeletions={() => setDeletedIds(new Set())} darkMode={darkMode} />
                    
                    <ResultsTable entries={filteredAndSortedEntries.slice(0, displayCount)} deletedIds={deletedIds} onDeleteToggle={handleDeleteToggle} darkMode={darkMode} />
                    
                    {displayCount < filteredAndSortedEntries.length && (
                        <div className="text-center mt-6">
                            <button onClick={() => setDisplayCount(prev => prev + 100)} className={`px-6 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}>
                                Load More ({filteredAndSortedEntries.length - displayCount} remaining)
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

window.WikiGlossary = WikiGlossary;
