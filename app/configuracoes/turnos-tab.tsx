"use client"

import { useState, useEffect } from "react"
import { apiClient, type Turno } from "@/lib/api"
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
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function TurnosTab() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [filteredTurnos, setFilteredTurnos] = useState<Turno[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null)
  const [formData, setFormData] = useState({
    descricao_ausencia: "",
  })

  useEffect(() => {
    fetchTurnos()
  }, [])

  const fetchTurnos = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getTurnos()
      if (response.data) {
        setTurnos(response.data)
        setFilteredTurnos(response.data)
      }
    } catch (error) {
      console.error("Erro ao carregar turnos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os turnos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar turnos conforme pesquisa
  useEffect(() => {
    const filtered = turnos.filter((turno) =>
      turno.descricao_ausencia.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTurnos(filtered)
  }, [searchTerm, turnos])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      descricao_ausencia: "",
    })
    setEditingTurno(null)
  }

  const handleOpenDialog = (turno?: Turno) => {
    if (turno) {
      setEditingTurno(turno)
      setFormData({
        descricao_ausencia: turno.descricao_ausencia,
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
      
      if (editingTurno) {
        // Aqui seria a atualização, mas a API não tem endpoint para isso
        // Simulando uma atualização local
        toast({
          title: "Aviso",
          description: "A API não suporta atualização de turnos. Apenas simulando localmente.",
        })
        
        setTurnos(turnos.map(turno => 
          turno.id === editingTurno.id 
            ? { ...turno, ...formData } 
            : turno
        ))
      } else {
        response = await apiClient.createTurno(formData)
        
        if (response.data) {
          setTurnos([...turnos, response.data])
          toast({
            title: "Sucesso",
            description: "Turno criado com sucesso",
          })
        } else {
          toast({
            title: "Erro",
            description: response.error || "Não foi possível criar o turno",
            variant: "destructive",
          })
          return
        }
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar turno:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o turno",
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
            placeholder="Buscar turnos..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Turno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turnos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Carregando turnos...</p>
            </div>
          ) : filteredTurnos.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Nenhum turno encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTurnos.map((turno) => (
                    <TableRow key={turno.id}>
                      <TableCell>{turno.id}</TableCell>
                      <TableCell className="font-medium">{turno.descricao_ausencia}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(turno)}
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
              {editingTurno ? "Editar Turno" : "Novo Turno"}
            </DialogTitle>
            <DialogDescription>
              {editingTurno 
                ? "Edite as informações do turno abaixo." 
                : "Preencha as informações para criar um novo turno."}
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTurno ? "Salvar Alterações" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 