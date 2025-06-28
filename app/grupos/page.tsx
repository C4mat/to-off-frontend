"use client"

import { useEffect, useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Grupo } from "@/lib/api"
import { formatCNPJ } from "@/lib/utils"
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
import { Search, Plus, Users, Pencil, Trash2, Check, X } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function GruposPage() {
  const { user } = useAuth()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [filteredGrupos, setFilteredGrupos] = useState<Grupo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGrupos = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.getGrupos()
        if (response.data) {
          setGrupos(response.data)
          setFilteredGrupos(response.data)
        }
      } catch (error) {
        console.error("Erro ao carregar grupos:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os grupos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchGrupos()
    }
  }, [user])

  // Filtrar grupos conforme pesquisa
  useEffect(() => {
    const filtered = grupos.filter(
      (grupo) =>
        grupo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (grupo.descricao && grupo.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
        grupo.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grupo.telefone.includes(searchTerm)
    )
    setFilteredGrupos(filtered)
  }, [searchTerm, grupos])

  // Verificar se o usuário pode gerenciar grupos
  const canManageGrupos = (): boolean => {
    if (!user) return false
    return user.tipo_usuario === "rh"
  }

  // Função para ativar/desativar grupo
  const handleAtivarDesativar = async (id: number, ativar: boolean) => {
    if (!canManageGrupos()) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para alterar o status de grupos",
        variant: "destructive",
      })
      return
    }

    const confirmMessage = ativar 
      ? "Tem certeza que deseja ativar este grupo?" 
      : "Tem certeza que deseja desativar este grupo?"
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await apiClient.updateGrupo(id, { ativo: ativar })
      
      if (response.data) {
        const statusMessage = ativar ? "ativado" : "desativado"
        toast({
          title: "Sucesso",
          description: `Grupo ${statusMessage} com sucesso`,
        })
        
        // Atualizar lista de grupos
        setGrupos(grupos.map(grupo => 
          grupo.id === id ? { ...grupo, ativo: ativar } : grupo
        ))
        setFilteredGrupos(filteredGrupos.map(grupo => 
          grupo.id === id ? { ...grupo, ativo: ativar } : grupo
        ))
      } else {
        toast({
          title: "Erro",
          description: response.error || `Não foi possível ${ativar ? 'ativar' : 'desativar'} o grupo`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Erro ao ${ativar ? 'ativar' : 'desativar'} grupo:`, error)
      toast({
        title: "Erro",
        description: `Não foi possível ${ativar ? 'ativar' : 'desativar'} o grupo`,
        variant: "destructive",
      })
    }
  }

  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout title="Grupos" subtitle="Gerenciar departamentos e equipes">
        <div className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar grupos..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {canManageGrupos() && (
              <Button asChild>
                <Link href="/grupos/novo">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Link>
              </Button>
            )}
          </div>

          {/* Tabela de Grupos */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Carregando grupos...</p>
                </div>
              ) : filteredGrupos.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Nenhum grupo encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Usuários</TableHead>
                        <TableHead>Status</TableHead>
                        {canManageGrupos() && <TableHead className="text-right">Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrupos.map((grupo) => (
                        <TableRow key={grupo.id}>
                          <TableCell className="font-medium">{grupo.nome}</TableCell>
                          <TableCell>{grupo.descricao || "-"}</TableCell>
                          <TableCell>
                            <div>
                              <div>{grupo.empresa_nome}</div>
                              <div className="text-xs text-muted-foreground">{formatCNPJ(grupo.cnpj_empresa)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{grupo.telefone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1.5 text-muted-foreground" />
                              <span>{grupo.total_usuarios}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {grupo.ativo ? (
                              <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
                            ) : (
                              <Badge variant="destructive">Inativo</Badge>
                            )}
                          </TableCell>
                          {canManageGrupos() && (
                            <TableCell className="text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/grupos/editar/${grupo.id}`}>
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Editar</span>
                                  </Link>
                                </Button>
                                
                                {grupo.ativo ? (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleAtivarDesativar(grupo.id, false)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Desativar</span>
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleAtivarDesativar(grupo.id, true)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Check className="h-4 w-4" />
                                    <span className="sr-only">Ativar</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
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