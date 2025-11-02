import React, { useState, useEffect, useRef } from 'react';

const FileItem = ({ file, viewMode, isSelected, onToggleSelect, onClick, onDelete, onToggleStar, onMove, onMoveFile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    // Close menu on any click or right-click
    const handleGlobalClick = () => setShowMenu(false);

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
    // For files, handle single click
    if (file.type !== 'folder') {
      if (onClick) {
        onClick(file);
      }
    }
    // For folders, we only handle double-click (see onDoubleClick below)
  };

  const handleDoubleClick = (e) => {
    // For folders, only open on double-click
    if (file.type === 'folder' && onClick) {
      onClick(file);
    }
  };

  // --- START NEW/MODIFIED HANDLERS ---
  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  const handleMenuClick = (e) => {
    // Stop propagation so clicking on the menu doesn't close it
    e.stopPropagation();
  };

  const handleStarClick = (e) => {
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(file.id);
    }
    setShowMenu(false);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(file.id);
    }
    setShowMenu(false);
  };
  
  const handleMoveClick = (e) => {
    e.stopPropagation();
    if (onMove) {
      onMove(file); // Pass the whole file object
    }
    setShowMenu(false);
  };

  // --- DRAG-AND-DROP HANDLERS ---
  const handleDragStart = (e) => {
    e.stopPropagation();
    // Set data so we know what file is being dragged
    e.dataTransfer.setData('application/json', JSON.stringify({ fileId: file.id, type: file.type, name: file.name }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    // Only allow dropping ON folders
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
        
        // Check if we have a valid file ID and it's not being dropped on itself
        if (movingFileId && movingFileId !== file.id) {
          // file.id is the ID of the folder we are dropping ONTO
          console.log(`Dropped file ${movingFileId} onto folder ${file.id}`);
          onMoveFile(movingFileId, file.id);
        }
      } catch (error) {
        console.error('Failed to parse drag data', error);
      }
    }
  };
  // --- END NEW/MODIFIED HANDLERS ---

  // Shared component for the context menu
  const ContextMenu = () => (
    showMenu && (
      <div 
        ref={menuRef}
        className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
        style={{ top: menuPosition.y, left: menuPosition.x }}
        onClick={handleMenuClick} // Stop propagation
      >
        <button
          onClick={handleStarClick}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {file.starred ? 'Unstar' : 'Add to Starred'}
        </button>
        <button
          onClick={handleMoveClick}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          Move
        </button>
        <div className="border-t border-gray-100 my-1"></div>
        <button
          onClick={handleDeleteClick}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          Move to Trash
        </button>
      </div>
    )
  );

  if (viewMode === 'list') {
    return (
      <tr 
        className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer select-none ${isDraggingOver ? 'bg-blue-100' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
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
          {/* The 3-dot menu button is removed. */}
          {/* The ContextMenu component will be rendered at the root of the app (handled by its 'fixed' positioning) */}
          <ContextMenu />
        </td>
      </tr>
    );
  }

  return (
    <div 
      className={`group relative border rounded-lg p-4 hover:bg-gray-50 hover:shadow-md transition-all cursor-pointer select-none ${isDraggingOver ? 'border-blue-500 bg-blue-100 shadow-lg' : 'border-gray-200'}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      draggable="true"
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {file.starred && (
        <div className="absolute top-2 right-2 z-10">
          <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
      )}
      
      {/* The 3-dot menu button is removed */}

      {/* Render the context menu */}
      <ContextMenu />

      <div className="w-full aspect-square mb-3 flex items-center justify-center pointer-events-none">
        <div className="w-16 h-16">{getFileIcon(file.type)}</div>
      </div>
      <p className="text-sm text-gray-900 truncate mb-1 pointer-events-none">{file.name}</p>
      <p className="text-xs text-gray-500 pointer-events-none">{file.modified}</p>
    </div>
  );
};

export default FileItem;