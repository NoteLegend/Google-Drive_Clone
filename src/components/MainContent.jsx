import React, { useState, useEffect } from 'react';
import FileItem from './FileItem';
import { fetchFiles, deleteFile, toggleStar, downloadFile } from '../utils/api';

const MainContent = ({ parentFolderId, onFolderClick, refreshTrigger, folderStack, currentFolderId, currentFolderName, onNavigateToFolder, showStarred = false }) => {
  // Load view mode from localStorage, default to 'grid'
  const [viewMode, setViewMode] = useState(() => {
    const savedViewMode = localStorage.getItem('drive-view-mode');
    return savedViewMode || 'grid';
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('drive-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    loadFiles();
  }, [parentFolderId, refreshTrigger, showStarred]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('MainContent loadFiles - showStarred:', showStarred, 'parentFolderId:', parentFolderId);
      const data = await fetchFiles(showStarred ? null : parentFolderId, showStarred);
      console.log('MainContent received', data.length, 'files');
      // Double-check: filter out any unstarred files on client side as well
      const filteredData = showStarred ? data.filter(file => file.starred === true) : data;
      console.log('After client-side filter:', filteredData.length, 'files');
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
      // In starred view, navigate to the folder by switching to My Drive view
      if (showStarred) {
        // This will be handled by the parent component to switch to My Drive and navigate
        onFolderClick(file);
        return;
      }
      onFolderClick(file);
    } else {
      // Open/download file
      try {
        await downloadFile(file.id, file.name);
      } catch (err) {
        alert('Failed to open file: ' + err.message);
      }
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

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

  // Helper function to get file icon (same as FileItem)
  const getFileIcon = (type) => {
    switch (type) {
      case 'folder':
        return (
          <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        );
      case 'presentation':
        return (
          <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z"/>
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      case 'image':
        return (
          <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
        );
    }
  };

  const suggestedFiles = files
    .filter(file => file.type !== 'folder')
    .slice(0, 2)
    .map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      modified: file.modified
    }));

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  if (loading) {
    return (
      <main className="flex-1 overflow-auto bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <p className="text-gray-500">Loading files...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-auto bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={loadFiles}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb Navigation */}
        {!showStarred && (folderStack.length > 0 || currentFolderId !== null) && (
          <div className="mb-4">
            <nav 
              className="flex items-center"
              style={{
                height: '2.5rem',
                lineHeight: '2.5rem',
                paddingRight: '24px',
                color: 'rgb(95, 99, 104)'
              }}
            >
              <button
                onClick={() => onNavigateToFolder(null)}
                className="hover:bg-gray-100 transition-colors"
                style={{
                  font: '400 1.5rem / 2rem "Google Sans", "Google Sans", Roboto, Arial, sans-serif',
                  letterSpacing: '0',
                  borderRadius: '0.25rem',
                  lineHeight: '1.75rem',
                  margin: '0.125rem 0',
                  padding: '0.25rem 1rem',
                  boxSizing: 'border-box',
                  color: 'rgb(95, 99, 104)',
                  cursor: 'pointer',
                  display: 'inline-block',
                  flex: '0 1 auto',
                  overflow: 'hidden',
                  position: 'relative',
                  textOverflow: 'ellipsis',
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                  maxWidth: '18.75rem'
                }}
              >
                My Drive
              </button>
              {folderStack.map((folder) => (
                <React.Fragment key={folder.id}>
                  <span className="mx-1" style={{ color: 'rgb(95, 99, 104)' }}>›</span>
                  <button
                    onClick={() => onNavigateToFolder(folder.id, folder.name)}
                    className="hover:bg-gray-100 transition-colors"
                    style={{
                      font: '400 1.5rem / 2rem "Google Sans", "Google Sans", Roboto, Arial, sans-serif',
                      letterSpacing: '0',
                      borderRadius: '0.25rem',
                      lineHeight: '1.75rem',
                      margin: '0.125rem 0',
                      padding: '0.25rem 1rem',
                      boxSizing: 'border-box',
                      color: 'rgb(95, 99, 104)',
                      cursor: 'pointer',
                      display: 'inline-block',
                      flex: '0 1 auto',
                      overflow: 'hidden',
                      position: 'relative',
                      textOverflow: 'ellipsis',
                      verticalAlign: 'top',
                      whiteSpace: 'nowrap',
                      maxWidth: '18.75rem'
                    }}
                  >
                    {folder.name}
                  </button>
                </React.Fragment>
              ))}
              {currentFolderName && (
                <>
                  <span className="mx-1" style={{ color: 'rgb(95, 99, 104)' }}>›</span>
                  <div className="flex items-center gap-1">
                    <span
                      style={{
                        font: '400 1.5rem / 2rem "Google Sans", "Google Sans", Roboto, Arial, sans-serif',
                        letterSpacing: '0',
                        borderRadius: '0.25rem',
                        lineHeight: '1.75rem',
                        margin: '0.125rem 0',
                        padding: '0.25rem 1rem',
                        boxSizing: 'border-box',
                        color: 'rgb(95, 99, 104)',
                        display: 'inline-block',
                        flex: '0 1 auto',
                        overflow: 'hidden',
                        position: 'relative',
                        textOverflow: 'ellipsis',
                        verticalAlign: 'top',
                        whiteSpace: 'nowrap',
                        maxWidth: '18.75rem'
                      }}
                    >
                      {currentFolderName}
                    </span>
                    <svg 
                      className="text-gray-600" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        width: '1rem',
                        height: '1rem',
                        color: 'rgb(95, 99, 104)'
                      }}
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Suggested Section - Only show in My Drive, not in Starred */}
        {!showStarred && suggestedFiles.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Suggested</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggestedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex-shrink-0 w-64 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
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

        {/* My Drive / Starred Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">{showStarred ? 'Starred' : 'My Drive'}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="List view"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                title="Grid view"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded" title="Info">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
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
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        No files yet. Upload a file or create a folder to get started.
                      </td>
                    </tr>
                  ) : (
                    files.map((file) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        viewMode="list"
                        isSelected={selectedFiles.includes(file.id)}
                        onToggleSelect={toggleFileSelection}
                        onClick={() => handleFileClick(file)}
                        onDelete={handleDelete}
                        onToggleStar={handleToggleStar}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No files yet. Upload a file or create a folder to get started.
                </div>
              ) : (
                files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    isSelected={selectedFiles.includes(file.id)}
                    onToggleSelect={toggleFileSelection}
                    onClick={() => handleFileClick(file)}
                    onDelete={handleDelete}
                    onToggleStar={handleToggleStar}
                  />
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MainContent;
