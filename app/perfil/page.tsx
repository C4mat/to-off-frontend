"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Usuario } from "@/lib/api"
import { formatCPF, formatDate, getUserTypeLabel } from "@/lib/utils"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { Shield, User, UserCog, Calendar, Mail, MapPin } from "lucide-react"

export default function PerfilPage() {
  const { user } = useAuth()
  const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null)
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState<Partial<Usuario>>({
    nome: "",
    email: "",
    UF: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [ufs, setUfs] = useState<{cod_uf: number, uf: string}[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!user?.cpf) return

      setIsLoading(true)
      try {
        const response = await apiClient.getUsuario(user.cpf)
        if (response.data) {
          setUsuarioAtual(response.data)
          setFormData({
            nome: response.data.nome,
            email: response.data.email,
            UF: response.data.UF,
          })
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus dados",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    const fetchUFs = async () => {
      try {
        const response = await apiClient.getUFs()
        if (response.data) {
          setUfs(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar UFs:", error)
      }
    }

    if (user) {
      fetchUsuario()
      fetchUFs()
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUFChange = (value: string) => {
    setFormData((prev) => ({ ...prev, UF: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.cpf) return

    setIsLoading(true)
    try {
      const response = await apiClient.updateUsuario(user.cpf, formData)
      
      if (response.data) {
        setUsuarioAtual(response.data)
        setEditando(false)
        toast({
          title: "Sucesso",
          description: "Seu perfil foi atualizado com sucesso",
        })
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível atualizar seu perfil",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar seu perfil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTipoUsuarioIcon = () => {
    if (!usuarioAtual) return <User className="h-6 w-6 text-gray-600" />
    
    if (usuarioAtual.tipo_usuario === "rh") {
      return <Shield className="h-6 w-6 text-blue-600" />
    }
    
    if (usuarioAtual.flag_gestor === "S") {
      return <UserCog className="h-6 w-6 text-green-600" />
    }
    
    return <User className="h-6 w-6 text-gray-600" />
  }

  if (isLoading && !usuarioAtual) {
    return (
      <RouteGuard>
        <AppLayout title="Meu Perfil" subtitle="Visualize e edite suas informações">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </AppLayout>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard>
      <AppLayout title="Meu Perfil" subtitle="Visualize e edite suas informações">
        <div className="space-y-6">
          <Card className="w-full max-w-3xl mx-auto">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    {getTipoUsuarioIcon()}
                  </div>
                  <div>
                    <CardTitle>{usuarioAtual?.nome}</CardTitle>
                    <CardDescription>
                      {getUserTypeLabel(usuarioAtual?.tipo_usuario || "comum")}
                      {usuarioAtual?.flag_gestor === "S" && " • Gestor"}
                    </CardDescription>
                  </div>
                </div>
                {!editando && (
                  <Button 
                    onClick={() => setEditando(true)}
                    variant="outline"
                  >
                    Editar Perfil
                  </Button>
                )}
              </div>
            </CardHeader>
            <Separator />
            
            <CardContent className="pt-6">
              {editando ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input 
                        id="nome" 
                        name="nome" 
                        value={formData.nome} 
                        onChange={handleInputChange} 
                        required 
                      />
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
                      <Label htmlFor="uf">UF</Label>
                      <Select
                        value={formData.UF}
                        onValueChange={handleUFChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {ufs.map((uf) => (
                            <SelectItem key={uf.uf} value={uf.uf}>
                              {uf.uf}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setEditando(false)
                        setFormData({
                          nome: usuarioAtual?.nome || "",
                          email: usuarioAtual?.email || "",
                          UF: usuarioAtual?.UF || "",
                        })
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{formatCPF(usuarioAtual?.cpf || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{usuarioAtual?.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Grupo</p>
                      <p className="font-medium">{usuarioAtual?.grupo_nome}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">UF</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{usuarioAtual?.UF}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Início na Empresa</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{formatDate(usuarioAtual?.inicio_na_empresa || "")}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cadastrado em</p>
                      <p className="font-medium">{formatDate(usuarioAtual?.criado_em || "")}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {!editando && (
              <CardFooter className="border-t pt-4">
                <div className="flex w-full justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/dashboard')}
                  >
                    Voltar para Dashboard
                  </Button>
                  
                  <Button onClick={() => router.push('/eventos')}>
                    Ver Meus Eventos
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 