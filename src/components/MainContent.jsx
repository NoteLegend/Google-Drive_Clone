import React, { useState } from 'react';
import FileItem from './FileItem';

const MainContent = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedFiles, setSelectedFiles] = useState([]);

  const files = [
    { id: 1, name: 'Project Proposal.docx', type: 'document', size: '2.4 MB', modified: 'Nov 1, 2025', owner: 'me', starred: false },
    { id: 2, name: 'Budget 2025', type: 'spreadsheet', size: '1.8 MB', modified: 'Oct 30, 2025', owner: 'me', starred: true },
    { id: 3, name: 'Presentation.pptx', type: 'presentation', size: '5.2 MB', modified: 'Oct 28, 2025', owner: 'me', starred: false },
    { id: 4, name: 'Team Photos', type: 'folder', size: '—', modified: 'Oct 25, 2025', owner: 'me', starred: false },
    { id: 5, name: 'Meeting Notes.pdf', type: 'pdf', size: '890 KB', modified: 'Oct 24, 2025', owner: 'John Doe', starred: false },
    { id: 6, name: 'Design Assets', type: 'folder', size: '—', modified: 'Oct 20, 2025', owner: 'me', starred: true },
    { id: 7, name: 'Report.docx', type: 'document', size: '3.1 MB', modified: 'Oct 18, 2025', owner: 'me', starred: false },
    { id: 8, name: 'Data Analysis.xlsx', type: 'spreadsheet', size: '4.5 MB', modified: 'Oct 15, 2025', owner: 'Jane Smith', starred: false },
  ];

  const suggestedFiles = [
    { id: 101, name: 'Q4 Report.docx', type: 'document', modified: '2 hours ago' },
    { id: 102, name: 'Marketing Plan', type: 'folder', modified: 'Yesterday' },
  ];

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  return (
    <main className="flex-1 overflow-auto bg-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Suggested Section */}
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
                    {file.type === 'folder' ? (
                      <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                    )}
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

        {/* My Drive Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">My Drive</h2>
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
                  {files.map((file) => (
                    <FileItem
                      key={file.id}
                      file={file}
                      viewMode="list"
                      isSelected={selectedFiles.includes(file.id)}
                      onToggleSelect={toggleFileSelection}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  viewMode="grid"
                  isSelected={selectedFiles.includes(file.id)}
                  onToggleSelect={toggleFileSelection}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MainContent;
