"use client"

import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DayPicker } from "react-day-picker"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventoCalendario, Feriado, apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

// Gerar anos de 2025 a 2099
const YEARS = Array.from({ length: 75 }, (_, i) => 2025 + i)

// Meses em português
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

export default function CalendarioPage() {
  const { user } = useAuth()
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(Math.max(2025, new Date().getFullYear()))
  const [eventos, setEventos] = useState<EventoCalendario[]>([])
  const [feriadosNacionais, setFeriadosNacionais] = useState<Feriado[]>([])
  const [feriadosEstaduais, setFeriadosEstaduais] = useState<Feriado[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<"todos" | "aprovados">("todos")
  
  // Dias com eventos
  const eventDays = eventos.map(evento => {
    const start = parseISO(evento.start)
    return {
      date: start,
      evento: evento
    }
  })
  
  // Dias com feriados
  const feriadoDays = [...feriadosNacionais, ...feriadosEstaduais].map(feriado => {
    const date = parseISO(feriado.data_feriado)
    return {
      date: date,
      feriado: feriado
    }
  })
  
  // Carregar dados do calendário
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Carregar eventos
        const apenasAprovados = viewMode === "aprovados"
        const eventosResponse = await apiClient.getCalendario(apenasAprovados)
        if (eventosResponse.data) {
          setEventos(eventosResponse.data)
        }
        
        // Carregar feriados nacionais
        const feriadosNacionaisResponse = await apiClient.getFeriadosNacionais()
        if (feriadosNacionaisResponse.data) {
          setFeriadosNacionais(feriadosNacionaisResponse.data)
        }
        
        // Carregar feriados estaduais do usuário
        if (user?.UF) {
          const feriadosEstaduaisResponse = await apiClient.getFeriadosEstaduais(user.UF)
          if (feriadosEstaduaisResponse.data) {
            setFeriadosEstaduais(feriadosEstaduaisResponse.data)
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados do calendário:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [viewMode, user?.UF])
  
  // Função para navegar entre meses
  const navigateMonth = (direction: number) => {
    let newMonth = selectedMonth + direction
    let newYear = selectedYear
    
    if (newMonth < 0) {
      newMonth = 11
      newYear--
    } else if (newMonth > 11) {
      newMonth = 0
      newYear++
    }
    
    // Garantir que o ano esteja entre 2025 e 2099
    newYear = Math.max(2025, Math.min(2099, newYear))
    
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }
  
  // Componente para renderizar um dia com evento ou feriado
  const renderDay = (date: Date) => {
    const eventsOnDay = eventDays.filter(
      eventDay => eventDay.date.getDate() === date.getDate() &&
                  eventDay.date.getMonth() === date.getMonth() &&
                  eventDay.date.getFullYear() === date.getFullYear()
    )
    
    const feriadosOnDay = feriadoDays.filter(
      feriadoDay => feriadoDay.date.getDate() === date.getDate() &&
                    feriadoDay.date.getMonth() === date.getMonth() &&
                    feriadoDay.date.getFullYear() === date.getFullYear()
    )
    
    const hasEvent = eventsOnDay.length > 0
    const hasFeriado = feriadosOnDay.length > 0
    
    const isToday = 
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth() &&
      date.getFullYear() === new Date().getFullYear()
    
    const isOutsideMonth = date.getMonth() !== selectedMonth
    
    return (
      <div 
        className={`
          relative flex items-center justify-center w-9 h-9 rounded-full
          ${isToday ? 'border border-blue-600 font-semibold text-blue-600' : ''}
          ${isOutsideMonth ? 'text-gray-400' : ''}
        `}
      >
        <span>{date.getDate()}</span>
        <div className="absolute bottom-1 flex items-center justify-center gap-1">
          {hasEvent && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
          {hasFeriado && <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />}
        </div>
      </div>
    )
  }
  
  return (
    <RouteGuard>
      <AppLayout title="Calendário" subtitle="Visualize eventos e feriados">
        <div className="space-y-6">
          {/* Controles do Calendário */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Calendário de Eventos</CardTitle>
                <div className="flex items-center space-x-2">
                  <Tabs defaultValue="todos" value={viewMode} onValueChange={(value) => setViewMode(value as "todos" | "aprovados")}>
                    <TabsList>
                      <TabsTrigger value="todos">Todos os Eventos</TabsTrigger>
                      <TabsTrigger value="aprovados">Apenas Aprovados</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                {/* Seleção de Ano e Mês */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth(-1)}
                      disabled={selectedYear === 2025 && selectedMonth === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={selectedMonth.toString()}
                        onValueChange={(value) => setSelectedMonth(parseInt(value))}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>{MONTHS[selectedMonth]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>{selectedYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateMonth(1)}
                      disabled={selectedYear === 2099 && selectedMonth === 11}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span className="text-sm text-gray-600">Evento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span className="text-sm text-gray-600">Feriado</span>
                    </div>
                  </div>
                </div>
                
                {/* Calendário */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-center font-semibold text-lg mb-3">
                    {MONTHS[selectedMonth]} {selectedYear}
                  </div>
                  <DayPicker
                    mode="single"
                    month={new Date(selectedYear, selectedMonth)}
                    onMonthChange={(month) => {
                      setSelectedMonth(month.getMonth())
                      setSelectedYear(month.getFullYear())
                    }}
                    locale={ptBR}
                    weekStartsOn={0}
                    showOutsideDays
                    fixedWeeks
                    className="w-full"
                    classNames={{
                      months: "w-full",
                      month: "w-full",
                      table: "w-full",
                      head_row: "flex w-full justify-between mb-1",
                      row: "flex w-full justify-between mb-1",
                      cell: "p-0 relative",
                      day: "w-9 h-9 p-0 mx-auto",
                      day_outside: "text-gray-400 opacity-50",
                      day_today: "font-bold text-blue-600",
                      day_selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-full",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
                      caption: "flex justify-between items-center px-2",
                      caption_label: "font-medium text-gray-900",
                      head_cell: "text-gray-500 rounded-md w-9 font-normal text-xs uppercase"
                    }}
                    styles={{
                      caption: { display: 'none' },
                      nav: { display: 'none' }
                    }}
                    components={{
                      Day: ({ date, ...props }) => (
                        <div {...props}>
                          {renderDay(date)}
                        </div>
                      )
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de Eventos */}
          <Card>
            <CardHeader>
              <CardTitle>Eventos do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : eventos.filter(evento => {
                  const eventDate = parseISO(evento.start)
                  return isValid(eventDate) && 
                         eventDate.getMonth() === selectedMonth && 
                         eventDate.getFullYear() === selectedYear
                }).length > 0 ? (
                <div className="space-y-4">
                  {eventos
                    .filter(evento => {
                      const eventDate = parseISO(evento.start)
                      return isValid(eventDate) && 
                             eventDate.getMonth() === selectedMonth && 
                             eventDate.getFullYear() === selectedYear
                    })
                    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime())
                    .map((evento) => (
                      <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">{evento.title}</h4>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(evento.start), "dd 'de' MMMM", { locale: ptBR })} - 
                              {evento.extendedProps.total_dias > 1 
                                ? ` ${evento.extendedProps.total_dias} dias` 
                                : " 1 dia"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={
                          evento.extendedProps.status === "aprovado" ? "default" :
                          evento.extendedProps.status === "rejeitado" ? "destructive" : "outline"
                        }>
                          {evento.extendedProps.status === "aprovado" ? "Aprovado" :
                           evento.extendedProps.status === "rejeitado" ? "Rejeitado" : "Pendente"}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum evento encontrado para este mês
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Lista de Feriados */}
          <Card>
            <CardHeader>
              <CardTitle>Feriados do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : [...feriadosNacionais, ...feriadosEstaduais].filter(feriado => {
                  const feriadoDate = parseISO(feriado.data_feriado)
                  return isValid(feriadoDate) && 
                         feriadoDate.getMonth() === selectedMonth && 
                         feriadoDate.getFullYear() === selectedYear
                }).length > 0 ? (
                <div className="space-y-4">
                  {[...feriadosNacionais, ...feriadosEstaduais]
                    .filter(feriado => {
                      const feriadoDate = parseISO(feriado.data_feriado)
                      return isValid(feriadoDate) && 
                             feriadoDate.getMonth() === selectedMonth && 
                             feriadoDate.getFullYear() === selectedYear
                    })
                    .sort((a, b) => parseISO(a.data_feriado).getTime() - parseISO(b.data_feriado).getTime())
                    .map((feriado, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">{feriado.descricao_feriado}</h4>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(feriado.data_feriado), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {feriado.uf === "BR" ? "Nacional" : feriado.uf}
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum feriado encontrado para este mês
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 