"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Menu, Search, Bell, User, LogOut, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSidebar } from "@/hooks/use-sidebar"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationDropdown } from "./notification-dropdown"
import { ReactNode } from "react"

interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { user, logout } = useAuth()
  const { toggle } = useSidebar()

  const getUserTypeLabel = (tipo: string) => {
    switch (tipo) {
      case "rh":
        return "Recursos Humanos"
      case "gestor":
        return "Gestor"
      case "comum":
        return "Usuário Comum"
      default:
        return tipo
    }
  }

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 z-10">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="lg:hidden" onClick={toggle}>
          <Menu className="h-5 w-5" />
        </Button>

        {title && (
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Center - Search or Actions */}
      <div className="hidden md:flex flex-1 max-w-md mx-8 justify-center">
        {actions ? (
          actions
        ) : (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar eventos, usuários..." className="pl-10 pr-4" />
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-3">
        {/* Mobile Actions */}
        {actions && (
          <div className="md:hidden">
            {actions}
          </div>
        )}
        
        {/* Notifications */}
        <NotificationDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 h-10">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt={user?.nome || "Avatar"} />
                <AvatarFallback>{user?.nome?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">{getUserTypeLabel(user?.tipo_usuario || "")}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge
                    variant={
                      user?.tipo_usuario === "rh"
                        ? "default"
                        : user?.tipo_usuario === "gestor"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {getUserTypeLabel(user?.tipo_usuario || "")}
                  </Badge>
                  {user?.flag_gestor === "S" && (
                    <Badge variant="outline" className="text-xs">
                      Gestor
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
