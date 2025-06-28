"use client"

import { useState, useEffect } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { apiClient, type Evento } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, RefreshCcw, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function EventosPage() {
  const [loading, setLoading] = useState(true)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [filteredEventos, setFilteredEventos] = useState<Evento[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  
  useEffect(() => {
    fetchEventos()
  }, [])
  
  const fetchEventos = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getEventos()
      if (response.data) {
        setEventos(response.data)
        setFilteredEventos(response.data)
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível carregar os eventos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrar eventos conforme pesquisa e status
  useEffect(() => {
    let filtered = eventos
    
    // Filtrar por status
    if (statusFilter !== "todos") {
      filtered = filtered.filter(evento => evento.status === statusFilter)
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(evento => 
        evento.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.tipo_ausencia_desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.UF.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredEventos(filtered)
  }, [searchTerm, statusFilter, eventos])
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pendente":
        return "bg-yellow-100 text-yellow-800"
      case "aprovado":
        return "bg-green-100 text-green-800"
      case "rejeitado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const downloadReport = () => {
    // Criar conteúdo CSV
    const headers = "ID,Usuário,Data Início,Data Fim,Total Dias,Tipo Ausência,Status,UF\n"
    const rows = filteredEventos.map(evento => 
      `${evento.id},${evento.usuario_nome},${formatDate(evento.data_inicio)},${formatDate(evento.data_fim)},${evento.total_dias},${evento.tipo_ausencia_desc},${evento.status},${evento.UF}`
    ).join("\n")
    
    const csvContent = headers + rows
    
    // Download do arquivo
    const element = document.createElement("a")
    const file = new Blob([csvContent], { type: "text/csv" })
    element.href = URL.createObjectURL(file)
    element.download = `relatorio-eventos-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
  
  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout 
        title="Relatório de Eventos" 
        subtitle="Análise de eventos por período e status"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchEventos}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadReport}
              disabled={loading || filteredEventos.length === 0}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar eventos..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
              <CardDescription>
                {statusFilter === "todos" 
                  ? "Todos os eventos" 
                  : `Eventos com status: ${statusFilter}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Carregando eventos...</p>
                </div>
              ) : filteredEventos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium">Nenhum evento encontrado</p>
                  <p className="text-muted-foreground">Tente ajustar os filtros ou atualizar os dados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Dias</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>UF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEventos.map((evento) => (
                        <TableRow key={evento.id}>
                          <TableCell>{evento.id}</TableCell>
                          <TableCell className="font-medium">{evento.usuario_nome}</TableCell>
                          <TableCell>
                            {formatDate(evento.data_inicio)} a {formatDate(evento.data_fim)}
                          </TableCell>
                          <TableCell>{evento.total_dias}</TableCell>
                          <TableCell>{evento.tipo_ausencia_desc}</TableCell>
                          <TableCell>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(evento.status)}`}
                            >
                              {evento.status}
                            </span>
                          </TableCell>
                          <TableCell>{evento.UF}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredEventos.length}</div>
                <p className="text-xs text-muted-foreground">
                  {statusFilter === "todos" ? "Todos os eventos" : `Eventos ${statusFilter}s`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dias Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredEventos.reduce((acc, evento) => acc + evento.total_dias, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dias totais de ausência
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Média por Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredEventos.length > 0
                    ? (filteredEventos.reduce((acc, evento) => acc + evento.total_dias, 0) / filteredEventos.length).toFixed(1)
                    : "0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média de dias por evento
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </RouteGuard>
  )
}
