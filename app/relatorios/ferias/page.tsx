"use client"

import { useState, useEffect } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { apiClient, type DiasFerias } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Download, RefreshCcw } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function FeriasPage() {
  const [loading, setLoading] = useState(true)
  const [diasFerias, setDiasFerias] = useState<DiasFerias[]>([])
  const [filteredDiasFerias, setFilteredDiasFerias] = useState<DiasFerias[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  
  useEffect(() => {
    fetchDiasFerias()
  }, [])
  
  const fetchDiasFerias = async () => {
    setLoading(true)
    try {
      // Simulando a obtenção de dados de férias para múltiplos usuários
      // Na API real, você provavelmente teria um endpoint para listar todos os usuários com seus dias de férias
      const usuarios = await apiClient.getUsuarios()
      
      if (usuarios.data) {
        const diasFeriasPromises = usuarios.data.map(async (usuario) => {
          const response = await apiClient.getDiasFerias(Number(usuario.cpf))
          return response.data
        })
        
        const diasFeriasResults = await Promise.all(diasFeriasPromises)
        const validResults = diasFeriasResults.filter(Boolean) as DiasFerias[]
        
        setDiasFerias(validResults)
        setFilteredDiasFerias(validResults)
      }
    } catch (error) {
      console.error("Erro ao carregar dados de férias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de férias",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrar dias de férias conforme pesquisa
  useEffect(() => {
    const filtered = diasFerias.filter((item) =>
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cpf.includes(searchTerm)
    )
    setFilteredDiasFerias(filtered)
  }, [searchTerm, diasFerias])
  
  const downloadReport = () => {
    // Criar conteúdo CSV
    const headers = "CPF,Nome,Dias Disponíveis,Último Período Aquisitivo\n"
    const rows = filteredDiasFerias.map(item => 
      `${item.cpf},${item.nome},${item.dias_disponiveis},${formatDate(item.ultimo_periodo_aquisitivo_fim)}`
    ).join("\n")
    
    const csvContent = headers + rows
    
    // Download do arquivo
    const element = document.createElement("a")
    const file = new Blob([csvContent], { type: "text/csv" })
    element.href = URL.createObjectURL(file)
    element.download = `relatorio-ferias-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
  
  return (
    <RouteGuard>
      <AppLayout 
        title="Relatório de Férias" 
        subtitle="Consulta de dias de férias disponíveis por colaborador"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchDiasFerias}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button 
              variant="outline" 
              onClick={downloadReport}
              disabled={loading || filteredDiasFerias.length === 0}
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
                placeholder="Buscar por nome ou CPF..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Dias de Férias Disponíveis</CardTitle>
              <CardDescription>
                Relatório de dias de férias disponíveis por colaborador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Carregando dados de férias...</p>
                </div>
              ) : filteredDiasFerias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                  <p className="text-muted-foreground">Tente ajustar os filtros ou atualizar os dados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CPF</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-center">Dias Disponíveis</TableHead>
                        <TableHead>Último Período Aquisitivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDiasFerias.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.cpf}</TableCell>
                          <TableCell className="font-medium">{item.nome}</TableCell>
                          <TableCell className="text-center">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.dias_disponiveis > 20 
                                  ? "bg-red-100 text-red-800" 
                                  : item.dias_disponiveis > 10
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.dias_disponiveis}
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(item.ultimo_periodo_aquisitivo_fim)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
              <CardDescription>
                Visão geral dos dias de férias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Total de Colaboradores
                  </div>
                  <div className="text-2xl font-bold">
                    {filteredDiasFerias.length}
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Média de Dias Disponíveis
                  </div>
                  <div className="text-2xl font-bold">
                    {filteredDiasFerias.length > 0
                      ? (filteredDiasFerias.reduce((acc, item) => acc + item.dias_disponiveis, 0) / filteredDiasFerias.length).toFixed(1)
                      : "0"}
                  </div>
                </div>
                
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Colaboradores com + de 20 dias
                  </div>
                  <div className="text-2xl font-bold">
                    {filteredDiasFerias.filter(item => item.dias_disponiveis > 20).length}
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
