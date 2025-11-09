import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import RightSidebar from '../components/RightSidebar';

function Home() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState('home');
  const [searchQuery, setSearchQuery] = useState(''); 

  const handleFolderClick = (folder) => {
    // If clicking a folder from any view other than "My Drive", switch to "My Drive" first
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
    setSearchQuery('');
    
    // Reset folder navigation when switching to any new root view
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setFolderStack([]);
  };

  // Handle logo click to navigate to Home
  const handleLogoClick = () => {
    handleViewModeChange('home');
  };

  const parentId = viewMode === 'my-drive' ? currentFolderId : null;
  const showStarred = viewMode === 'starred';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        setSearchQuery={setSearchQuery}
        onSearchSubmit={setSearchQuery}
        onLogoClick={handleLogoClick}
        viewMode={viewMode}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentFolderId={currentFolderId}
          onFileUpload={handleRefresh}
          onFolderCreate={handleRefresh}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
        <MainContent 
          parentFolderId={parentId}
          showStarred={showStarred}
          searchQuery={searchQuery}
          viewMode={viewMode}
          onFolderClick={handleFolderClick}
          refreshTrigger={refreshTrigger}
          folderStack={folderStack}
          currentFolderId={currentFolderId}
          currentFolderName={currentFolderName}
          onNavigateToFolder={handleNavigateToFolder}
          onSearchSubmit={setSearchQuery}
        />
        <RightSidebar />
      </div>
    </div>
  );
}

export default Home;