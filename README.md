# Interactive Novel Glossary

An easy-to-use, searchable web glossary for Chinese novel translations. This tool allows users to quickly find terms in either Chinese or English, filter by novel, and even download specific glossaries for offline use.

**[➡️ View the Live Glossary Here](https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/)** 
*(Note: Replace the link above after enabling GitHub Pages in Step 2!)*

---

## ✨ Features

*   **Dual-Language Search**: Instantly search for terms using either Chinese characters or English pinyin/translation.
*   **Filter by Novel**: A searchable dropdown menu to easily select a novel and view only its glossary terms.
*   **Smart Sorting**: Search results prioritize exact and shorter matches, making it easier to find base terms.
*   **Download as CSV**: Download the complete glossary for any specific novel in a clean `.csv` format.
*   **Dark & Light Mode**: Automatically syncs with your system's theme, with a manual toggle button.
*   **Fully Responsive**: Looks and works great on both desktop and mobile devices.

## 🚀 How to Use the Glossary

1.  **Search for a Term**: Use the main search bar at the top to type a term in Chinese or English. The table will update in real-time.
2.  **Filter by a Novel**: Click the "Select a Novel" dropdown to view a list of all available novels. You can either scroll through the list or type in the search box within the dropdown to find a specific novel. Select "All Novels" to search across the entire glossary.
3.  **Download a Glossary**: When you have a specific novel selected from the dropdown, a "Download CSV" button will appear. Click it to save that novel's glossary to your computer.

## ✍️ How to Add or Update Content

Managing the glossary content is simple and requires no coding knowledge. All data is stored in the `content/` folder.

1.  **Navigate to the `content` folder** in this repository.
2.  **Add or Edit Files**: You can either edit the existing `data1.json`, `data2.json`, etc., files or add new ones (e.g., `data3.json`). The system will automatically load all files named `data*.json` in numerical order.
3.  **Follow the JSON Format**: Each entry in the JSON files must follow this exact format:
    ```json
    {
      "chinese": "武器攻击",
      "english": "weapon attack",
      "novel": "Start with a Core Cabin"
    }
    ```
4.  **Commit Your Changes**: After adding or editing the files, save (or "commit") your changes. GitHub Pages will automatically rebuild your website with the new content within a minute or two.

## 🛠️ Technology Stack

*   **React**: For building the user interface.
*   **Tailwind CSS**: For utility-first styling.
*   **JavaScript (ES6+)**: Core application logic.
*   **HTML5 & CSS3**: For structure and custom styling.

---
