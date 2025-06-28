"use client"

import { useEffect, useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Empresa } from "@/lib/api"
import { formatCNPJ, formatDate } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Building2, Mail, Phone, Calendar, MapPin } from "lucide-react"
import Link from "next/link"

export default function EmpresaPage() {
  const { user } = useAuth()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState<Partial<Empresa>>({
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchEmpresa = async () => {
      setIsLoading(true)
      try {
        // Como o sistema geralmente tem apenas uma empresa, buscamos todas e pegamos a primeira
        const response = await apiClient.getEmpresas()
        if (response.data && response.data.length > 0) {
          const empresaData = response.data[0]
          setEmpresa(empresaData)
          setFormData({
            nome: empresaData.nome,
            endereco: empresaData.endereco,
            telefone: empresaData.telefone,
            email: empresaData.email,
          })
        } else {
          toast({
            title: "Aviso",
            description: "Nenhuma empresa cadastrada",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar empresa:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da empresa",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user && user.tipo_usuario === "rh") {
      fetchEmpresa()
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresa) return

    setIsSaving(true)
    try {
      const response = await apiClient.updateEmpresa(empresa.cnpj, formData)
      
      if (response.data) {
        setEmpresa(response.data)
        setEditando(false)
        toast({
          title: "Sucesso",
          description: "Dados da empresa atualizados com sucesso",
        })
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível atualizar os dados da empresa",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados da empresa",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout title="Empresa" subtitle="Gerenciar informações da empresa">
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !empresa ? (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma empresa cadastrada</CardTitle>
                <CardDescription>
                  Não foi encontrada nenhuma empresa no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Entre em contato com o administrador do sistema.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full max-w-4xl mx-auto">
              <CardHeader className="pb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{empresa.nome}</CardTitle>
                      <CardDescription>
                        CNPJ: {formatCNPJ(empresa.cnpj)}
                      </CardDescription>
                    </div>
                  </div>
                  {!editando && user?.tipo_usuario === "rh" && (
                    <Button 
                      onClick={() => setEditando(true)}
                      variant="outline"
                    >
                      Editar Informações
                    </Button>
                  )}
                </div>
              </CardHeader>
              <Separator />
              
              <CardContent className="pt-6">
                {editando ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome da Empresa</Label>
                        <Input 
                          id="nome" 
                          name="nome" 
                          value={formData.nome} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input 
                          id="cnpj" 
                          value={formatCNPJ(empresa.cnpj)}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">O CNPJ não pode ser alterado</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email" 
                          type="email" 
                          value={formData.email} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input 
                          id="telefone" 
                          name="telefone" 
                          value={formData.telefone} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input 
                          id="endereco" 
                          name="endereco" 
                          value={formData.endereco} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setEditando(false)
                          setFormData({
                            nome: empresa.nome,
                            endereco: empresa.endereco,
                            telefone: empresa.telefone,
                            email: empresa.email,
                          })
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{empresa.email}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{empresa.telefone}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Endereço</p>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{empresa.endereco}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total de Grupos</p>
                        <p className="font-medium">{empresa.total_grupos}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Cadastrado em</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{formatDate(empresa.criado_em)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">Status</p>
                      {empresa.ativa ? (
                        <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>
                      ) : (
                        <Badge variant="destructive">Inativa</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              
              {!editando && (
                <CardFooter className="border-t pt-4">
                  <div className="flex w-full justify-between">
                    <Button 
                      variant="outline" 
                      asChild
                    >
                      <Link href="/grupos">Ver Grupos</Link>
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 