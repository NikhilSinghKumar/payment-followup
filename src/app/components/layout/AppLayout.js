"use client";

import { useState } from "react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PageContainer from "./PageContainer";

export default function AppLayout({ children, breadcrumbs = [], user = {} }) {
  const [collapsed, setCollapsed] = useState(false);

  function toggleSidebar() {
    setCollapsed((prev) => !prev);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}

      <Sidebar collapsed={collapsed} />

      {/* Main */}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          breadcrumbs={breadcrumbs}
          user={user}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
        />

        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}
