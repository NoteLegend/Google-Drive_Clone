import React, { useState, useEffect } from 'react';
import FileItem from './FileItem';
import { fetchFiles, deleteFile, toggleStar, downloadFile, moveFile, uploadFile, getStorageInfo } from '../utils/api';

const MoveModal = ({ isOpen, onClose, onMove, allFiles, movingFile }) => {
  if (!isOpen) return null;

  const folders = allFiles.filter(f =>
    f.type === 'folder' && f.id !== movingFile.id
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Move "{movingFile.name}"</h2>
        <div className="max-h-64 overflow-auto border rounded p-2 mb-4">
          <button onClick={() => onMove(null)} className="w-full text-left p-2 hover:bg-gray-100 rounded" disabled={movingFile.parentFolderId === null}>
            My Drive (Root)
          </button>
          {folders.map(folder => (
            <button key={folder.id} onClick={() => onMove(folder.id)} className="w-full text-left p-2 hover:bg-gray-100 rounded" disabled={folder.id === movingFile.parentFolderId}>
              {folder.name}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
};

const MainContent = ({ parentFolderId, onFolderClick, refreshTrigger, folderStack, currentFolderId, currentFolderName, onNavigateToFolder, showStarred = false, viewMode: currentView = 'my-drive', searchQuery, showSearchBar = true, onSearchSubmit }) => {
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('drive-view-mode');
    return savedViewMode || 'grid';
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [movingFile, setMovingFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('drive-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    loadFiles();
  }, [parentFolderId, refreshTrigger, showStarred, currentView, searchQuery]);

  // Sync local search query with prop when view changes
  useEffect(() => {
    if (currentView === 'home') {
      setLocalSearchQuery(searchQuery || '');
    }
  }, [currentView, searchQuery]);

  useEffect(() => {
    if (currentView === 'storage') {
      loadStorageInfo();
    }
  }, [currentView, refreshTrigger]);

  const loadStorageInfo = async () => {
    try {
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchFiles(showStarred ? null : parentFolderId, showStarred, currentView, searchQuery);

      let filteredData = data;
      if (showStarred) {
        filteredData = data.filter(file => file.starred === true);
      } else if (searchQuery) {
        filteredData = data;
      } else if (currentView === 'home') {
        // Home view should show only root-level files (parentFolderId === null)
        filteredData = data.filter(file => file.parentFolderId === null);
      } else if (currentView === 'my-drive') {
        filteredData = data.filter(file => file.parentFolderId === parentFolderId);
      }

      setFiles(filteredData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'folder') {
      if (showStarred) {
        onFolderClick(file);
        return;
      }
      onFolderClick(file);
    } else {
      try {
        await downloadFile(file.id, file.name);
      } catch (err) {
        alert('Failed to open file: ' + err.message);
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteFile(fileId);
      loadFiles();
    } catch (err) {
      alert('Failed to delete file: ' + err.message);
    }
  };

  const handleToggleStar = async (fileId) => {
    try {
      await toggleStar(fileId);
      loadFiles();
    } catch (err) {
      alert('Failed to toggle star: ' + err.message);
    }
  };

  const handleMove = (file) => {
    setMovingFile(file);
    setIsMoveModalOpen(true);
  };

  const handleConfirmMove = async (movingFileId, newParentFolderId) => {
    const fileToMove = movingFile || files.find(f => f.id === movingFileId);
    if (!fileToMove) return;

    try {
      await moveFile(fileToMove.id, newParentFolderId);
      setIsMoveModalOpen(false);
      setMovingFile(null);
      loadFiles();
    } catch (error) {
      alert('Failed to move file: ' + error.message);
      setIsMoveModalOpen(false);
      setMovingFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.types.includes('Files')) {
      const droppedFiles = [...e.dataTransfer.files];
      if (droppedFiles.length === 0) return;

      try {
        await Promise.all(droppedFiles.map(file => uploadFile(file, currentFolderId)));
        loadFiles();
      } catch (error) {
        alert('Failed to upload one or more files: ' + error.message);
      }
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder':
        return (
          <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
          </svg>
        );
    }
  };

  const suggestedFiles = files.slice(0, 4).map(file => ({
    id: file.id,
    name: file.name,
    type: file.type,
    modified: file.modified
  }));

  const renderEmptyState = () => {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No results for "{searchQuery}"</p>
          <p className="text-sm text-gray-500">Try a different search term.</p>
        </div>
      );
    }

    if (currentView === 'trash') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No trash files</p>
          <p className="text-sm text-gray-500">Delete files to see them here</p>
        </div>
      );
    }

    if (currentView === 'shared') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No shared files</p>
          <p className="text-sm text-gray-500">Share files to see them here</p>
        </div>
      );
    }

    if (currentView === 'recent') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No recent files</p>
          <p className="text-sm text-gray-500">Recent files will appear here</p>
        </div>
      );
    }

    if (showStarred) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium text-gray-900 mb-2">No starred files</p>
          <p className="text-sm text-gray-500">Star files to see them here</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg className="w-24 h-24 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-2">No files yet</p>
        <p className="text-sm text-gray-500">Drop files or create a folder to get started</p>
      </div>
    );
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <p className="text-gray-500">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <p className="text-red-500">Error: {error}</p>
          <button onClick={loadFiles} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </main>
    );
  }

  // STORAGE VIEW
  if (currentView === 'storage') {
    const filesOnly = files.filter(file => file.type !== 'folder');

    return (
      <main className="flex-1 overflow-auto bg-white">
        <div className="p-6">
          <h1 className="text-2xl font-normal text-gray-800 mb-6">Storage</h1>

          {/* Storage Summary */}
          {storageInfo && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Storage usage</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {storageInfo.usedFormatted} of {storageInfo.totalFormatted} used
                  </p>
                </div>
                <button className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium">
                  Get more storage
                </button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${storageInfo.percentage}%` }}
                ></div>
              </div>

              <p className="text-xs text-gray-500">{storageInfo.percentage.toFixed(1)}% used</p>
            </div>
          )}

          {/* Files List */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Files using storage ({filesOnly.length})</h2>

            {filesOnly.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No files are using storage</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Last modified</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">File size</th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filesOnly.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                        viewModeContext={currentView}
                        isSelected={selectedFiles.includes(file.id)}
                        onToggleSelect={toggleFileSelection}
                        onClick={() => handleFileClick(file)}
                        onDelete={handleDelete}
                        onToggleStar={handleToggleStar}
                        onMove={handleMove}
                        onMoveFile={handleConfirmMove}
                        onRefresh={loadFiles}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // HOME VIEW - Centered layout
  if (currentView === 'home') {
    // If there's a search query, show search results instead of welcome screen
    if (searchQuery) {
      let currentTitle = `Search results for "${searchQuery}"`;

      return (
        <main className="flex-1 overflow-auto bg-white relative" onDragEnter={handleDragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-600 rounded-lg flex items-center justify-center z-40 pointer-events-none">
              <p className="text-2xl font-bold text-blue-700">Drop files to upload</p>
            </div>
          )}

          <div className="p-6">
            {/* Search input in results view */}
            <div className="w-full max-w-3xl mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search in Drive"
                  value={localSearchQuery}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:shadow-md rounded-2xl outline-none transition-all"
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocalSearchQuery(value);
                    // Only submit search on Enter or when cleared
                    if (value === '' && onSearchSubmit) {
                      onSearchSubmit('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && onSearchSubmit) {
                      onSearchSubmit(localSearchQuery);
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-700">{currentTitle}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="List view">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                  </svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Grid view">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
                  </svg>
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Owner</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Last modified</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">File size</th>
                      <th className="w-12 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-16">{renderEmptyState()}</td>
                      </tr>
                    ) : (
                      files.map((file) => (
                        <FileItem
                          key={file.id}
                          file={file}
                          viewMode="list"
                          viewModeContext={currentView}
                          isSelected={selectedFiles.includes(file.id)}
                          onToggleSelect={toggleFileSelection}
                          onClick={() => handleFileClick(file)}
                          onDelete={handleDelete}
                          onToggleStar={handleToggleStar}
                          onMove={handleMove}
                          onMoveFile={handleConfirmMove}
                          onRefresh={loadFiles}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {files.length === 0 ? (
                  <div className="col-span-full">{renderEmptyState()}</div>
                ) : (
                  files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="grid"
                      viewModeContext={currentView}
                      isSelected={selectedFiles.includes(file.id)}
                      onToggleSelect={toggleFileSelection}
                      onClick={() => handleFileClick(file)}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      onMove={handleMove}
                      onMoveFile={handleConfirmMove}
                      onRefresh={loadFiles}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <MoveModal
            isOpen={isMoveModalOpen}
            onClose={() => setIsMoveModalOpen(false)}
            onMove={(newParentId) => handleConfirmMove(movingFile.id, newParentId)}
            allFiles={files}
            movingFile={movingFile}
          />
        </main>
      );
    }

    // Welcome screen when no search query
    return (
      <main className="flex-1 overflow-auto bg-white relative" onDragEnter={handleDragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
        {isDragging && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-600 rounded-lg flex items-center justify-center z-40 pointer-events-none">
            <p className="text-2xl font-bold text-blue-700">Drop files to upload</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center px-6 py-12">
          <h1 className="text-3xl font-normal text-gray-800 mb-8">Welcome to Drive</h1>

          <div className="w-full max-w-3xl mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search in Drive"
                value={localSearchQuery}
                className="w-full pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:shadow-md rounded-2xl outline-none transition-all"
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalSearchQuery(value);
                  // Only submit search on Enter or when cleared
                  if (value === '' && onSearchSubmit) {
                    onSearchSubmit('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearchSubmit) {
                    onSearchSubmit(localSearchQuery);
                  }
                }}
              />
            </div>
          </div>

          {suggestedFiles.length > 0 && (
            <div className="w-full max-w-7xl">
              <h2 className="text-sm font-medium text-gray-700 mb-4 text-left">Suggested</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedFiles.map((file) => {
                  const fullFile = files.find(f => f.id === file.id);
                  return (
                    <div
                      key={file.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => fullFile && handleFileClick(fullFile)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.modified}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  let currentTitle = 'My Drive';
  if (searchQuery) {
    currentTitle = `Search results for "${searchQuery}"`;
  } else if (showStarred) {
    currentTitle = 'Starred';
  } else if (currentView === 'trash') {
    currentTitle = 'Trash';
  } else if (currentView === 'shared') {
    currentTitle = 'Shared with me';
  } else if (currentView === 'recent') {
    currentTitle = 'Recent';
  } else if (currentView === 'spam') {
    currentTitle = 'Spam';
  }

  // REGULAR VIEW (My Drive, Starred, etc.) - Edge-to-edge, left-aligned
  return (
    <main className="flex-1 overflow-auto bg-white relative" onDragEnter={handleDragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-600 rounded-lg flex items-center justify-center z-40 pointer-events-none">
          <p className="text-2xl font-bold text-blue-700">Drop files to upload</p>
        </div>
      )}

      <div className="p-6">
        {/* Breadcrumb Navigation */}
        {!showStarred && !searchQuery && (folderStack.length > 0 || currentFolderId !== null) && (
          <div className="mb-4">
            <nav className="flex items-center" style={{ height: '2.5rem', lineHeight: '2.5rem', color: 'rgb(95, 99, 104)' }}>
              <button onClick={() => onNavigateToFolder(null)} className="hover:bg-gray-100 transition-colors px-4 py-1 rounded">
                My Drive
              </button>
              {folderStack.map((folder) => (
                <React.Fragment key={folder.id}>
                  <span className="mx-1">›</span>
                  <button onClick={() => onNavigateToFolder(folder.id, folder.name)} className="hover:bg-gray-100 transition-colors px-4 py-1 rounded">
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
              {currentFolderName && (
                <>
                  <span className="mx-1">›</span>
                  <span className="px-4 py-1">{currentFolderName}</span>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Suggested Section */}
        {!showStarred && !searchQuery && suggestedFiles.length > 0 && currentView === 'my-drive' && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Suggested</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggestedFiles.map((file) => (
                <div key={file.id} className="flex-shrink-0 w-64 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.modified}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">{currentTitle}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="List view">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} title="Grid view">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
                </svg>
              </button>
            </div>
          </div>

          {/* File List/Grid */}
          {viewMode === 'list' ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Owner</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">Last modified</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600">File size</th>
                    <th className="w-12 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-16">{renderEmptyState()}</td>
                    </tr>
                  ) : (
                    files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                        viewModeContext={currentView}
                        isSelected={selectedFiles.includes(file.id)}
                        onToggleSelect={toggleFileSelection}
                        onClick={() => handleFileClick(file)}
                        onDelete={handleDelete}
                        onToggleStar={handleToggleStar}
                        onMove={handleMove}
                        onMoveFile={handleConfirmMove}
                        onRefresh={loadFiles}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.length === 0 ? (
                <div className="col-span-full">{renderEmptyState()}</div>
              ) : (
                files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    viewModeContext={currentView}
                    isSelected={selectedFiles.includes(file.id)}
                    onToggleSelect={toggleFileSelection}
                    onClick={() => handleFileClick(file)}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                    onMove={handleMove}
                    onMoveFile={handleConfirmMove}
                    onRefresh={loadFiles}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>

      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onMove={(newParentId) => handleConfirmMove(movingFile.id, newParentId)}
        allFiles={files}
        movingFile={movingFile}
      />
    </main>
  );
};

export default MainContent;