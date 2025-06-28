"use client"

import { useState, useEffect } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Bell, Check, Trash2, CheckCheck, Clock, Info, AlertCircle, CheckCircle, Search, RefreshCw } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function NotificacoesPage() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [filteredNotifications, setFilteredNotifications] = useState(notifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("todas")
  
  useEffect(() => {
    let filtered = [...notifications]
    
    // Filtro por tab
    if (activeTab === "nao-lidas") {
      filtered = filtered.filter(n => !n.lida)
    } else if (activeTab === "lidas") {
      filtered = filtered.filter(n => n.lida)
    }
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(n => 
        n.titulo.toLowerCase().includes(term) || 
        n.mensagem.toLowerCase().includes(term)
      )
    }
    
    setFilteredNotifications(filtered)
  }, [notifications, searchTerm, activeTab])
  
  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    } catch (error) {
      return dateString
    }
  }
  
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      return dateString
    }
  }
  
  const handleRefresh = () => {
    fetchNotifications()
  }
  
  const actions = (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRefresh}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
        Atualizar
      </Button>
      {unreadCount > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => markAllAsRead()}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Marcar todas como lidas
        </Button>
      )}
    </div>
  )
  
  return (
    <AppLayout title="Notificações" actions={actions}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Gerencie suas notificações</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar notificações..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todas" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="todas">
                Todas
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="nao-lidas">
                Não lidas
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => !n.lida).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="lidas">
                Lidas
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => n.lida).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="todas" className="mt-0">
              {renderNotificationList(filteredNotifications)}
            </TabsContent>
            <TabsContent value="nao-lidas" className="mt-0">
              {renderNotificationList(filteredNotifications)}
            </TabsContent>
            <TabsContent value="lidas" className="mt-0">
              {renderNotificationList(filteredNotifications)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppLayout>
  )
  
  function renderNotificationList(notifications: typeof filteredNotifications) {
    if (notifications.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium">Nenhuma notificação encontrada</p>
          <p className="text-sm">
            {activeTab === "todas" && searchTerm 
              ? "Tente ajustar sua busca" 
              : activeTab === "nao-lidas" 
                ? "Você não tem notificações não lidas" 
                : "Você não tem notificações lidas"}
          </p>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-4 rounded-lg border ${!notification.lida ? "bg-muted/50" : ""}`}
          >
            <div className="flex gap-4">
              <div className="mt-1">
                {getNotificationIcon(notification.tipo)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-medium">{notification.titulo}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(notification.data_criacao)}</span>
                    <span className="text-xs">({formatTimeAgo(notification.data_criacao)})</span>
                  </div>
                </div>
                <p className="mt-1 text-muted-foreground">{notification.mensagem}</p>
                
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {notification.link && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={notification.link}>Ver detalhes</Link>
                    </Button>
                  )}
                  {!notification.lida && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Marcar como lida
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
}
