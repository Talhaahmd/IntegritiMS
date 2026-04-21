"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

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
      <motion.main
        initial={false}
        animate={{ marginLeft: collapsed ? 64 : 248 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        className="flex-1 min-h-screen overflow-x-hidden"
      >
        {children}
      </motion.main>
    </>
  );
}
