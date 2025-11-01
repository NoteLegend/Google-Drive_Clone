import React, { useState } from 'react';

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState('my-drive');

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
        <button className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-gray-200 
                     hover:shadow-md transition-all">
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
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
        <p className="text-xs text-gray-600">2.3 GB of 15 GB used</p>
        <button className="mt-2 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
          Get more storage
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
