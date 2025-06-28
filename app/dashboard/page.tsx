"use client"

import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Building2,
  UserCheck,
  CalendarDays,
} from "lucide-react"
import { formatCPF, formatDate, getUserTypeLabel } from "@/lib/utils"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api"

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalEventos: 0,
    eventosPendentes: 0,
    eventosAprovados: 0,
    eventosRejeitados: 0,
    totalUsuarios: 0,
    totalGrupos: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Obter estatísticas de eventos
        const eventosResponse = await apiClient.getEventos()
        if (eventosResponse.data) {
          const eventos = eventosResponse.data
          const pendentes = eventos.filter(e => e.status === "pendente").length
          const aprovados = eventos.filter(e => e.status === "aprovado").length
          const rejeitados = eventos.filter(e => e.status === "rejeitado").length
          
          setStats(prev => ({
            ...prev,
            totalEventos: eventos.length,
            eventosPendentes: pendentes,
            eventosAprovados: aprovados,
            eventosRejeitados: rejeitados
          }))
        }
        
        // Obter total de usuários e grupos (apenas para RH)
        if (user?.tipo_usuario === "rh") {
          const [usuariosResponse, gruposResponse] = await Promise.all([
            apiClient.getUsuarios(),
            apiClient.getGrupos()
          ])
          
          const usuarios = usuariosResponse?.data ?? []
          const grupos = gruposResponse?.data ?? []
          
          setStats(prev => ({
            ...prev,
            totalUsuarios: usuarios.length,
            totalGrupos: grupos.length
          }))
        }
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error)
        
        // Usar dados mockados em caso de erro
        setStats({
    totalEventos: 45,
    eventosPendentes: 8,
    eventosAprovados: 32,
    eventosRejeitados: 5,
    totalUsuarios: 24,
    totalGrupos: 4,
        })
      } finally {
        setIsLoading(false)
      }
  }
    
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  return (
    <RouteGuard>
      <AppLayout title="Dashboard" subtitle="Visão geral do sistema de gestão de eventos">
        <div className="space-y-6 max-w-full">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Bem-vindo, {user?.nome?.split(" ")[0] || 'Usuário'}! 👋</h2>
                <p className="text-blue-100 mb-4">
                  {getUserTypeLabel(user?.tipo_usuario || "")} • {user?.grupo_nome || 'Grupo'} • {user?.UF || 'UF'}
                </p>
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    CPF: {user ? formatCPF(user.cpf) : "000.000.000-00"}
                  </Badge>
                  {user?.flag_gestor === "S" && (
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      Gestor
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Ícone de calendário */}
              <div className="hidden lg:block">
                <Calendar className="h-24 w-24 text-white/70" />
              </div>
            </div>
            
            {/* Versão do sistema - área destacada em amarelo */}
            <div className="absolute top-6 right-40 text-right text-xs text-blue-100">
              <div className="font-medium">Tô Off v2.0</div>
              <div>Sistema de Gestão de Eventos</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalEventos}</div>
                <p className="text-xs text-muted-foreground">+12% em relação ao mês anterior</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{isLoading ? "-" : stats.eventosPendentes}</div>
                <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{isLoading ? "-" : stats.eventosAprovados}</div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejeitados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{isLoading ? "-" : stats.eventosRejeitados}</div>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </CardContent>
            </Card>
          </div>

          {/* Management Stats (RH only) */}
          {user?.tipo_usuario === "rh" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalUsuarios}</div>
                  <p className="text-xs text-muted-foreground">Ativos no sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Grupos</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoading ? "-" : stats.totalGrupos}</div>
                  <p className="text-xs text-muted-foreground">Departamentos ativos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoading
                      ? "-"
                      : stats.eventosAprovados + stats.eventosRejeitados > 0
                      ? Math.round((stats.eventosAprovados / (stats.eventosAprovados + stats.eventosRejeitados)) * 100)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesse as funcionalidades mais utilizadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/eventos/novo">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Solicitar Novo Evento
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/calendario">
                    <Calendar className="mr-2 h-4 w-4" />
                    Ver Calendário
                  </Link>
                </Button>

                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/eventos">
                    <Clock className="mr-2 h-4 w-4" />
                    Meus Eventos
                  </Link>
                </Button>

                {(user?.tipo_usuario === "rh" || user?.flag_gestor === "S") && (
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/eventos/aprovacoes">
                      <UserCheck className="mr-2 h-4 w-4" />
                      Aprovar Eventos
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>Detalhes do seu perfil no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">CPF</p>
                    <p className="font-medium">{user ? formatCPF(user.cpf) : ""}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Grupo</p>
                    <p className="font-medium">{user?.grupo_nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">UF</p>
                    <p className="font-medium">{user?.UF}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Início na Empresa</p>
                    <p className="font-medium">{user?.inicio_na_empresa ? formatDate(user.inicio_na_empresa) : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline" className={user?.ativo ? "text-green-600" : "text-red-600"}>
                      {user?.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>

                <Button asChild variant="outline" className="w-full">
                  <Link href="/perfil">Editar Perfil</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas ações no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Evento de férias aprovado</p>
                    <p className="text-xs text-muted-foreground">Há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Novo evento solicitado</p>
                    <p className="text-xs text-muted-foreground">Há 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Evento pendente de aprovação</p>
                    <p className="text-xs text-muted-foreground">Há 1 dia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
}
