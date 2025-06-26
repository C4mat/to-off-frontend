"use client"

import { useEffect, useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Evento } from "@/lib/api"
import { formatCPF, formatDate, getEventColor } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function EventosPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true)
      try {
        let response
        
        if (user) {
          if (user.tipo_usuario === "rh") {
            // RH vê todos os eventos
            response = await apiClient.getEventos()
          } else if (user.flag_gestor === "S") {
            // Gestores veem eventos do grupo
            response = await apiClient.getEventos({ grupo_id: user.grupo_id })
          } else {
            // Usuário comum vê apenas seus eventos
            response = await apiClient.getEventos({ cpf_usuario: user.cpf })
          }
          
          if (response.data) {
            setEventos(response.data)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os eventos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchEventos()
    }
  }, [user])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-green-600">Aprovado</Badge>
      case "rejeitado":
        return <Badge variant="destructive">Rejeitado</Badge>
      case "pendente":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Função para aprovar evento
  const handleAprovar = async (id: number) => {
    try {
      if (!user) return
      
      const response = await apiClient.aprovarEvento(id, {
        aprovador_cpf: user.cpf,
        observacoes: "Aprovado via dashboard"
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento aprovado com sucesso",
        })
        
        // Atualizar lista de eventos
        setEventos(eventos.map(evento => 
          evento.id === id ? { ...evento, status: "aprovado", aprovado_por: user.cpf, aprovado_por_nome: user.nome } : evento
        ))
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível aprovar o evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao aprovar evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o evento",
        variant: "destructive",
      })
    }
  }

  // Função para rejeitar evento
  const handleRejeitar = async (id: number) => {
    try {
      if (!user) return
      
      const response = await apiClient.rejeitarEvento(id, {
        aprovador_cpf: user.cpf,
        observacoes: "Rejeitado via dashboard"
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento rejeitado com sucesso",
        })
        
        // Atualizar lista de eventos
        setEventos(eventos.map(evento => 
          evento.id === id ? { ...evento, status: "rejeitado", aprovado_por: user.cpf, aprovado_por_nome: user.nome } : evento
        ))
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível rejeitar o evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao rejeitar evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o evento",
        variant: "destructive",
      })
    }
  }

  // Função para excluir evento
  const handleExcluir = async (id: number) => {
    try {
      const response = await apiClient.deleteEvento(id)
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento excluído com sucesso",
        })
        
        // Remover evento da lista
        setEventos(eventos.filter(evento => evento.id !== id))
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível excluir o evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento",
        variant: "destructive",
      })
    }
  }

  // Verificar se o usuário pode editar um evento
  const canEditEvento = (evento: Evento): boolean => {
    if (!user) return false
    
    // RH pode editar qualquer evento
    if (user.tipo_usuario === "rh") return true
    
    // Gestor pode editar eventos do seu grupo
    if (user.flag_gestor === "S" && user.grupo_id === evento.cpf_usuario) return true
    
    // Usuário comum pode editar apenas seus próprios eventos e somente se estiverem pendentes
    return user.cpf === evento.cpf_usuario && evento.status === "pendente"
  }

  // Verificar se o usuário pode aprovar/rejeitar eventos
  const canApproveEvents = (): boolean => {
    if (!user) return false
    return user.tipo_usuario === "rh" || user.flag_gestor === "S"
  }

  // Determinar o título da página com base no tipo de usuário
  const getPageTitle = (): string => {
    if (!user) return "Eventos"
    
    if (user.tipo_usuario === "rh") {
      return "Todos os Eventos"
    } else if (user.flag_gestor === "S") {
      return "Eventos do Grupo"
    } else {
      return "Meus Eventos"
    }
  }

  return (
    <RouteGuard>
      <AppLayout title={getPageTitle()} subtitle="Gestão de eventos e ausências">
        <div className="space-y-6">
          {/* Botão Nova Solicitação */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">
                {isLoading ? "Carregando..." : `Total: ${eventos.length} evento(s)`}
              </h2>
            </div>
            <Button asChild>
              <Link href="/eventos/novo">
                <span className="hidden md:inline">Solicitar Novo Evento</span>
                <span className="md:hidden">Novo</span>
              </Link>
            </Button>
          </div>

          {/* Tabela de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2">Carregando eventos...</p>
                </div>
              ) : eventos.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Nenhum evento encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(user?.tipo_usuario === "rh" || user?.flag_gestor === "S") && (
                          <TableHead>Usuário</TableHead>
                        )}
                        <TableHead>Tipo</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventos.map((evento) => (
                        <TableRow key={evento.id}>
                          {(user?.tipo_usuario === "rh" || user?.flag_gestor === "S") && (
                            <TableCell className="font-medium">
                              <div>
                                <div>{evento.usuario_nome}</div>
                                <div className="text-xs text-muted-foreground">{formatCPF(evento.cpf_usuario)}</div>
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div>
                              <div 
                                className="w-2 h-2 rounded-full inline-block mr-2"
                                style={{ backgroundColor: getEventColor(evento.tipo_ausencia_desc, evento.status) }}
                              ></div>
                              {evento.tipo_ausencia_desc}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(evento.data_inicio)}</TableCell>
                          <TableCell>{formatDate(evento.data_fim)}</TableCell>
                          <TableCell>{evento.total_dias}</TableCell>
                          <TableCell>{getStatusBadge(evento.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {evento.status === "pendente" && (
                                <>
                                  {canEditEvento(evento) && (
                                    <Button variant="ghost" size="sm" asChild>
                                      <Link href={`/eventos/editar/${evento.id}`}>
                                        <Pencil className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}

                                  {canApproveEvents() && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleAprovar(evento.id)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleRejeitar(evento.id)}
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </>
                              )}

                              {canEditEvento(evento) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleExcluir(evento.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 