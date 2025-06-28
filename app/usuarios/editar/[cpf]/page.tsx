"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Usuario } from "@/lib/api"
import { formatCPF, getUserTypeLabel } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

export default function EditarUsuarioPage() {
  const params = useParams()
  const cpf = Number(params.cpf)
  const router = useRouter()
  const { user } = useAuth()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<Partial<Usuario> & { flag_gestor?: "S" | "N" }>({
    nome: "",
    email: "",
    UF: "",
    tipo_usuario: "comum",
    flag_gestor: "N",
  })
  const [ufs, setUfs] = useState<{cod_uf: number, uf: string}[]>([])
  const [grupos, setGrupos] = useState<{id: number, nome: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!cpf) return
      
      setIsLoading(true)
      try {
        const response = await apiClient.getUsuario(cpf)
        if (response.data) {
          setUsuario(response.data)
          setFormData({
            nome: response.data.nome,
            email: response.data.email,
            UF: response.data.UF,
            tipo_usuario: response.data.tipo_usuario,
            grupo_id: response.data.grupo_id,
            flag_gestor: response.data.flag_gestor,
          })
        } else {
          toast({
            title: "Erro",
            description: "Usuário não encontrado",
            variant: "destructive",
          })
          router.push("/usuarios")
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do usuário",
          variant: "destructive",
        })
        router.push("/usuarios")
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

    const fetchGrupos = async () => {
      try {
        const response = await apiClient.getGrupos()
        if (response.data) {
          setGrupos(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar grupos:", error)
      }
    }

    if (cpf) {
      fetchUsuario()
      fetchUFs()
      fetchGrupos()
    }
  }, [cpf, router])

  // Verificar permissões
  useEffect(() => {
    const verificarPermissoes = () => {
      if (!user || !usuario) return
      
      const podeEditar = 
        user.tipo_usuario === "rh" || 
        (user.flag_gestor === "S" && user.grupo_id === usuario.grupo_id) ||
        user.cpf === usuario.cpf

      if (!podeEditar) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para editar este usuário",
          variant: "destructive",
        })
        router.push("/usuarios")
      }
    }

    verificarPermissoes()
  }, [user, usuario, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGestorChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, flag_gestor: checked ? "S" : "N" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cpf) return

    setIsSaving(true)
    try {
      const response = await apiClient.updateUsuario(cpf, formData)
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso",
        })
        router.push("/usuarios")
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível atualizar o usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Verificar se o usuário pode editar certos campos
  const podeEditarTipoEGrupo = (): boolean => {
    if (!user || !usuario) return false
    
    // Apenas RH pode mudar tipo e grupo
    return user.tipo_usuario === "rh"
  }

  // Verificar se o usuário pode editar flag de gestor
  const podeEditarGestor = (): boolean => {
    if (!user || !usuario) return false
    
    // RH pode editar qualquer flag de gestor
    if (user.tipo_usuario === "rh") return true
    
    // Gestor só pode editar flag de gestor do seu grupo
    return user.flag_gestor === "S" && user.grupo_id === usuario.grupo_id && user.cpf !== usuario.cpf
  }

  const renderFormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input 
              id="cpf" 
              value={formatCPF(cpf)}
              disabled
            />
            <p className="text-xs text-muted-foreground">O CPF não pode ser alterado</p>
          </div>
          
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
              onValueChange={(value) => handleSelectChange("UF", value)}
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
          
          {podeEditarTipoEGrupo() && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tipo-usuario">Tipo de Usuário</Label>
                <Select
                  value={formData.tipo_usuario}
                  onValueChange={(value) => handleSelectChange("tipo_usuario", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comum">Comum</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="rh">RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo</Label>
                <Select
                  value={formData.grupo_id?.toString()}
                  onValueChange={(value) => handleSelectChange("grupo_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id.toString()}>
                        {grupo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        
        {podeEditarGestor() && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="gestor"
              checked={formData.flag_gestor === "S"}
              onCheckedChange={handleGestorChange}
            />
            <Label htmlFor="gestor" className="cursor-pointer">
              Este usuário é um gestor
            </Label>
          </div>
        )}
      </div>
      
      <Separator />

      <CardFooter className="px-0">
        <div className="flex justify-between w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/usuarios")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardFooter>
    </form>
  )

  return (
    <RouteGuard>
      <AppLayout 
        title="Editar Usuário" 
        subtitle={usuario ? usuario.nome : "Carregando..."}
      >
        <div className="space-y-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Formulário de Edição</CardTitle>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderFormContent()
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 