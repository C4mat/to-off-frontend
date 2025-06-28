"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiClient, type Notificacao } from "@/lib/api"
import { useAuth } from "./auth-context"
import { toast } from "@/hooks/use-toast"

interface NotificationContextType {
  notifications: Notificacao[]
  unreadCount: number
  loading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: number) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: number) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { user } = useAuth()
  
  const unreadCount = notifications.filter(n => !n.lida).length
  
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([])
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const response = await apiClient.getNotificacoes()
      if (response.data) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const markAsRead = async (id: number) => {
    try {
      const response = await apiClient.marcarNotificacaoComoLida(id)
      if (response.data) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, lida: true } : notif
          )
        )
      }
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      })
    }
  }
  
  const markAllAsRead = async () => {
    try {
      const response = await apiClient.marcarTodasNotificacoesComoLidas()
      if (response.data) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, lida: true }))
        )
        toast({
          title: "Sucesso",
          description: "Todas as notificações foram marcadas como lidas",
        })
      }
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive",
      })
    }
  }
  
  const deleteNotification = async (id: number) => {
    try {
      const response = await apiClient.excluirNotificacao(id)
      if (response.data) {
        setNotifications(prev => prev.filter(notif => notif.id !== id))
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a notificação",
        variant: "destructive",
      })
    }
  }
  
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])
  
  // Atualizar notificações a cada 2 minutos
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      fetchNotifications()
    }, 2 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user])
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        loading, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification 
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
} 