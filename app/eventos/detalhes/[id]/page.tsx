"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, Evento } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { formatCPF, formatDate, getEventColor } from "@/lib/utils"
import { Loader2, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function DetalhesEventoPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const eventoId = Number(params.id)
  
  const [isLoading, setIsLoading] = useState(true)
  const [evento, setEvento] = useState<Evento | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"aprovar" | "rejeitar" | null>(null)
  
  // Verificar se o usuário pode editar o evento
  const canEdit = (): boolean => {
    if (!user || !evento) return false
    
    // RH pode editar qualquer evento
    if (user.tipo_usuario === "rh") return true
    
    // Gestor pode editar eventos do seu grupo
    if (user.flag_gestor === "S" && user.grupo_id === evento.cpf_usuario) return true
    
    // Usuário comum pode editar apenas seus próprios eventos e somente se estiverem pendentes
    return user.cpf === evento.cpf_usuario && evento.status === "pendente"
  }
  
  // Verificar se o usuário pode aprovar/rejeitar eventos
  const canApprove = (): boolean => {
    if (!user || !evento) return false
    if (evento.status !== "pendente") return false
    return user.tipo_usuario === "rh" || user.flag_gestor === "S"
  }
  
  // Carregar dados do evento
  useEffect(() => {
    const fetchEvento = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.getEvento(eventoId)
        
        if (response.data) {
          setEvento(response.data)
        } else {
          toast({
            title: "Erro",
            description: "Evento não encontrado",
            variant: "destructive",
          })
          router.push("/eventos")
        }
      } catch (error) {
        console.error("Erro ao carregar evento:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes do evento",
          variant: "destructive",
        })
        router.push("/eventos")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (eventoId) {
      fetchEvento()
    }
  }, [eventoId, router])
  
  // Função para aprovar evento
  const handleAprovar = async () => {
    if (!user || !evento) return
    
    setIsProcessing(true)
    try {
      const response = await apiClient.aprovarEvento(eventoId, {
        aprovador_cpf: user.cpf,
        observacoes: observacoes
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento aprovado com sucesso",
        })
        
        // Atualizar dados do evento
        setEvento({
          ...evento,
          status: "aprovado",
          aprovado_por: user.cpf,
          aprovado_por_nome: user.nome
        })
        
        setDialogOpen(false)
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
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Função para rejeitar evento
  const handleRejeitar = async () => {
    if (!user || !evento) return
    
    setIsProcessing(true)
    try {
      const response = await apiClient.rejeitarEvento(eventoId, {
        aprovador_cpf: user.cpf,
        observacoes: observacoes
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento rejeitado com sucesso",
        })
        
        // Atualizar dados do evento
        setEvento({
          ...evento,
          status: "rejeitado",
          aprovado_por: user.cpf,
          aprovado_por_nome: user.nome
        })
        
        setDialogOpen(false)
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
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Função para excluir evento
  const handleExcluir = async () => {
    if (!evento) return
    
    setIsProcessing(true)
    try {
      const response = await apiClient.deleteEvento(eventoId)
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento excluído com sucesso",
        })
        router.push("/eventos")
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
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Obter a cor do badge de status
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
  
  // Abrir diálogo de aprovação/rejeição
  const openDialog = (action: "aprovar" | "rejeitar") => {
    setDialogAction(action)
    setObservacoes("")
    setDialogOpen(true)
  }
  
  return (
    <RouteGuard>
      <AppLayout title="Detalhes da solicitação de evento" subtitle="Visualizar informações do evento">
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Carregando detalhes do evento...</p>
            </div>
          ) : evento ? (
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEventColor(evento.tipo_ausencia_desc, evento.status) }}
                      ></div>
                      {evento.tipo_ausencia_desc}
                    </div>
                  </CardTitle>
                  <div>{getStatusBadge(evento.status)}</div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Usuário</h3>
                    <p className="mt-1">{evento.usuario_nome}</p>
                    <p className="text-sm text-gray-500">{formatCPF(evento.cpf_usuario)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">UF</h3>
                    <p className="mt-1">{evento.UF}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Início</h3>
                    <p className="mt-1">{formatDate(evento.data_inicio)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data de Fim</h3>
                    <p className="mt-1">{formatDate(evento.data_fim)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total de Dias</h3>
                    <p className="mt-1">{evento.total_dias}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Criado em</h3>
                    <p className="mt-1">{formatDate(evento.criado_em, true)}</p>
                  </div>
                  
                  {evento.status !== "pendente" && evento.aprovado_por && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Aprovado/Rejeitado por</h3>
                        <p className="mt-1">{evento.aprovado_por_nome}</p>
                        <p className="text-sm text-gray-500">{formatCPF(evento.aprovado_por)}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-6 flex justify-between">
                <Button variant="outline" onClick={() => router.push("/eventos")}>
                  Voltar
                </Button>
                
                <div className="flex gap-2">
                  {canEdit() && (
                    <>
                      <Button variant="outline" asChild>
                        <Link href={`/eventos/editar/${evento.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        onClick={handleExcluir}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </>
                  )}
                  
                  {canApprove() && (
                    <>
                      <Button 
                        variant="outline" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={() => openDialog("aprovar")}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => openDialog("rejeitar")}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p>Evento não encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push("/eventos")}>
                  Voltar para Eventos
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Diálogo de aprovação/rejeição */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogAction === "aprovar" ? "Aprovar Evento" : "Rejeitar Evento"}
                </DialogTitle>
                <DialogDescription>
                  {dialogAction === "aprovar" 
                    ? "Confirme a aprovação deste evento. Esta ação não pode ser desfeita."
                    : "Confirme a rejeição deste evento. Esta ação não pode ser desfeita."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione observações sobre esta decisão..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-2"
                />
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={dialogAction === "aprovar" ? handleAprovar : handleRejeitar}
                  disabled={isProcessing}
                  variant={dialogAction === "aprovar" ? "default" : "destructive"}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    dialogAction === "aprovar" ? "Confirmar Aprovação" : "Confirmar Rejeição"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 