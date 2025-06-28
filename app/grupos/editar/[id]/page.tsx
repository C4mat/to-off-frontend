"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Grupo, type Empresa } from "@/lib/api"
import { formatCNPJ } from "@/lib/utils"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditarGrupoPage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { user } = useAuth()
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [formData, setFormData] = useState<Partial<Grupo>>({
    nome: "",
    descricao: "",
    telefone: "",
    cnpj_empresa: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchGrupo = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const response = await apiClient.getGrupo(id)
        if (response.data) {
          setGrupo(response.data)
          setFormData({
            nome: response.data.nome,
            descricao: response.data.descricao,
            telefone: response.data.telefone,
            cnpj_empresa: response.data.cnpj_empresa,
          })
        } else {
          toast({
            title: "Erro",
            description: "Grupo não encontrado",
            variant: "destructive",
          })
          router.push("/grupos")
        }
      } catch (error) {
        console.error("Erro ao carregar grupo:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do grupo",
          variant: "destructive",
        })
        router.push("/grupos")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchEmpresas = async () => {
      try {
        const response = await apiClient.getEmpresas()
        if (response.data) {
          setEmpresas(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar empresas:", error)
      }
    }

    if (id) {
      fetchGrupo()
      fetchEmpresas()
    }
  }, [id, router])

  // Verificar permissões
  useEffect(() => {
    const verificarPermissoes = () => {
      if (!user) return
      
      const podeEditar = user.tipo_usuario === "rh"

      if (!podeEditar) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para editar grupos",
          variant: "destructive",
        })
        router.push("/grupos")
      }
    }

    verificarPermissoes()
  }, [user, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmpresaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, cnpj_empresa: Number(value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setIsSaving(true)
    try {
      const response = await apiClient.updateGrupo(id, formData)
      
      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Grupo atualizado com sucesso",
        })
        router.push("/grupos")
      } else {
        toast({
          title: "Erro",
          description: response.error || "Não foi possível atualizar o grupo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar grupo:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o grupo",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderFormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Grupo</Label>
            <Input 
              id="nome" 
              name="nome" 
              value={formData.nome} 
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
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            <Select
              value={formData.cnpj_empresa?.toString()}
              onValueChange={handleEmpresaChange}
              disabled={empresas.length <= 1}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((empresa) => (
                  <SelectItem key={empresa.cnpj} value={empresa.cnpj.toString()}>
                    {empresa.nome} ({formatCNPJ(empresa.cnpj)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {empresas.length <= 1 && (
              <p className="text-xs text-muted-foreground">Apenas uma empresa disponível</p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea 
              id="descricao" 
              name="descricao" 
              value={formData.descricao || ""} 
              onChange={handleInputChange}
              rows={3}
            />
          </div>
        </div>
      </div>
      
      <Separator />

      <CardFooter className="px-0">
        <div className="flex justify-between w-full">
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <Link href="/grupos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </CardFooter>
    </form>
  )

  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout 
        title="Editar Grupo" 
        subtitle={grupo ? grupo.nome : "Carregando..."}
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