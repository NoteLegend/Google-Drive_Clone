# 📁 Google Drive Clone

<div align="center">

### 🚀 Live Demo
[**View Deployed Application**](https://google-drive-clone-lia0.onrender.com)

*A full-stack file storage solution built with React, Express, and JSON-based database*

[![GitHub Stars](https://img.shields.io/github/stars/NoteLegend/Google-Drive_Clone?style=social)](https://github.com/NoteLegend/Google-Drive_Clone/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/NoteLegend/Google-Drive_Clone?style=social)](https://github.com/NoteLegend/Google-Drive_Clone/network/members)

</div>

---

## 📋 Overview

A fully functional Google Drive clone application that replicates core cloud storage features. Built with modern web technologies, this project demonstrates full-stack development capabilities including file management, hierarchical folder structures, and real-time UI updates.

## ✨ Features

- 📁 **File Upload & Storage** - Upload files directly to the server with organized storage in `public/uploads`
- 📂 **Folder Management** - Create nested folders with hierarchical navigation
- 💾 **JSON Database** - Lightweight, platform-independent file metadata storage
- ⭐ **Star/Unstar Files** - Mark important files for quick access
- 🗑️ **Smart Deletion** - Delete files and folders with recursive deletion for folder contents
- 📊 **Dual View Modes** - Switch between grid and list views
- 🎨 **Modern UI** - Clean interface built with Tailwind CSS
- 🔄 **Real-time Updates** - Instant feedback on all file operations
- 📱 **Responsive Design** - Works seamlessly across different screen sizes

## 🛠️ Tech Stack

### Frontend
- **React** - UI library for building interactive interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing

### Backend
- **Express.js** - Web application framework
- **Multer** - File upload middleware
- **Node.js** - JavaScript runtime

### Database
- **JSON File Storage** - Lightweight, platform-agnostic data persistence
- No native compilation required - works across all platforms

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NoteLegend/Google-Drive_Clone.git
   cd Google-Drive_Clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

## 💻 Running the Application

### Quick Start (Recommended)

Run both backend and frontend servers concurrently:

```bash
npm run dev:full
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend development server on `http://localhost:5173`

### Run Separately

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## 📁 Project Structure

```
Google-Drive_Clone/
├── server/
│   ├── server.js           # Express backend server
│   └── database.js         # JSON database operations
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/              # Page-level components
│   └── utils/              # API utility functions
├── public/
│   └── uploads/            # File storage directory
├── database.json           # JSON database (auto-generated)
└── package.json            # Project dependencies
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/files` | Retrieve all files (optional `?parentFolderId=id` query) |
| `POST` | `/api/files/upload` | Upload a new file (multipart/form-data) |
| `POST` | `/api/folders` | Create a new folder |
| `DELETE` | `/api/files/:id` | Delete a file or folder |
| `PUT` | `/api/files/:id/star` | Toggle star status for a file |

## 📊 Database Schema

Each file/folder entry contains:

```javascript
{
  id: number,                    // Unique auto-incremented identifier
  name: string,                  // File or folder name
  type: string,                  // File type (folder, document, pdf, etc.)
  size: number,                  // File size in bytes (0 for folders)
  path: string,                  // Relative file path
  parent_folder_id: number|null, // Parent folder reference (null for root)
  created_at: string,            // ISO timestamp
  modified_at: string,           // ISO timestamp
  starred: number,               // Star status (0 or 1)
  owner: string                  // File owner (default: 'me')
}
```

## 📖 Usage Guide

### Uploading Files
1. Click the **"New"** button
2. Select **"File upload"**
3. Choose your file from the file picker
4. File appears instantly in your current folder

### Creating Folders
1. Click the **"New"** button
2. Select **"New folder"**
3. Enter folder name
4. Press Enter or click Create

### Navigation
- Click on any folder to navigate into it
- Use breadcrumb navigation to go back to parent folders

### Starring Files
1. Click the three-dot menu on any file
2. Select **"Star"** to mark as important
3. Starred files can be filtered for quick access

### Deleting Items
1. Click the three-dot menu on any file or folder
2. Select **"Delete"**
3. Folders are deleted recursively with all contents

## 🎯 Key Features Explained

### Recursive Folder Deletion
When you delete a folder, the application automatically removes all nested files and subfolders, maintaining database integrity.

### Platform-Agnostic Storage
Using JSON instead of SQLite eliminates native dependencies, ensuring the application runs smoothly on Windows, macOS, and Linux without additional setup.

### Hierarchical File Organization
Files and folders maintain a proper parent-child relationship through `parent_folder_id` references, enabling unlimited nesting depth.

## 🚀 Future Enhancements

- 🔐 User authentication and authorization
- 🔗 File sharing with shareable links
- 🔍 Advanced search and filtering
- 👁️ File preview capabilities (images, PDFs, documents)
- ☁️ Cloud storage integration (AWS S3, Firebase)
- 📈 File versioning and rollback
- 📤 Batch upload and download
- 🏷️ File tagging and metadata

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs by opening an issue
- Suggest new features
- Submit pull requests

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**NoteLegend**
- GitHub: [@NoteLegend](https://github.com/NoteLegend)

## 🙏 Acknowledgments

- Inspired by Google Drive's elegant file management system
- Built as a learning project to demonstrate full-stack development skills

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ by [NoteLegend](https://github.com/NoteLegend)

</div>
