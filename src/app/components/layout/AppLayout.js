"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageContainer from "./PageContainer";

export default function AppLayout({ children, breadcrumbs = [], user = {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleSidebar() {
    setCollapsed((prev) => !prev);
  }

  function toggleMobileSidebar() {
    setMobileOpen((prev) => !prev);
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar (Desktop In-Flow / Mobile Slide-Over) */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          breadcrumbs={breadcrumbs}
          user={user}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={toggleMobileSidebar}
        />

        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
