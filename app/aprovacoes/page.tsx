"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, Evento } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { formatDate, formatCPF, getEventColor } from "@/lib/utils"
import { Loader2, Eye, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AprovacoesPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [eventos, setEventos] = useState<Evento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pendentes")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"aprovar" | "rejeitar" | null>(null)
  const [selectedEventoId, setSelectedEventoId] = useState<number | null>(null)
  const [observacoes, setObservacoes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Verificar se o usuário tem permissão para acessar esta página
  useEffect(() => {
    if (user && user.tipo_usuario !== "rh" && user.flag_gestor !== "S") {
      router.push("/unauthorized")
    }
  }, [user, router])
  
  // Carregar eventos
  useEffect(() => {
    const fetchEventos = async () => {
      if (!user) return
      
      setIsLoading(true)
      try {
        let response
        
        if (user.tipo_usuario === "rh") {
          // RH vê todos os eventos
          if (activeTab === "pendentes") {
            response = await apiClient.getEventos({ status: "pendente" })
          } else if (activeTab === "aprovados") {
            response = await apiClient.getEventos({ status: "aprovado" })
          } else if (activeTab === "rejeitados") {
            response = await apiClient.getEventos({ status: "rejeitado" })
          }
        } else if (user.flag_gestor === "S") {
          // Gestores veem eventos do seu grupo
          if (activeTab === "pendentes") {
            response = await apiClient.getEventos({ grupo_id: user.grupo_id, status: "pendente" })
          } else if (activeTab === "aprovados") {
            response = await apiClient.getEventos({ grupo_id: user.grupo_id, status: "aprovado" })
          } else if (activeTab === "rejeitados") {
            response = await apiClient.getEventos({ grupo_id: user.grupo_id, status: "rejeitado" })
          }
        }
        
        if (response?.data) {
          setEventos(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar eventos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de aprovações",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchEventos()
  }, [activeTab, user])
  
  // Função para abrir diálogo de aprovação/rejeição
  const openDialog = (eventoId: number, action: "aprovar" | "rejeitar") => {
    setSelectedEventoId(eventoId)
    setDialogAction(action)
    setObservacoes("")
    setDialogOpen(true)
  }
  
  // Função para aprovar evento
  const handleAprovar = async () => {
    if (!user || !selectedEventoId) return
    
    setIsProcessing(true)
    try {
      const response = await apiClient.aprovarEvento(selectedEventoId, {
        aprovador_cpf: user.cpf,
        observacoes: observacoes
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento aprovado com sucesso",
        })
        
        // Atualizar lista de eventos
        setEventos(eventos.filter(e => e.id !== selectedEventoId))
        
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
    if (!user || !selectedEventoId) return
    
    setIsProcessing(true)
    try {
      const response = await apiClient.rejeitarEvento(selectedEventoId, {
        aprovador_cpf: user.cpf,
        observacoes: observacoes
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento rejeitado com sucesso",
        })
        
        // Atualizar lista de eventos
        setEventos(eventos.filter(e => e.id !== selectedEventoId))
        
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
  
  return (
    <RouteGuard>
      <AppLayout title="Aprovações" subtitle="Gerencie aprovações de eventos">
        <div className="space-y-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
              <TabsTrigger value="aprovados">Aprovados</TabsTrigger>
              <TabsTrigger value="rejeitados">Rejeitados</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "pendentes" && "Aprovações Pendentes"}
                {activeTab === "aprovados" && "Eventos Aprovados"}
                {activeTab === "rejeitados" && "Eventos Rejeitados"}
              </CardTitle>
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
                          <TableCell>
                            <div>
                              <div>{evento.usuario_nome}</div>
                              <div className="text-xs text-gray-500">{formatCPF(evento.cpf_usuario)}</div>
                            </div>
                          </TableCell>
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
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => openDialog(evento.id, "aprovar")}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => openDialog(evento.id, "rejeitar")}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
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
                    {activeTab === "pendentes" && "Não há eventos pendentes de aprovação"}
                    {activeTab === "aprovados" && "Não há eventos aprovados"}
                    {activeTab === "rejeitados" && "Não há eventos rejeitados"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
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
      </AppLayout>
    </RouteGuard>
  )
} 