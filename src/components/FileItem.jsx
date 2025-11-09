import React, { useState, useEffect, useRef } from 'react';
import { renameFile, copyFile, restoreFile, deleteFileForever } from '../utils/api';

const FileItem = ({ file, viewMode, viewModeContext, isSelected, onToggleSelect, onClick, onDelete, onToggleStar, onMove, onMoveFile, onRefresh }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredSubmenu, setHoveredSubmenu] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ x: 0, y: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const menuRef = useRef(null);

  // --- CORRECTION START ---
  // Use separate refs for each submenu
  const openWithSubmenuRef = useRef(null);
  const organiseSubmenuRef = useRef(null);
  // Ref to hold the leave timer
  const leaveTimeoutRef = useRef(null);
  // --- CORRECTION END ---

  useEffect(() => {
    setNewName(file.name);
  }, [file.name]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // --- CORRECTION START ---
      // Check against the main menu and *both* submenus
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          (!openWithSubmenuRef.current || !openWithSubmenuRef.current.contains(event.target)) &&
          (!organiseSubmenuRef.current || !organiseSubmenuRef.current.contains(event.target))
      ) {
      // --- CORRECTION END ---
        setShowMenu(false);
        setHoveredSubmenu(null);
      }
    };
    
    const handleGlobalClick = () => {
      setShowMenu(false);
      setHoveredSubmenu(null);
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleGlobalClick);
      document.addEventListener('contextmenu', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('contextmenu', handleGlobalClick);
    };
  }, [showMenu]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'folder':
        return (
          <svg className="w-full h-full text-gray-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
          </svg>
        );
      case 'document':
        return (
          <svg className="w-full h-full text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      case 'spreadsheet':
        return (
          <svg className="w-full h-full text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        );
      case 'presentation':
        return (
          <svg className="w-full h-full text-yellow-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zm-10-7h9v6h-9z"/>
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-full h-full text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-full h-full text-gray-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
        );
    }
  };

  const handleClick = (e) => {
    if (file.type !== 'folder') {
      if (onClick) {
        onClick(file);
      }
    }
  };

  const handleDoubleClick = (e) => {
    if (file.type === 'folder' && onClick) {
      onClick(file);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(file.id);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(file.id);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };
  
  const handleMoveClick = (e) => {
    e.stopPropagation();
    if (onMove) {
      onMove(file);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    if (file.type !== 'folder' && onClick) {
      onClick(file);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    alert('Not implemented');
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleOpenInNewTab = (e) => {
    e.stopPropagation();
    alert('Not implemented');
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleRename = (e) => {
    e.stopPropagation();
    setNewName(file.name);
    setIsRenaming(true);
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleSubmitRename = async (e) => {
    e.stopPropagation();
    try {
      await renameFile(file.id, newName);
      setIsRenaming(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to rename: ' + error.message);
    }
  };

  const handleMakeCopy = async (e) => {
    e.stopPropagation();
    try {
      await copyFile(file.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to copy: ' + error.message);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleRestore = async (e) => {
    e.stopPropagation();
    try {
      await restoreFile(file.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to restore: ' + error.message);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleDeleteForever = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteFileForever(file.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    alert('Not implemented');
    setShowMenu(false);
    setHoveredSubmenu(null);
  };

  const handleSubmenuHover = (submenuName, e) => {
    // --- CORRECTION START ---
    // Clear any pending timer to close the menu
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    // --- CORRECTION END ---

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSubmenuPosition({ x: rect.right + 5, y: rect.top });
    }
    setHoveredSubmenu(submenuName);
  };

  const handleSubmenuLeave = () => {
    // --- CORRECTION START ---
    // Start a timer to close the submenu, storing its ID
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredSubmenu(null);
    }, 200);
    // --- CORRECTION END ---
  };

  // Three-dot menu button click handler
  const handleThreeDotsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
    setShowMenu(true);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ fileId: file.id, type: file.type, name: file.name }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (file.type === 'folder') {
      e.preventDefault(); 
      e.stopPropagation();
      setIsDraggingOver(true);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e) => {
    if (file.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e) => {
    if (file.type === 'folder') {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const movingFileId = data.fileId;
        
        if (movingFileId && movingFileId !== file.id) {
          onMoveFile(movingFileId, file.id);
        }
      } catch (error) {
        console.error('Failed to parse drag data', error);
      }
    }
  };

  const ContextMenu = () => {
    // Check if file is deleted or we're in trash view
    const isDeleted = file.deleted === true || file.deleted === 1;
    const inTrashView = viewModeContext === 'trash';

    if (isDeleted || inTrashView) {
      // Trash menu - only Restore and Delete forever
      return (
        showMenu && (
          <div 
            ref={menuRef}
            className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
            style={{ top: menuPosition.y, left: menuPosition.x }}
            onClick={handleMenuClick}
          >
            <button
              onClick={handleRestore}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Restore
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={handleDeleteForever}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete forever
            </button>
          </div>
        )
      );
    }

    // Normal menu
    return (
      showMenu && (
        <>
          <div 
            ref={menuRef}
            className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
            style={{ top: menuPosition.y, left: menuPosition.x }}
            onClick={handleMenuClick}
            onMouseLeave={handleSubmenuLeave} // Add leave handler to main menu
          >
            {/* Open with submenu */}
          <div
            className="relative"
            onMouseEnter={(e) => handleSubmenuHover('openWith', e)}
            // onMouseLeave={handleSubmenuLeave} // This was causing the flicker, remove it
          >
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
              <span>Open with</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </button>
            {hoveredSubmenu === 'openWith' && (
              <div
                // --- CORRECTION START ---
                ref={openWithSubmenuRef} // Use correct ref
                className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                style={{ top: submenuPosition.y, left: submenuPosition.x }}
                // Clear the leave timer when entering the submenu
                onMouseEnter={() => {
                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }
                  setHoveredSubmenu('openWith');
                }}
                onMouseLeave={() => setHoveredSubmenu(null)}
                // --- CORRECTION END ---
              >
                <button
                  onClick={handlePreview}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Preview
                </button>
                <button
                  onClick={handleOpenInNewTab}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Open in new tab
                </button>
              </div>
            )}
          </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Download - only for files */}
            {file.type !== 'folder' && (
              <button
                onClick={handleDownloadClick}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Download
              </button>
            )}

            <button
              onClick={handleRename}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Rename
            </button>

            <button
              onClick={handleMakeCopy}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Make a copy
            </button>

            <button
              onClick={handleShare}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Share
            </button>

            {/* Organise submenu */}
            <div
              className="relative"
              onMouseEnter={(e) => handleSubmenuHover('organise', e)}
              // onMouseLeave={handleSubmenuLeave} // This was causing the flicker, remove it
            >
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                <span>Organise</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                </svg>
              </button>
              {hoveredSubmenu === 'organise' && (
                <div
                  // --- CORRECTION START ---
                  ref={organiseSubmenuRef} // Use correct ref
                  className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  style={{ top: submenuPosition.y, left: submenuPosition.x }}
                  // Clear the leave timer when entering the submenu
                  onMouseEnter={() => {
                    if (leaveTimeoutRef.current) {
                      clearTimeout(leaveTimeoutRef.current);
                      leaveTimeoutRef.current = null;
                    }
                    setHoveredSubmenu('organise');
                  }}
                  onMouseLeave={() => setHoveredSubmenu(null)}
                  // --- CORRECTION END ---
                >
                  <button
                    onClick={handleMoveClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Move
                  </button>
                  <button
                    onClick={handleStarClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {file.starred ? 'Remove from Starred' : 'Add to Starred'}
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-1"></div>

            {/* Move to Trash */}
            <button
              onClick={handleDeleteClick}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Move to Trash
            </button>
          </div>
        </>
      )
    );
  };

  if (viewMode === 'list') {
    return (
      <>
      <tr 
        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer select-none ${isDraggingOver ? 'bg-blue-100' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable="true"
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 flex-shrink-0">{getFileIcon(file.type)}</div>
            <span className="text-sm text-gray-900">{file.name}</span>
            {file.starred && (
              <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{file.owner}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{file.modified}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{file.size}</td>
        <td className="px-4 py-3 relative">
          {/* Three-dot menu button - only visible on hover */}
          <button
            onClick={handleThreeDotsClick}
            className={`p-1 hover:bg-gray-200 rounded transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            title="More actions"
          >
            <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          <ContextMenu />
        </td>
      </tr>
      {/* Rename Modal for list view */}
      {isRenaming && (
        <tr>
          <td colSpan="5" className="p-0">
            <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setIsRenaming(false)}>
              <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Rename</h2>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitRename(e);
                    } else if (e.key === 'Escape') {
                      setIsRenaming(false);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRename}
                    className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
      </>
    );
  }

  return (
    <div 
      className={`group relative border rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer select-none ${isDraggingOver ? 'border-blue-500 bg-blue-100 shadow-lg' : 'border-gray-200'}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable="true"
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Three-dot menu button - always visible on hover */}
      <button
        onClick={handleThreeDotsClick}
        className={`absolute top-2 right-2 z-10 p-1 hover:bg-gray-200 rounded transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        title="More actions"
      >
        <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>

      <ContextMenu />

      <div className="w-full aspect-square mb-3 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16">{getFileIcon(file.type)}</div>
      </div>
      <div className="flex items-center gap-2 pointer-events-none">
        <p className="text-sm text-gray-900 truncate mb-1 flex-1">{file.name}</p>
        {file.starred && (
          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mb-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        )}
      </div>
      <p className="text-xs text-gray-500 pointer-events-none">{file.modified}</p>

      {/* Rename Modal */}
      {isRenaming && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={() => setIsRenaming(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Rename</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitRename(e);
                } else if (e.key === 'Escape') {
                  setIsRenaming(false);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsRenaming(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRename}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileItem;