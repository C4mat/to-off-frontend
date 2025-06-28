"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, TipoAusencia, UF, Evento } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { formatCPF } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { differenceInDays } from "date-fns"

export default function EditarEventoPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const eventoId = Number(params.id)
  
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tiposAusencia, setTiposAusencia] = useState<TipoAusencia[]>([])
  const [ufs, setUfs] = useState<UF[]>([])
  const [evento, setEvento] = useState<Evento | null>(null)
  
  // Campos do formulário
  const [dataInicio, setDataInicio] = useState<string>("")
  const [dataFim, setDataFim] = useState<string>("")
  const [tipoAusencia, setTipoAusencia] = useState<number | undefined>()
  const [uf, setUf] = useState<string>("")
  const [totalDias, setTotalDias] = useState<number>(1)
  
  // Carregar dados do evento e dados auxiliares
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Verificar se o usuário é admin (RH ou gestor)
        if (user) {
          const isAdminUser = user.tipo_usuario === "rh" || user.flag_gestor === "S"
          setIsAdmin(isAdminUser)
        }
        
        // Carregar dados do evento
        const eventoResponse = await apiClient.getEvento(eventoId)
        if (eventoResponse.data) {
          setEvento(eventoResponse.data)
          
          // Preencher o formulário com os dados do evento
          setDataInicio(eventoResponse.data.data_inicio)
          setDataFim(eventoResponse.data.data_fim)
          setTipoAusencia(eventoResponse.data.id_tipo_ausencia)
          setUf(eventoResponse.data.UF)
          setTotalDias(eventoResponse.data.total_dias)
          
          // Verificar permissões
          if (!user) {
            router.push("/unauthorized")
            return
          }
          
          const canEdit = 
            user.tipo_usuario === "rh" || 
            (user.flag_gestor === "S" && user.grupo_id === eventoResponse.data.cpf_usuario) ||
            (user.cpf === eventoResponse.data.cpf_usuario && eventoResponse.data.status === "pendente")
          
          if (!canEdit) {
            router.push("/unauthorized")
            return
          }
        } else {
          toast({
            title: "Erro",
            description: "Evento não encontrado",
            variant: "destructive",
          })
          router.push("/eventos")
          return
        }
        
        // Carregar tipos de ausência
        const tiposResponse = await apiClient.getTiposAusencia()
        if (tiposResponse.data) {
          setTiposAusencia(tiposResponse.data)
        }
        
        // Carregar UFs
        const ufsResponse = await apiClient.getUFs()
        if (ufsResponse.data) {
          setUfs(ufsResponse.data)
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados necessários",
          variant: "destructive",
        })
        router.push("/eventos")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (eventoId) {
      fetchData()
    }
  }, [eventoId, user, router])
  
  // Atualizar total de dias quando as datas mudam
  useEffect(() => {
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      const dias = differenceInDays(fim, inicio) + 1
      setTotalDias(dias > 0 ? dias : 1)
    }
  }, [dataInicio, dataFim])
  
  // Função para salvar as alterações no evento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!dataInicio || !dataFim || !tipoAusencia || !uf) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }
    
    setIsSaving(true)
    
    try {
      const response = await apiClient.updateEvento(eventoId, {
        data_inicio: dataInicio,
        data_fim: dataFim,
        id_tipo_ausencia: tipoAusencia,
        UF: uf,
      })
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Evento atualizado com sucesso",
        })
        router.push("/eventos")
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível atualizar o evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar evento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o evento",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <RouteGuard>
      <AppLayout title="Editar solicitação de evento" subtitle="Atualizar informações do evento">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Editar solicitação de evento</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Carregando dados do evento...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Informações do usuário (somente leitura) */}
                  {evento && (
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuário</Label>
                      <Input
                        id="usuario"
                        type="text"
                        value={`${evento.usuario_nome} (${formatCPF(evento.cpf_usuario)})`}
                        readOnly
                        disabled
                      />
                    </div>
                  )}
                  
                  {/* Tipo de ausência */}
                  <div className="space-y-2">
                    <Label htmlFor="tipo_ausencia">Tipo de Ausência</Label>
                    <Select
                      value={tipoAusencia?.toString()}
                      onValueChange={(value) => setTipoAusencia(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de ausência" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposAusencia.map((tipo) => (
                          <SelectItem key={tipo.id_tipo_ausencia} value={tipo.id_tipo_ausencia.toString()}>
                            {tipo.descricao_ausencia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Data de início */}
                  <div className="space-y-2">
                    <Label htmlFor="data_inicio">Data de Início</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      required
                    />
                  </div>
                  
                  {/* Data de fim */}
                  <div className="space-y-2">
                    <Label htmlFor="data_fim">Data de Fim</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      min={dataInicio}
                      required
                    />
                  </div>
                  
                  {/* Total de dias (somente leitura) */}
                  <div className="space-y-2">
                    <Label htmlFor="total_dias">Total de Dias</Label>
                    <Input
                      id="total_dias"
                      type="number"
                      value={totalDias}
                      readOnly
                      disabled
                    />
                  </div>
                  
                  {/* UF */}
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <Select
                      value={uf}
                      onValueChange={setUf}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ufs.map((ufItem) => (
                          <SelectItem key={ufItem.uf} value={ufItem.uf}>
                            {ufItem.uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Status (somente leitura) */}
                  {evento && (
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Input
                        id="status"
                        type="text"
                        value={evento.status.charAt(0).toUpperCase() + evento.status.slice(1)}
                        readOnly
                        disabled
                      />
                    </div>
                  )}
                  
                  {/* Botões */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        "Atualizar Evento"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 