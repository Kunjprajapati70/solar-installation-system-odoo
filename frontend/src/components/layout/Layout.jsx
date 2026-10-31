import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import DemoRoleBar from '../common/DemoRoleBar';
import { motion, AnimatePresence } from 'framer-motion';
import Breadcrumbs from './Breadcrumbs';

const Layout = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sunpower_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sunpower_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-midnight-950 text-slate-100 transition-colors duration-200">
      {/* 1. Left Fixed Sidebar (Full height) */}
      <Sidebar
        isOpen={isMobileDrawerOpen}
        closeSidebar={() => setIsMobileDrawerOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      {/* 2. Right Workspace Container (Padded left on desktop to clear sidebar) */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Global Persona Switcher Banner */}
        <DemoRoleBar />

        {/* Top Header Navigation (Sticky within right column, never overlaps sidebar) */}
        <Navbar
          toggleSidebar={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          isSidebarOpen={isMobileDrawerOpen}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
        />

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          <Breadcrumbs />
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Layout;
