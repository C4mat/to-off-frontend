"use client"

import { cn } from "@/lib/utils"
import { useSidebar } from "@/hooks/use-sidebar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import Link from "next/link"
import { navigationConfig } from "@/config/navigation"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const { user } = useAuth()

    return (
    <>
      {/* Sidebar Toggle Button - visible only on mobile */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-md z-50 lg:hidden"
        onClick={toggle}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-64",
          className,
        )}
      >
        {/* Logo and App Name */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-semibold">Tô Off</span>
          </Link>
          </div>

          {/* User Info */}
        <div className="border-b border-gray-200 p-4">
            <div className="flex items-center space-x-3">
            <div className="relative h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
              {user?.nome?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.nome || "Usuário"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.grupo_nome || "Grupo não definido"}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant="outline" className="bg-gray-100">
                {user?.tipo_usuario === "rh" ? "RH" : user?.tipo_usuario === "gestor" ? "Gestor" : "Comum"}
              </Badge>
            {user?.UF && (
              <Badge variant="outline" className="mt-2 ml-1 bg-gray-100">
                {user.UF}
              </Badge>
            )}
            </div>
          </div>

          {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-9rem)]">
          <div className="px-3 py-2">
            {navigationConfig.map((section) => (
              <div key={section.title} className="mb-4">
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.title}
                    </h3>
                <div className="mt-1 space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                          isActive
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        {item.icon && (
                          <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0")} />
                        )}
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
            </div>
            ))}
          </div>
        </ScrollArea>
      </aside>
    </>
  )
}
