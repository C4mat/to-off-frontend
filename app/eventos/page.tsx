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
import { Pencil, Trash2, Clock, CheckCircle, XCircle, Eye, PlusCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function EventosPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")

  useEffect(() => {
    const fetchEventos = async () => {
      setIsLoading(true)
      try {
        let response
        
        if (activeTab === "pendentes") {
          // Buscar apenas eventos pendentes
          response = await apiClient.getEventos({ status: "pendente" })
        } else {
          // Buscar todos os eventos
          response = await apiClient.getEventos()
        }
        
        if (response.data) {
          setEventos(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de eventos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventos()
  }, [activeTab])

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

  // Verificar se o usuário pode aprovar eventos (RH ou gestor)
  const canApprove = user && (user.tipo_usuario === "rh" || user.flag_gestor === "S")

  return (
    <RouteGuard>
      <AppLayout title="Eventos" subtitle="Gerencie os eventos e ausências">
        <div className="space-y-4">
          {canApprove && (
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="todos">Todos os Eventos</TabsTrigger>
                <TabsTrigger value="pendentes">Aprovações Pendentes</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {activeTab === "pendentes" ? "Aprovações Pendentes" : "Lista de Eventos"}
                </CardTitle>
                <Button asChild>
                  <Link href="/eventos/novo">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Novo Evento
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Carregando eventos...</p>
                </div>
              ) : eventos.length > 0 ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventos.map((evento) => (
                        <TableRow key={evento.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getEventColor(evento.tipo_ausencia_desc, evento.status) }}
                              ></div>
                              {evento.tipo_ausencia_desc}
                            </div>
                          </TableCell>
                          <TableCell>{evento.usuario_nome}</TableCell>
                          <TableCell>
                            {formatDate(evento.data_inicio)} a {formatDate(evento.data_fim)}
                            <div className="text-xs text-gray-500">{evento.total_dias} dias</div>
                          </TableCell>
                          <TableCell>
                            {evento.status === "aprovado" && (
                              <Badge className="bg-green-600">Aprovado</Badge>
                            )}
                            {evento.status === "rejeitado" && (
                              <Badge variant="destructive">Rejeitado</Badge>
                            )}
                            {evento.status === "pendente" && (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/eventos/detalhes/${evento.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              
                              {evento.status === "pendente" && (
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/eventos/editar/${evento.id}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-12 text-center border rounded-md">
                  <p className="text-gray-500">
                    {activeTab === "pendentes" 
                      ? "Não há eventos pendentes de aprovação" 
                      : "Nenhum evento encontrado"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 