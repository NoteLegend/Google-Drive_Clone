import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

// --- START NEW COMPONENT ---
// Added the new RightSidebar component as requested
const RightSidebar = () => {
  const iconButtonClasses = "p-2 hover:bg-gray-200 rounded-full cursor-pointer";

  return (
    <aside className="w-14 h-full bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-4">
      <button className={iconButtonClasses} title="Calendar">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zM5 8V6h14v2H5z"/>
        </svg>
      </button>
      <button className={iconButtonClasses} title="Keep">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V3H9v18zM16 3h-3.36c-.31-.62-.9-1-1.64-1h-4c-.74 0-1.33.38-1.64 1H2v2h14V3z"/>
        </svg>
      </button>
      <button className={iconButtonClasses} title="Tasks">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1.04 17.17l-2.83-2.83-1.41 1.41L12.96 20l5.66-5.66-1.41-1.41-4.25 4.24zM13 9V3.5L18.5 9H13z"/>
        </svg>
      </button>
      <button className={iconButtonClasses} title="Contacts">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </button>
      
      <div className="flex-grow border-b border-gray-300 w-1/2 my-2"></div>

      <button className={iconButtonClasses} title="Get Add-ons">
        <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </button>
    </aside>
  );
};
// --- END NEW COMPONENT ---


function Home() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // --- START CHANGES ---
  const [viewMode, setViewMode] = useState('home'); // Default to 'home'
  const [searchQuery, setSearchQuery] = useState(''); 
  // --- END CHANGES ---

  const handleFolderClick = (folder) => {
    // If clicking a folder from any view other than "My Drive",
    // switch to "My Drive" first.
    if (viewMode !== 'my-drive') {
      setViewMode('my-drive');
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setFolderStack([]);
    }
    
    // If we're currently in a folder, add it to the stack before navigating
    if (currentFolderId !== null) {
      setFolderStack([...folderStack, { id: currentFolderId, name: currentFolderName || 'Folder' }]);
    }
    
    // Navigate to the clicked folder
    setCurrentFolderId(folder.id);
    setCurrentFolderName(folder.name);
  };

  const handleNavigateToFolder = (targetFolderId, targetFolderName) => {
    if (targetFolderId === null) {
      // Navigate to root
      setCurrentFolderId(null);
      setCurrentFolderName(null);
      setFolderStack([]);
      return;
    }

    // Find the index of the target folder in the stack
    const targetIndex = folderStack.findIndex(f => f.id === targetFolderId);
    
    if (targetIndex !== -1) {
      // If found in stack, navigate to it by removing everything after it
      const targetFolder = folderStack[targetIndex];
      setFolderStack(folderStack.slice(0, targetIndex));
      setCurrentFolderId(targetFolderId);
      setCurrentFolderName(targetFolder.name);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewModeChange = (newViewMode) => {
    setViewMode(newViewMode);
    setSearchQuery(''); // Clear search when changing views
    
    // Reset folder navigation when switching to any new root view
    // This is the correct Drive behavior.
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setFolderStack([]);
  };

  // --- START CHANGES ---
  // Determine if the current view is a "root" view (like Home, Starred, etc.)
  // or a folder-based view (only 'my-drive').
  const parentId = viewMode === 'my-drive' ? currentFolderId : null;
  const showStarred = viewMode === 'starred';
  // --- END CHANGES ---

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* --- START CHANGES --- */}
      <Header 
        setSearchQuery={setSearchQuery} 
        onLogoClick={() => handleViewModeChange('home')} // Add logo click handler
      />
      {/* --- END CHANGES --- */}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentFolderId={currentFolderId}
          onFileUpload={handleRefresh}
          onFolderCreate={handleRefresh}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <MainContent 
          // --- START CHANGES ---
          parentFolderId={parentId} // Pass the correct parentId
          showStarred={showStarred}
          searchQuery={searchQuery}
          viewMode={viewMode} // Pass the full viewMode string
          // --- END CHANGES ---
          
          onFolderClick={handleFolderClick}
          refreshTrigger={refreshTrigger}
          folderStack={folderStack}
          currentFolderId={currentFolderId}
          currentFolderName={currentFolderName}
          onNavigateToFolder={handleNavigateToFolder}
        />
        {/* --- START CHANGES --- */}
        <RightSidebar />
        {/* --- END CHANGES --- */}
      </div>
    </div>
  );
}

export default Home;