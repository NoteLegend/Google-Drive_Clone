import React, { useState, useEffect, useRef } from 'react';

const FileItem = ({ file, viewMode, isSelected, onToggleSelect, onClick, onDelete, onToggleStar, onMove, onMoveFile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
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
      onMove(file);
    }
    setShowMenu(false);
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

  const ContextMenu = () => (
    showMenu && (
      <div 
        ref={menuRef}
        className="fixed w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
        style={{ top: menuPosition.y, left: menuPosition.x }}
        onClick={handleMenuClick}
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
      {file.starred && (
        <div className="absolute top-2 right-2 z-10">
          <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
      )}
      
      {/* Three-dot menu button - only visible on hover */}
      {!file.starred && (
        <button
          onClick={handleThreeDotsClick}
          className={`absolute top-2 right-2 z-10 p-1 hover:bg-gray-200 rounded transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          title="More actions"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      )}

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