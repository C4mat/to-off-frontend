"use client"

import { useState, useEffect } from "react"
import { apiClient, type UF } from "@/lib/api"
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

export function UfsTab() {
  const [ufs, setUfs] = useState<UF[]>([])
  const [filteredUfs, setFilteredUfs] = useState<UF[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUf, setEditingUf] = useState<UF | null>(null)
  const [formData, setFormData] = useState({
    cod_uf: "",
    uf: "",
  })

  useEffect(() => {
    fetchUfs()
  }, [])

  const fetchUfs = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getUFs()
      if (response.data) {
        setUfs(response.data)
        setFilteredUfs(response.data)
      }
    } catch (error) {
      console.error("Erro ao carregar UFs:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as UFs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar UFs conforme pesquisa
  useEffect(() => {
    const filtered = ufs.filter((uf) =>
      uf.uf.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUfs(filtered)
  }, [searchTerm, ufs])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      cod_uf: "",
      uf: "",
    })
    setEditingUf(null)
  }

  const handleOpenDialog = (uf?: UF) => {
    if (uf) {
      setEditingUf(uf)
      setFormData({
        cod_uf: uf.cod_uf.toString(),
        uf: uf.uf,
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

    if (!formData.cod_uf.trim() || !formData.uf.trim()) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    // Validar se o código UF é um número
    if (isNaN(Number(formData.cod_uf))) {
      toast({
        title: "Erro",
        description: "O código da UF deve ser um número",
        variant: "destructive",
      })
      return
    }

    // Validar se a UF tem no máximo 2 caracteres
    if (formData.uf.length > 2) {
      toast({
        title: "Erro",
        description: "A UF deve ter no máximo 2 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      let response
      
      if (editingUf) {
        // Aqui seria a atualização, mas a API não tem endpoint para isso
        // Simulando uma atualização local
        toast({
          title: "Aviso",
          description: "A API não suporta atualização de UFs. Apenas simulando localmente.",
        })
        
        setUfs(ufs.map(uf => 
          uf.cod_uf === editingUf.cod_uf 
            ? { ...uf, uf: formData.uf } 
            : uf
        ))
      } else {
        response = await apiClient.createUF({
          cod_uf: Number(formData.cod_uf),
          uf: formData.uf.toUpperCase(),
        })
        
        if (response.data) {
          setUfs([...ufs, response.data])
          toast({
            title: "Sucesso",
            description: "UF criada com sucesso",
          })
        } else {
          toast({
            title: "Erro",
            description: response.error || "Não foi possível criar a UF",
            variant: "destructive",
          })
          return
        }
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar UF:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a UF",
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
            placeholder="Buscar UFs..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova UF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unidades Federativas (UFs)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Carregando UFs...</p>
            </div>
          ) : filteredUfs.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Nenhuma UF encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>UF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUfs.map((uf) => (
                    <TableRow key={uf.cod_uf}>
                      <TableCell>{uf.cod_uf}</TableCell>
                      <TableCell className="font-medium">{uf.uf}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(uf)}
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
              {editingUf ? "Editar UF" : "Nova UF"}
            </DialogTitle>
            <DialogDescription>
              {editingUf 
                ? "Edite as informações da UF abaixo." 
                : "Preencha as informações para criar uma nova UF."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cod_uf">Código *</Label>
                <Input 
                  id="cod_uf" 
                  name="cod_uf" 
                  value={formData.cod_uf} 
                  onChange={handleInputChange} 
                  required
                  disabled={!!editingUf}
                  type="number"
                />
                {editingUf && (
                  <p className="text-xs text-muted-foreground">O código não pode ser alterado</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="uf">UF (Sigla) *</Label>
                <Input 
                  id="uf" 
                  name="uf" 
                  value={formData.uf} 
                  onChange={handleInputChange} 
                  required
                  maxLength={2}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">Máximo 2 caracteres</p>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingUf ? "Salvar Alterações" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
