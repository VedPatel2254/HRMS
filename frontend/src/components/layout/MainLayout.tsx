import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
          title={pageTitle}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-[1400px] mx-auto">
            <Outlet context={{ setPageTitle }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
