"use client"

import { useState, useEffect } from "react"
import { apiClient, type Feriado, type UF } from "@/lib/api"
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { Search, Plus, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

export function FeriadosTab() {
  const [feriadosNacionais, setFeriadosNacionais] = useState<Feriado[]>([])
  const [feriadosEstaduais, setFeriadosEstaduais] = useState<Feriado[]>([])
  const [filteredFeriados, setFilteredFeriados] = useState<Feriado[]>([])
  const [ufs, setUfs] = useState<UF[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [tipoFeriado, setTipoFeriado] = useState<"nacional" | "estadual">("nacional")
  const [activeTab, setActiveTab] = useState<"nacionais" | "estaduais">("nacionais")
  const [formData, setFormData] = useState({
    data_feriado: "",
    descricao_feriado: "",
    uf: "",
  })

  useEffect(() => {
    fetchFeriados()
    fetchUFs()
  }, [])

  const fetchFeriados = async () => {
    setIsLoading(true)
    try {
      const responseNacionais = await apiClient.getFeriadosNacionais()
      const responseEstaduais = await apiClient.getFeriadosEstaduais()
      
      if (responseNacionais.data) {
        setFeriadosNacionais(responseNacionais.data)
        if (activeTab === "nacionais") {
          setFilteredFeriados(responseNacionais.data)
        }
      }
      
      if (responseEstaduais.data) {
        setFeriadosEstaduais(responseEstaduais.data)
        if (activeTab === "estaduais") {
          setFilteredFeriados(responseEstaduais.data)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar feriados:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feriados",
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

  // Atualizar feriados filtrados quando mudar a aba
  useEffect(() => {
    if (activeTab === "nacionais") {
      setFilteredFeriados(feriadosNacionais)
    } else {
      setFilteredFeriados(feriadosEstaduais)
    }
  }, [activeTab, feriadosNacionais, feriadosEstaduais])

  // Filtrar feriados conforme pesquisa
  useEffect(() => {
    const currentFeriados = activeTab === "nacionais" ? feriadosNacionais : feriadosEstaduais
    
    const filtered = currentFeriados.filter((feriado) =>
      feriado.descricao_feriado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatDate(feriado.data_feriado).includes(searchTerm) ||
      (feriado.uf && feriado.uf.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    setFilteredFeriados(filtered)
  }, [searchTerm, activeTab, feriadosNacionais, feriadosEstaduais])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUFChange = (value: string) => {
    setFormData((prev) => ({ ...prev, uf: value }))
  }

  const resetForm = () => {
    setFormData({
      data_feriado: "",
      descricao_feriado: "",
      uf: "",
    })
  }

  const handleOpenDialog = (tipo: "nacional" | "estadual") => {
    setTipoFeriado(tipo)
    resetForm()
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.data_feriado || !formData.descricao_feriado) {
      toast({
        title: "Erro",
        description: "Data e descrição são campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (tipoFeriado === "estadual" && !formData.uf) {
      toast({
        title: "Erro",
        description: "UF é obrigatória para feriados estaduais",
        variant: "destructive",
      })
      return
    }

    try {
      let response
      const feriadoData: Feriado = {
        data_feriado: formData.data_feriado,
        descricao_feriado: formData.descricao_feriado,
        uf: tipoFeriado === "estadual" ? formData.uf : "",
      }
      
      if (tipoFeriado === "nacional") {
        response = await apiClient.createFeriadoNacional(feriadoData)
        
        if (response.data) {
          setFeriadosNacionais([...feriadosNacionais, response.data])
          if (activeTab === "nacionais") {
            setFilteredFeriados([...filteredFeriados, response.data])
          }
          toast({
            title: "Sucesso",
            description: "Feriado nacional criado com sucesso",
          })
        } else {
          toast({
            title: "Erro",
            description: response.error || "Não foi possível criar o feriado nacional",
            variant: "destructive",
          })
          return
        }
      } else {
        response = await apiClient.createFeriadoEstadual(feriadoData)
        
        if (response.data) {
          setFeriadosEstaduais([...feriadosEstaduais, response.data])
          if (activeTab === "estaduais") {
            setFilteredFeriados([...filteredFeriados, response.data])
          }
          toast({
            title: "Sucesso",
            description: "Feriado estadual criado com sucesso",
          })
        } else {
          toast({
            title: "Erro",
            description: response.error || "Não foi possível criar o feriado estadual",
            variant: "destructive",
          })
          return
        }
      }
      
      handleCloseDialog()
    } catch (error) {
      console.error("Erro ao salvar feriado:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o feriado",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "nacionais" | "estaduais")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="nacionais">Feriados Nacionais</TabsTrigger>
          <TabsTrigger value="estaduais">Feriados Estaduais</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Buscar feriados..."
                className="pl-8 w-full sm:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => handleOpenDialog("nacional")}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Feriado Nacional
              </Button>
              <Button onClick={() => handleOpenDialog("estadual")}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Feriado Estadual
              </Button>
            </div>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>
                {activeTab === "nacionais" ? "Feriados Nacionais" : "Feriados Estaduais"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2">Carregando feriados...</p>
                </div>
              ) : filteredFeriados.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <p>Nenhum feriado encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        {activeTab === "estaduais" && <TableHead>UF</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFeriados.map((feriado, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(feriado.data_feriado)}</TableCell>
                          <TableCell className="font-medium">{feriado.descricao_feriado}</TableCell>
                          {activeTab === "estaduais" && <TableCell>{feriado.uf}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {tipoFeriado === "nacional" ? "Novo Feriado Nacional" : "Novo Feriado Estadual"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações para criar um novo feriado.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_feriado">Data *</Label>
                <Input 
                  id="data_feriado" 
                  name="data_feriado" 
                  type="date" 
                  value={formData.data_feriado} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao_feriado">Descrição *</Label>
                <Input 
                  id="descricao_feriado" 
                  name="descricao_feriado" 
                  value={formData.descricao_feriado} 
                  onChange={handleInputChange} 
                  required 
                />
              </div>
              
              {tipoFeriado === "estadual" && (
                <div className="space-y-2">
                  <Label htmlFor="uf">UF *</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={handleUFChange}
                    required
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
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
