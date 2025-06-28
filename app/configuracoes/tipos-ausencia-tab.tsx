"use client"

import { useState, useEffect } from "react"
import { apiClient, type TipoAusencia } from "@/lib/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Edit, Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function TiposAusenciaTab() {
  const [tiposAusencia, setTiposAusencia] = useState<TipoAusencia[]>([])
  const [filteredTipos, setFilteredTipos] = useState<TipoAusencia[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoAusencia | null>(null)
  const [formData, setFormData] = useState({
    descricao_ausencia: "",
    usa_turno: false,
  })

  useEffect(() => {
    fetchTiposAusencia()
  }, [])

  const fetchTiposAusencia = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getTiposAusencia()
      if (response.data) {
        setTiposAusencia(response.data)
        setFilteredTipos(response.data)
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de ausência:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de ausência",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar tipos conforme pesquisa
  useEffect(() => {
    const filtered = tiposAusencia.filter((tipo) =>
      tipo.descricao_ausencia.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTipos(filtered)
  }, [searchTerm, tiposAusencia])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, usa_turno: checked }))
  }

  const resetForm = () => {
    setFormData({
      descricao_ausencia: "",
      usa_turno: false,
    })
    setEditingTipo(null)
  }

  const handleOpenDialog = (tipo?: TipoAusencia) => {
    if (tipo) {
      setEditingTipo(tipo)
      setFormData({
        descricao_ausencia: tipo.descricao_ausencia,
        usa_turno: tipo.usa_turno,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descricao_ausencia.trim()) {
      toast({
        title: "Erro",
        description: "A descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      let response
      
      if (editingTipo) {
        // Aqui seria a atualização, mas a API não tem endpoint para isso
        // Simulando uma atualização local
        toast({
          title: "Aviso",
          description: "A API não suporta atualização de tipos de ausência. Apenas simulando localmente.",
        })
        
        setTiposAusencia(tiposAusencia.map(tipo => 
          tipo.id_tipo_ausencia === editingTipo.id_tipo_ausencia 
            ? { ...tipo, ...formData } 
            : tipo
        ))
      } else {
        response = await apiClient.createTipoAusencia(formData)
        
        if (response.data) {
          setTiposAusencia([...tiposAusencia, response.data])
          toast({
            title: "Sucesso",
            description: "Tipo de ausência criado com sucesso",
          })
        } else {
          toast({
            title: "Erro",
            description: response.error || "Não foi possível criar o tipo de ausência",
            variant: "destructive",
          })
          return
        }
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar tipo de ausência:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o tipo de ausência",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar tipos de ausência..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Ausência</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Carregando tipos de ausência...</p>
            </div>
          ) : filteredTipos.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Nenhum tipo de ausência encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Usa Turno</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTipos.map((tipo) => (
                    <TableRow key={tipo.id_tipo_ausencia}>
                      <TableCell>{tipo.id_tipo_ausencia}</TableCell>
                      <TableCell className="font-medium">{tipo.descricao_ausencia}</TableCell>
                      <TableCell>
                        {tipo.usa_turno ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Sim</Badge>
                        ) : (
                          <Badge variant="outline">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(tipo)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTipo ? "Editar Tipo de Ausência" : "Novo Tipo de Ausência"}
            </DialogTitle>
            <DialogDescription>
              {editingTipo 
                ? "Edite as informações do tipo de ausência abaixo." 
                : "Preencha as informações para criar um novo tipo de ausência."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descricao_ausencia">Descrição *</Label>
              <Input 
                id="descricao_ausencia" 
                name="descricao_ausencia" 
                value={formData.descricao_ausencia} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="usa_turno"
                checked={formData.usa_turno}
                onCheckedChange={handleCheckboxChange}
              />
              <Label htmlFor="usa_turno" className="cursor-pointer">
                Usa Turno
              </Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTipo ? "Salvar Alterações" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 