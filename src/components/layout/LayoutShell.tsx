"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  }

  return (
    <>
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main
        className="flex-1 min-h-screen overflow-x-hidden transition-all duration-300"
        style={{ marginLeft: collapsed ? 60 : 240 }}
      >
        {children}
      </main>
    </>
  );
}
