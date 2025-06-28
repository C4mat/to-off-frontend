"use client"

import { useState, useEffect } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { apiClient, type ValidacaoIntegridade } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, AlertTriangle, Info, CheckCircle, RefreshCcw, Download } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function IntegridadePage() {
  const [loading, setLoading] = useState(true)
  const [integrityData, setIntegrityData] = useState<ValidacaoIntegridade | null>(null)
  const [reportText, setReportText] = useState<string>("")
  const [activeTab, setActiveTab] = useState("dashboard")
  
  useEffect(() => {
    fetchIntegrityData()
  }, [])
  
  const fetchIntegrityData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getIntegrityCheck()
      if (response.data) {
        setIntegrityData(response.data)
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível carregar os dados de integridade",
          variant: "destructive",
        })
      }
      
      const reportResponse = await apiClient.getIntegrityReport()
      if (reportResponse.data) {
        setReportText(reportResponse.data.report)
      }
    } catch (error) {
      console.error("Erro ao carregar dados de integridade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de integridade",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const downloadReport = () => {
    const element = document.createElement("a")
    const file = new Blob([reportText], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `relatorio-integridade-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "ERROR":
        return "bg-red-100 text-red-800"
      case "WARNING":
        return "bg-yellow-100 text-yellow-800"
      case "INFO":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "ERROR":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "INFO":
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }
  
  const renderDashboard = () => {
    if (!integrityData) return null
    
    const { summary, statistics } = integrityData
    
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Erros</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_errors}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_errors === 0 
                  ? "Nenhum erro encontrado" 
                  : `${summary.total_errors} ${summary.total_errors === 1 ? "erro crítico" : "erros críticos"}`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avisos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_warnings}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_warnings === 0 
                  ? "Nenhum aviso encontrado" 
                  : `${summary.total_warnings} ${summary.total_warnings === 1 ? "aviso" : "avisos"}`}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Informações</CardTitle>
              <Info className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_info}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total_info} itens informativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
              {summary.total_errors === 0 
                ? <CheckCircle className="h-4 w-4 text-green-600" />
                : <AlertCircle className="h-4 w-4 text-red-600" />
              }
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_errors === 0 ? "OK" : "Atenção"}
              </div>
              <p className="text-xs text-muted-foreground">
                Última verificação: {formatDate(summary.timestamp)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas do Sistema</CardTitle>
              <CardDescription>Visão geral dos dados do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de Empresas:</span>
                  <span className="font-medium">{statistics.total_empresas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Grupos:</span>
                  <span className="font-medium">{statistics.total_grupos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Usuários:</span>
                  <span className="font-medium">{statistics.total_usuarios}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de Eventos:</span>
                  <span className="font-medium">{statistics.total_eventos}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total de UFs:</span>
                  <span className="font-medium">{statistics.total_ufs}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição</CardTitle>
              <CardDescription>Detalhamento por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Usuários por Tipo</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>RH:</span>
                      <span className="font-medium">{statistics.usuarios_por_tipo.rh}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gestor:</span>
                      <span className="font-medium">{statistics.usuarios_por_tipo.gestor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comum:</span>
                      <span className="font-medium">{statistics.usuarios_por_tipo.comum}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Eventos por Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Pendente:</span>
                      <span className="font-medium">{statistics.eventos_por_status.pendente}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Aprovado:</span>
                      <span className="font-medium">{statistics.eventos_por_status.aprovado}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rejeitado:</span>
                      <span className="font-medium">{statistics.eventos_por_status.rejeitado}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Alertas e Notificações</CardTitle>
            <CardDescription>
              {integrityData.errors.length > 0 || integrityData.warnings.length > 0
                ? "Itens que requerem atenção"
                : "Nenhum item requer atenção imediata"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {integrityData.errors.length === 0 && integrityData.warnings.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <p>Todos os sistemas estão operando normalmente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {integrityData.errors.map((error, index) => (
                  <div 
                    key={`error-${index}`} 
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">{error.category}</h4>
                      <p className="text-red-700 text-sm">{error.message}</p>
                    </div>
                  </div>
                ))}
                
                {integrityData.warnings.map((warning, index) => (
                  <div 
                    key={`warning-${index}`} 
                    className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3"
                  >
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">{warning.category}</h4>
                      <p className="text-yellow-700 text-sm">{warning.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const renderDetailedReport = () => {
    if (!integrityData) return null
    
    return (
      <div className="space-y-6">
        {integrityData.errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Erros ({integrityData.errors.length})
              </CardTitle>
              <CardDescription>Problemas críticos que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrityData.errors.map((error, index) => (
                  <div 
                    key={`error-detail-${index}`}
                    className="rounded-lg border border-red-200 bg-red-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-red-900">{error.category}</h4>
                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                        Erro
                      </Badge>
                    </div>
                    <p className="text-red-700 mb-2">{error.message}</p>
                    {Object.keys(error.details).length > 0 && (
                      <div className="mt-2 text-sm">
                        <h5 className="font-medium mb-1">Detalhes:</h5>
                        <pre className="bg-red-100 p-2 rounded text-red-800 overflow-x-auto">
                          {JSON.stringify(error.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {integrityData.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Avisos ({integrityData.warnings.length})
              </CardTitle>
              <CardDescription>Problemas que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrityData.warnings.map((warning, index) => (
                  <div 
                    key={`warning-detail-${index}`}
                    className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-yellow-900">{warning.category}</h4>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Aviso
                      </Badge>
                    </div>
                    <p className="text-yellow-700 mb-2">{warning.message}</p>
                    {Object.keys(warning.details).length > 0 && (
                      <div className="mt-2 text-sm">
                        <h5 className="font-medium mb-1">Detalhes:</h5>
                        <pre className="bg-yellow-100 p-2 rounded text-yellow-800 overflow-x-auto">
                          {JSON.stringify(warning.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {integrityData.info.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Informações ({integrityData.info.length})
              </CardTitle>
              <CardDescription>Informações sobre o sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrityData.info.map((info, index) => (
                  <div 
                    key={`info-detail-${index}`}
                    className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">{info.category}</h4>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Info
                      </Badge>
                    </div>
                    <p className="text-blue-700 mb-2">{info.message}</p>
                    {Object.keys(info.details).length > 0 && (
                      <div className="mt-2 text-sm">
                        <h5 className="font-medium mb-1">Detalhes:</h5>
                        <pre className="bg-blue-100 p-2 rounded text-blue-800 overflow-x-auto">
                          {JSON.stringify(info.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }
  
  const renderRawReport = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Relatório Completo</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadReport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Baixar
            </Button>
          </CardTitle>
          <CardDescription>
            Relatório de integridade formatado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
            {reportText || "Relatório não disponível"}
          </pre>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout 
        title="Integridade do Sistema" 
        subtitle="Verificação completa da integridade dos dados"
        actions={
          <Button 
            variant="outline" 
            onClick={fetchIntegrityData}
            disabled={loading}
            className="flex items-center gap-1"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        }
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Carregando dados de integridade...</p>
          </div>
        ) : integrityData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="detailed">Detalhado</TabsTrigger>
              <TabsTrigger value="raw">Relatório</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              {renderDashboard()}
            </TabsContent>
            
            <TabsContent value="detailed">
              {renderDetailedReport()}
            </TabsContent>
            
            <TabsContent value="raw">
              {renderRawReport()}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-medium">Não foi possível carregar os dados de integridade</p>
            <p className="text-muted-foreground mb-4">Tente novamente mais tarde</p>
            <Button onClick={fetchIntegrityData}>Tentar Novamente</Button>
          </div>
        )}
      </AppLayout>
    </RouteGuard>
  )
}
