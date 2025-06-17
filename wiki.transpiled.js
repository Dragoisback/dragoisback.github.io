"use strict";

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
const NovelSelector = ({
  novels,
  selectedNovel,
  onSelect,
  darkMode
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const wrapperRef = React.useRef(null);
  useOutsideClick(wrapperRef, () => setIsOpen(false));
  const filteredNovels = novels.filter(novel => novel.toLowerCase().includes(searchTerm.toLowerCase()));
  const handleSelect = novel => {
    onSelect(novel);
    setIsOpen(false);
    setSearchTerm('');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "relative w-full md:w-72",
    ref: wrapperRef
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsOpen(!isOpen),
    className: `w-full p-2 border rounded-md flex justify-between items-center text-left ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`
  }, /*#__PURE__*/React.createElement("span", null, selectedNovel === 'All Novels' ? 'Select a Novel' : selectedNovel), /*#__PURE__*/React.createElement("span", {
    className: "transform transition-transform"
  }, isOpen ? '▲' : '▼')), isOpen && /*#__PURE__*/React.createElement("div", {
    className: `absolute z-10 w-full mt-1 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border rounded-md shadow-lg max-h-60 overflow-y-auto`
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search novels...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    className: `w-full p-2 border-b sticky top-0 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200'}`
  }), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", {
    onClick: () => handleSelect('All Novels'),
    className: `p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
  }, "All Novels"), filteredNovels.map(novel => /*#__PURE__*/React.createElement("li", {
    key: novel,
    onClick: () => handleSelect(novel),
    className: `p-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`
  }, novel)))));
};

// Download Button Component
const DownloadButton = ({
  data,
  novelName,
  darkMode
}) => {
  const handleDownload = () => {
    // Prepare CSV content: "chinese,english"
    const csvContent = "data:text/csv;charset=utf-8," + "Chinese,English\n" + data.map(e => `"${e.chinese.replace(/"/g, '""')},"${e.english.replace(/"/g, '""')}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${novelName.replace(/ /g, '_')}_glossary.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return /*#__PURE__*/React.createElement("button", {
    onClick: handleDownload,
    className: "download-button"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "h-5 w-5",
    viewBox: "0 0 20 20",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("path", {
    fillRule: "evenodd",
    d: "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z",
    clipRule: "evenodd"
  })), "Download CSV");
};

// Results Table Component
const ResultsTable = ({
  entries,
  darkMode
}) => {
  if (entries.length === 0) {
    return /*#__PURE__*/React.createElement("p", {
      className: `text-center p-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`
    }, "No results found.");
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "glossary-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "w-1/3"
  }, "Chinese"), /*#__PURE__*/React.createElement("th", {
    className: "w-1/3"
  }, "English"), /*#__PURE__*/React.createElement("th", {
    className: "w-1/3"
  }, "Novel"))), /*#__PURE__*/React.createElement("tbody", null, entries.map(entry => /*#__PURE__*/React.createElement("tr", {
    key: entry.id
  }, /*#__PURE__*/React.createElement("td", {
    className: darkMode ? 'text-gray-200' : 'text-gray-800'
  }, entry.chinese), /*#__PURE__*/React.createElement("td", {
    className: darkMode ? 'text-gray-300' : 'text-gray-600'
  }, entry.english), /*#__PURE__*/React.createElement("td", {
    className: darkMode ? 'text-gray-400' : 'text-gray-500'
  }, entry.novel))))));
};

// Main Glossary Component
function WikiGlossary({
  entries
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedNovel, setSelectedNovel] = React.useState('All Novels');
  const [darkMode, setDarkMode] = React.useState(false);

  // Set dark mode based on system preference
  React.useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    setDarkMode(darkThemeMq.matches);
    const mqListener = e => setDarkMode(e.matches);
    darkThemeMq.addListener(mqListener);
    document.documentElement.className = darkThemeMq.matches ? 'dark' : 'light';
    return () => darkThemeMq.removeListener(mqListener);
  }, []);
  const handleDarkModeToggle = React.useCallback(() => {
    setDarkMode(prev => {
      document.documentElement.className = !prev ? 'dark' : 'light';
      return !prev;
    });
  }, []);
  const uniqueNovels = React.useMemo(() => {
    const novels = new Set(entries.map(e => e.novel));
    return Array.from(novels).sort();
  }, [entries]);
  const filteredAndSortedEntries = React.useMemo(() => {
    let results = entries;

    // 1. Filter by Novel
    if (selectedNovel !== 'All Novels') {
      results = results.filter(entry => entry.novel === selectedNovel);
    }

    // 2. Filter by Search Term
    const searchTermLower = searchTerm.toLowerCase().trim();
    if (searchTermLower) {
      results = results.filter(entry => entry.chinese.toLowerCase().includes(searchTermLower) || entry.english.toLowerCase().includes(searchTermLower));
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
  return /*#__PURE__*/React.createElement("div", {
    className: `min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-800 text-white'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8"
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex justify-between items-center mb-6"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl sm:text-4xl font-bold"
  }, "Novel Glossary"), /*#__PURE__*/React.createElement("button", {
    onClick: handleDarkModeToggle,
    className: `p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
  }, darkMode ? '☀️' : '🌙')), /*#__PURE__*/React.createElement("main", {
    className: `p-4 sm:p-6 rounded-xl ${darkMode ? 'bg-gray-900' : 'bg-white'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row gap-4 mb-6"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search Chinese or English...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    className: `flex-grow p-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`
  }), /*#__PURE__*/React.createElement(NovelSelector, {
    novels: uniqueNovels,
    selectedNovel: selectedNovel,
    onSelect: setSelectedNovel,
    darkMode: darkMode
  }), selectedNovel !== 'All Novels' && /*#__PURE__*/React.createElement(DownloadButton, {
    data: filteredAndSortedEntries,
    novelName: selectedNovel,
    darkMode: darkMode
  })), /*#__PURE__*/React.createElement(ResultsTable, {
    entries: filteredAndSortedEntries,
    darkMode: darkMode
  }))));
}

// Make the component available globally
window.WikiGlossary = WikiGlossary;
