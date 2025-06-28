"use client"

import { useEffect, useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Usuario } from "@/lib/api"
import { formatCPF, formatDate, getUserTypeLabel } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2,
  Shield,
  User,
  UserCog,
  UserX,
  Check,
  X,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function UsuariosPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsuarios = async () => {
      setIsLoading(true)
      try {
        let response
        
        if (user?.tipo_usuario === "rh") {
          // RH vê todos os usuários
          response = await apiClient.getUsuarios()
        } else if (user?.flag_gestor === "S") {
          // Gestor vê apenas usuários do grupo
          response = await apiClient.getUsuarios({ grupo_id: user.grupo_id })
        } else {
          // Usuário comum vê apenas usuários do seu grupo
          response = await apiClient.getUsuarios({ grupo_id: user?.grupo_id })
        }
        
        if (response?.data) {
          setUsuarios(response.data)
          setFilteredUsuarios(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os usuários",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchUsuarios()
    }
  }, [user])

  // Filtrar usuários conforme pesquisa
  useEffect(() => {
    const filtered = usuarios.filter(
      (usuario) =>
        usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        usuario.grupo_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(usuario.cpf).includes(searchTerm)
    )
    setFilteredUsuarios(filtered)
  }, [searchTerm, usuarios])

  // Verificar se o usuário pode adicionar novos usuários
  const canAddUser = (): boolean => {
    if (!user) return false
    return user.tipo_usuario === "rh" || user.flag_gestor === "S"
  }

  // Verificar se o usuário pode editar outro usuário
  const canEditUser = (usuario: Usuario): boolean => {
    if (!user) return false
    
    // RH pode editar qualquer usuário
    if (user.tipo_usuario === "rh") return true
    
    // Gestor pode editar usuários do seu grupo
    if (user.flag_gestor === "S" && user.grupo_id === usuario.grupo_id) return true
    
    // Usuário pode editar ele mesmo
    return user.cpf === usuario.cpf
  }

  // Verificar se o usuário pode excluir outro usuário
  const canDeleteUser = (usuario: Usuario): boolean => {
    if (!user) return false
    
    // RH pode excluir qualquer usuário
    if (user.tipo_usuario === "rh") return true
    
    // Gestor pode excluir usuários do seu grupo (exceto ele mesmo)
    if (user.flag_gestor === "S" && user.grupo_id === usuario.grupo_id && user.cpf !== usuario.cpf) return true
    
    return false
  }

  const handleAtivarDesativar = async (cpf: number, ativar: boolean) => {
    const usuarioToUpdate = usuarios.find(u => u.cpf === cpf)
    
    if (!usuarioToUpdate) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive",
      })
      return
    }
    
    const podeDesativar = canDeleteUser(usuarioToUpdate)
    if (!podeDesativar) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para alterar o status deste usuário",
        variant: "destructive",
      })
      return
    }

    const confirmMessage = ativar 
      ? "Tem certeza que deseja ativar este usuário?" 
      : "Tem certeza que deseja desativar este usuário?"
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      let response
      
      if (ativar) {
        // Ativa o usuário
        response = await apiClient.updateUsuario(cpf, { ativo: true })
      } else {
        // Desativa o usuário
        response = await apiClient.updateUsuario(cpf, { ativo: false })
      }
      
      if (response.data) {
        const statusMessage = ativar ? "ativado" : "desativado"
        toast({
          title: "Sucesso",
          description: `Usuário ${statusMessage} com sucesso`,
        })
        
        // Atualizar lista de usuários
        setUsuarios(usuarios.map(usuario => 
          usuario.cpf === cpf ? { ...usuario, ativo: ativar } : usuario
        ))
        setFilteredUsuarios(filteredUsuarios.map(usuario => 
          usuario.cpf === cpf ? { ...usuario, ativo: ativar } : usuario
        ))
      } else {
        toast({
          title: "Erro",
          description: response.error || `Não foi possível ${ativar ? 'ativar' : 'desativar'} o usuário`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Erro ao ${ativar ? 'ativar' : 'desativar'} usuário:`, error)
      toast({
        title: "Erro",
        description: `Não foi possível ${ativar ? 'ativar' : 'desativar'} o usuário`,
        variant: "destructive",
      })
    }
  }

  const getTipoUsuarioIcon = (tipo: string, isGestor: boolean) => {
    if (tipo === "rh") return <Shield className="h-4 w-4 text-blue-600" />
    if (isGestor) return <UserCog className="h-4 w-4 text-green-600" />
    return <User className="h-4 w-4 text-gray-600" />
  }

  return (
    <RouteGuard>
      <AppLayout title="Usuários" subtitle="Gerenciar colaboradores do sistema">
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar usuários..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {canAddUser() && (
              <Button asChild>
                <Link href="/usuarios/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Link>
              </Button>
            )}
          </div>

          {/* Tabela de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Carregando usuários...</p>
                </div>
              ) : filteredUsuarios.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF / Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsuarios.map((usuario) => (
                        <TableRow key={usuario.cpf} className={!usuario.ativo ? "opacity-60" : ""}>
                          <TableCell className="font-medium">{usuario.nome}</TableCell>
                          <TableCell>
                            <div>
                              <div>{formatCPF(usuario.cpf)}</div>
                              <div className="text-xs text-muted-foreground">{usuario.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {getTipoUsuarioIcon(usuario.tipo_usuario, usuario.flag_gestor === "S")}
                              <span>{getUserTypeLabel(usuario.tipo_usuario)}</span>
                              {usuario.flag_gestor === "S" && (
                                <Badge variant="outline" className="ml-1 text-xs">Gestor</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{usuario.grupo_nome}</TableCell>
                          <TableCell>{formatDate(usuario.inicio_na_empresa)}</TableCell>
                          <TableCell>
                            {usuario.ativo ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                            ) : (
                              <Badge variant="destructive">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              {canEditUser(usuario) && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/usuarios/editar/${usuario.cpf}`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Link>
                                </Button>
                              )}
                              
                              {canDeleteUser(usuario) && (
                                <>
                                  {usuario.ativo ? (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleAtivarDesativar(usuario.cpf, false)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <UserX className="h-4 w-4" />
                                      <span className="sr-only">Desativar</span>
                                    </Button>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleAtivarDesativar(usuario.cpf, true)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Ativar</span>
                                    </Button>
                                  )}
                                </>
                              )}
                              
                              {user && user.cpf === usuario.cpf && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  asChild
                                >
                                  <Link href="/perfil">
                                    <User className="h-4 w-4" />
                                    <span className="sr-only">Meu Perfil</span>
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 