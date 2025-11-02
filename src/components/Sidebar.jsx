import React, { useState, useEffect, useRef } from 'react';
import { uploadFile, createFolder, getStorageInfo } from '../utils/api';

const Sidebar = ({ currentFolderId, onFileUpload, onFolderCreate }) => {
  const [activeItem, setActiveItem] = useState('my-drive');
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('Untitled folder');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 15 * 1024 * 1024 * 1024, usedFormatted: '0 Bytes', totalFormatted: '15 GB', percentage: 0 });
  const folderInputRef = useRef(null);
  const newMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target)) {
        setIsNewOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsNewOpen(false);
        if (isFolderDialogOpen) {
          setIsFolderDialogOpen(false);
          setFolderName('Untitled folder');
        }
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFolderDialogOpen]);

  useEffect(() => {
    if (isFolderDialogOpen && folderInputRef.current) {
      folderInputRef.current.focus();
      folderInputRef.current.select();
    }
  }, [isFolderDialogOpen]);

  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      }
    };

    loadStorageInfo();

    // Refresh storage info periodically
    const interval = setInterval(loadStorageInfo, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh storage when files are uploaded or folders are created/deleted
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const info = await getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('Failed to load storage info:', error);
      }
    };
    loadStorageInfo();
  }, [onFileUpload, onFolderCreate]);

  const handleCreateFolder = async () => {
    const name = folderName.trim() || 'Untitled folder';
    if (name) {
      try {
        await createFolder(name, currentFolderId);
        if (onFolderCreate) onFolderCreate();
        setIsFolderDialogOpen(false);
        setFolderName('Untitled folder');
      } catch (error) {
        alert('Failed to create folder: ' + error.message);
      }
    }
  };

  const handleCancelFolder = () => {
    setIsFolderDialogOpen(false);
    setFolderName('Untitled folder');
  };

  const menuItems = [
    { id: 'my-drive', label: 'My Drive', icon: 'drive' },
    { id: 'shared', label: 'Shared with me', icon: 'shared' },
    { id: 'recent', label: 'Recent', icon: 'recent' },
    { id: 'starred', label: 'Starred', icon: 'star' },
    { id: 'trash', label: 'Trash', icon: 'trash' },
  ];

  const storageItems = [
    { id: 'storage', label: 'Storage', icon: 'cloud' },
  ];

  const renderIcon = (iconType) => {
    switch (iconType) {
      case 'drive':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 20H5V4h7V2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 2v2h3.59l-9.83 9.83 1.41 1.41L19 5.41V9h2V2h-7z" />
          </svg>
        );
      case 'shared':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        );
      case 'recent':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        );
      case 'star':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      case 'trash':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        );
      case 'cloud':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* New Button */}
      <div className="p-4">
        <div ref={newMenuRef} className="relative inline-block">
          <button
            onClick={() => setIsNewOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={isNewOpen}
            className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-gray-200 
               hover:shadow-md transition-all relative z-40"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="30"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-800"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-gray-800 text-sm font-medium">New</span>
          </button>

          <div
            role="menu"
            className={`absolute left-0 top-[-40px] z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden
      origin-top-left transform transition-all duration-200 ease-out
      ${isNewOpen
                ? 'opacity-100 translate-y-10 pointer-events-auto'
                : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          >
            <div className="py-1">
              <button
                onClick={() => {
                  setIsNewOpen(false);
                  setIsFolderDialogOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  New folder
                </span>
                <span className="text-xs text-gray-500">Alt+C then F</span>
              </button>

              <div className="border-t border-gray-200"></div>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    try {
                      await uploadFile(file, currentFolderId);
                      if (onFileUpload) onFileUpload();
                    } catch (error) {
                      alert('Failed to upload file: ' + error.message);
                    }
                  }
                  e.target.value = '';
                }}
              />

              <button
                onClick={() => {
                  setIsNewOpen(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  File upload
                </span>
                <span className="text-xs text-gray-500">Alt+C then U</span>
              </button>

              <button className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100">
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  Folder upload
                </span>
                <span className="text-xs text-gray-500">Alt+C then I</span>
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              {["Google Docs", "Google Sheets", "Google Slides", "Google Vids", "Google Forms", "More"].map((label) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100"
                >
                  <span className="flex items-center gap-3">
                    {label === "Google Docs" && (
                      <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    )}
                    {label === "Google Sheets" && (
                      <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                      </svg>
                    )}
                    {label === "Google Slides" && (
                      <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z" />
                      </svg>
                    )}
                    {label === "Google Vids" && (
                      <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                      </svg>
                    )}
                    {label === "Google Forms" && (
                      <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    )}
                    {label === "More" && (
                      <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    )}
                    {label}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>


      {/* Navigation Items */}
      <nav className="flex-1 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-2 rounded-full text-sm transition-colors ${activeItem === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className={activeItem === item.id ? 'text-blue-700' : 'text-gray-600'}>
                  {renderIcon(item.icon)}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="my-4 border-t border-gray-200"></div>

        <ul className="space-y-1">
          {storageItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-2 rounded-full text-sm transition-colors ${activeItem === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className={activeItem === item.id ? 'text-blue-700' : 'text-gray-600'}>
                  {renderIcon(item.icon)}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Storage Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${storageInfo.percentage}%` }}
            ></div>
          </div>
        </div>
        <p className="text-xs text-gray-600">{storageInfo.usedFormatted} of {storageInfo.totalFormatted} used</p>
        <button className="mt-2 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
          Get more storage
        </button>
      </div>

      {/* New Folder Dialog Modal */}
      {isFolderDialogOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={handleCancelFolder}
        >
          <div
            className="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-medium text-gray-900 mb-4">New folder</h2>
            <input
              ref={folderInputRef}
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                } else if (e.key === 'Escape') {
                  handleCancelFolder();
                }
              }}
              className="w-full px-3 py-2.5 border-2 border-blue-500 rounded focus:outline-none focus:ring-0 text-gray-900 mb-6 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelFolder}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
