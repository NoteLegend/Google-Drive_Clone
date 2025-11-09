import React, { useState, useEffect, useRef } from 'react';

const RightSidebar = () => {
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActivePanel(null);
      }
    };

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel]);

  const SidePanel = ({ title, onClose }) => (
    <div
      ref={panelRef}
      className="absolute right-14 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg z-40"
    >
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full"
          title="Close"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500">Content for {title} will appear here.</p>
      </div>
    </div>
  );

  const iconButtonClasses = "p-2 hover:bg-gray-200 rounded-full cursor-pointer";

  return (
    <>
      <aside className="w-14 h-full bg-white border-l border-gray-200 flex flex-col items-center py-4 gap-4 relative">
        <button
          className={iconButtonClasses}
          title="Calendar"
          onClick={() => setActivePanel('calendar')}
        >
          <img
            src="https://www.gstatic.com/companion/icon_assets/calendar_2020q4_2x.png"
            alt="Calendar"
            className="w-6 h-6"
          />
        </button>
        <button
          className={iconButtonClasses}
          title="Keep"
          onClick={() => setActivePanel('keep')}
        >
          <img
            src="https://www.gstatic.com/companion/icon_assets/keep_2020q4v3_2x.png"
            alt="Keep"
            className="w-6 h-6"
          />
        </button>
        <button
          className={iconButtonClasses}
          title="Tasks"
          onClick={() => setActivePanel('tasks')}
        >
          <img
            src="https://www.gstatic.com/companion/icon_assets/tasks_2021_2x.png"
            alt="Tasks"
            className="w-6 h-6"
          />
        </button>
        <button
          className={iconButtonClasses}
          title="Contacts"
          onClick={() => setActivePanel('contacts')}
        >
          <img
            src="https://www.gstatic.com/companion/icon_assets/contacts_2022_2x.png"
            alt="Contacts"
            className="w-6 h-6"
          />
        </button>
        
        <div className="flex-grow border-b border-gray-300 w-1/2 my-2"></div>

        <button className={iconButtonClasses} title="Get Add-ons">
          <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </aside>

      {activePanel && (
        <SidePanel
          title={activePanel.charAt(0).toUpperCase() + activePanel.slice(1)}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
};

export default RightSidebar;


