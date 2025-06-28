"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient, type LoginRequest, type LoginResponse } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: LoginResponse["usuario"] | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse["usuario"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  const isAuthenticated = !!user

  // Garantir que estamos no cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Carregar dados do usuário do localStorage apenas no cliente
  useEffect(() => {
    if (!isClient) return

    const loadUserFromStorage = async () => {
      try {
        console.log("Verificando autenticação do usuário...");
        const storedUser = localStorage.getItem("to-off-user")
        const storedToken = localStorage.getItem("to-off-access-token")

        if (storedUser && storedToken) {
          console.log("Dados encontrados no localStorage, verificando com a API...");
          const userData = JSON.parse(storedUser)
          apiClient.setAccessToken(storedToken)

          // Verificar se o token ainda é válido
          console.log("Verificando token com a API...");
          const response = await apiClient.me()
          
          if (response.error) {
            console.log("Token inválido, tentando refresh...", response.error);
            // Token inválido, tentar refresh
            const refreshed = await refreshToken()
            if (!refreshed) {
              console.log("Refresh falhou, fazendo logout...");
              logout(false)
            } else {
              console.log("Refresh bem-sucedido, definindo usuário...");
              setUser(userData)
            }
          } else if (response.data) {
            console.log("Token válido, definindo usuário...");
            setUser(response.data.usuario)
          }
        } else {
          console.log("Nenhum dado de autenticação encontrado no localStorage");
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        logout(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserFromStorage()
  }, [isClient])

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      console.log("Tentando login com:", credentials.email);
      const response = await apiClient.login(credentials)

      if (response.error) {
        console.error("Erro no login:", response.error);
        toast({
          title: "Erro no login",
          description: response.error,
          variant: "destructive",
        })
        return false
      }

      if (response.data) {
        console.log("Login bem-sucedido!");
        const { access_token, refresh_token, usuario } = response.data

        // Salvar no localStorage apenas se estiver no cliente
        if (typeof window !== "undefined") {
          localStorage.setItem("to-off-user", JSON.stringify(usuario))
          localStorage.setItem("to-off-access-token", access_token)
          localStorage.setItem("to-off-refresh-token", refresh_token)
          console.log("Dados salvos no localStorage");
        }

        // Configurar API client
        apiClient.setAccessToken(access_token)
        setUser(usuario)

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a), ${usuario.nome}`,
        })

        return true
      }

      return false
    } catch (error) {
      console.error("Erro inesperado no login:", error);
      toast({
        title: "Erro no login",
        description: "Erro de conexão com o servidor",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined") return false

      const storedRefreshToken = localStorage.getItem("to-off-refresh-token")
      if (!storedRefreshToken) {
        console.log("Nenhum refresh token encontrado");
        return false;
      }

      console.log("Tentando refresh de token...");
      const response = await apiClient.refresh(storedRefreshToken)

      if (response.error || !response.data) {
        console.error("Erro no refresh de token:", response.error);
        return false
      }

      console.log("Refresh de token bem-sucedido");
      const { access_token } = response.data
      localStorage.setItem("to-off-access-token", access_token)
      apiClient.setAccessToken(access_token)

      return true
    } catch (error) {
      console.error("Erro ao renovar token:", error)
      return false
    }
  }

  const logout = async (showToast = true) => {
    try {
      console.log("Iniciando processo de logout...");
      await apiClient.logout()
    } catch (error) {
      console.error("Erro no logout:", error)
    } finally {
      // Limpar dados locais apenas se estiver no cliente
      if (typeof window !== "undefined") {
        localStorage.removeItem("to-off-user")
        localStorage.removeItem("to-off-access-token")
        localStorage.removeItem("to-off-refresh-token")
        console.log("Dados removidos do localStorage");
      }

      apiClient.setAccessToken(null)
      setUser(null)
      console.log("Estado de autenticação limpo");

      if (showToast) {
        toast({
          title: "Logout realizado",
          description: "Você foi desconectado com sucesso",
        })
      }

      router.push("/login")
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout: () => logout(true),
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
