import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const mainRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('sidebarCollapsed');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const sidebarRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const sidebarOffset = isMobile ? '0px' : desktopSidebarCollapsed ? '64px' : '256px';
    document.documentElement.style.setProperty('--sidebar-offset', sidebarOffset);
    window.dispatchEvent(new Event('sidebar-offset-change'));
  }, [isMobile, desktopSidebarCollapsed]);

  // Reset scroll when navigating so the previous page's position is not kept.
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainRef.current) mainRef.current.scrollTop = 0;
    };
    resetScroll();
    const frame = requestAnimationFrame(resetScroll);
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.search, location.hash]);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      const nextCollapsed = !desktopSidebarCollapsed;
      setDesktopSidebarCollapsed(nextCollapsed);
      setSidebarHovered(false);
      try {
        localStorage.setItem('sidebarCollapsed', String(nextCollapsed));
      } catch {
        /* ignore */
      }
    }
  };

  const handleOverlayClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const handleSidebarHover = (hovered) => {
    if (!isMobile) setSidebarHovered(hovered);
  };

  const isSidebarExpanded = () => {
    if (isMobile) return false;
    if (sidebarHovered) return true;
    return !desktopSidebarCollapsed;
  };

  const getContentMargin = () => {
    if (isMobile) return 'ml-0';
    return desktopSidebarCollapsed ? 'ml-16' : 'ml-64';
  };

  return (
    <div className="min-h-screen bg-admin-bg">
      <Navbar
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        isDesktopSidebarExpanded={!desktopSidebarCollapsed}
      />

      <div className="relative flex">
        <div ref={sidebarRef} className="z-30">
          <Sidebar
            isMobile={isMobile}
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            onHover={handleSidebarHover}
            isExpanded={isSidebarExpanded()}
          />
        </div>

        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-slate-950/50 transition-opacity duration-300"
            onClick={handleOverlayClick}
            style={{ top: '56px' }}
          />
        )}

        <main
          ref={mainRef}
          className={`
            flex-1 transition-all duration-300 ease-out
            ${getContentMargin()}
            min-h-[calc(100vh-3.5rem)]
            overflow-x-hidden
          `}
          style={{
            padding: isMobile ? '0px' : '0',
            transition: 'margin-left 0.3s ease-out',
            maxWidth: isMobile
              ? '100%'
              : `calc(100vw - ${desktopSidebarCollapsed ? '64px' : '256px'})`,
          }}
        >
          <div className="w-full max-w-[1600px] p-4 sm:p-5 lg:p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
