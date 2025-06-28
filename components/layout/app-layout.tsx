"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const { isOpen } = useSidebar()

  return (
    <div className="flex h-screen bg-[#e3d0cf] overflow-hidden">
      {/* Sidebar - posicionado absolutamente */}
      <Sidebar />

      {/* Conteúdo principal com header fixo e espaço à esquerda */}
      <div className="flex-1 flex flex-col overflow-hidden pl-2 lg:pl-[17rem]">
        <Header title={title} subtitle={subtitle} actions={actions} />

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
