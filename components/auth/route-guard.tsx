"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientOnly } from "@/components/client-only"

interface RouteGuardProps {
  children: React.ReactNode
  requiredUserType?: "rh" | "gestor" | "comum"
  requireGestor?: boolean
}

function RouteGuardContent({ children, requiredUserType, requireGestor = false }: RouteGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      console.log("RouteGuard verificando acesso:", { 
        pathname, 
        isAuthenticated, 
        userType: user?.tipo_usuario,
        requiredUserType,
        requireGestor,
        isGestor: user?.flag_gestor === "S"
      });
      
      // Se não está autenticado e não está na página de login
      if (!isAuthenticated && pathname !== "/login") {
        console.log("Usuário não autenticado, redirecionando para /login");
        router.push("/login")
        return
      }

      // Se está autenticado mas está na página de login
      if (isAuthenticated && pathname === "/login") {
        console.log("Usuário já autenticado, redirecionando para /dashboard");
        router.push("/dashboard")
        return
      }

      // Verificar permissões específicas
      if (isAuthenticated && user) {
        // Verificar tipo de usuário
        if (requiredUserType && user.tipo_usuario !== requiredUserType) {
          console.log(`Acesso negado: usuário é ${user.tipo_usuario}, mas precisa ser ${requiredUserType}`);
          router.push("/unauthorized")
          return
        }

        // Verificar se precisa ser gestor
        if (requireGestor && user.flag_gestor !== "S") {
          console.log("Acesso negado: usuário não é gestor");
          router.push("/unauthorized")
          return
        }
      }
      
      console.log("Acesso permitido à rota:", pathname);
    }
  }, [isLoading, isAuthenticated, user, pathname, router, requiredUserType, requireGestor])

  if (isLoading) {
    console.log("RouteGuard: carregando...");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  // Se não está autenticado e está tentando acessar página protegida
  if (!isAuthenticated && pathname !== "/login") {
    console.log("RouteGuard: não renderizando conteúdo para usuário não autenticado");
    return null
  }

  return <>{children}</>
}

export function RouteGuard({ children, requiredUserType, requireGestor = false }: RouteGuardProps) {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="space-y-4 w-full max-w-md">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      }
    >
      <RouteGuardContent requiredUserType={requiredUserType} requireGestor={requireGestor}>
        {children}
      </RouteGuardContent>
    </ClientOnly>
  )
}
