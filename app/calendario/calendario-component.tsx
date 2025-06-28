"use client"

import React, { useState, useEffect } from "react"
import { Calendar, momentLocalizer, Views } from "react-big-calendar"
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import moment from "moment"
import "moment/locale/pt-br"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventoCalendario, Feriado, apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Configurar o localizador para o calendário
moment.locale("pt-br")
const localizer = momentLocalizer(moment)

// Cores do tema
const COLORS = {
  primary: "#e3d0cf",
  secondary: "#7c3c3c",
  accent: "#a05c5c",
  highlight: "#c99393",
  text: "#333333",
  background: "#ffffff",
  border: "#e2e8f0",
}

// Mensagens em português
const messages = {
  today: "hoje",
  previous: "anterior",
  next: "próximo",
  month: "mês",
  week: "semana",
  day: "dia",
  agenda: "lista",
  date: "data",
  time: "hora",
  event: "evento",
  allDay: "dia inteiro",
  noEventsInRange: "Nenhum evento neste período",
}

// Componente para renderizar um evento no calendário
const EventComponent = ({ event }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="text-white p-1 rounded truncate cursor-pointer text-xs"
            style={{ 
              backgroundColor: event.color || COLORS.accent,
              height: "100%",
              display: "flex",
              alignItems: "center"
            }}
          >
            {event.title}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-bold">{event.title}</p>
            <p>{format(event.start, 'dd/MM/yyyy HH:mm')}</p>
            <p>Status: {event.extendedProps?.status || "N/A"}</p>
            {event.extendedProps?.usuario_nome && (
              <p>Usuário: {event.extendedProps.usuario_nome}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default function CalendarioComponent() {
  const { user } = useAuth()
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [eventos, setEventos] = useState<any[]>([])
  const [feriadosNacionais, setFeriadosNacionais] = useState<Feriado[]>([])
  const [feriadosEstaduais, setFeriadosEstaduais] = useState<Feriado[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<"todos" | "aprovados">("todos")
  const [viewType, setViewType] = useState<string>(Views.MONTH)
  
  // Carregar dados do calendário
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Carregar eventos
        const apenasAprovados = viewMode === "aprovados"
        const eventosResponse = await apiClient.getCalendario(apenasAprovados)
        if (eventosResponse.data) {
          // Converter eventos para o formato do react-big-calendar
          const formattedEvents = eventosResponse.data.map(evento => ({
            id: evento.id,
            title: evento.title,
            start: parseISO(evento.start),
            end: parseISO(evento.end),
            color: evento.color || COLORS.accent,
            extendedProps: evento.extendedProps
          }))
          setEventos(formattedEvents)
        }
        
        // Carregar feriados nacionais
        const feriadosNacionaisResponse = await apiClient.getFeriadosNacionais()
        if (feriadosNacionaisResponse.data) {
          setFeriadosNacionais(feriadosNacionaisResponse.data)
          
          // Adicionar feriados nacionais como eventos
          if (feriadosNacionaisResponse.data.length > 0) {
            const feriadosEvents = feriadosNacionaisResponse.data.map(feriado => {
              const feriadoDate = parseISO(feriado.data_feriado)
              return {
                id: `feriado-nacional-${feriado.data_feriado}`,
                title: `Feriado: ${feriado.descricao_feriado}`,
                start: feriadoDate,
                end: feriadoDate,
                allDay: true,
                color: "#ef4444", // Vermelho para feriados
                extendedProps: {
                  tipo: "feriado",
                  descricao: feriado.descricao_feriado,
                  uf: "Nacional"
                }
              }
            })
            
            setEventos(prev => [...prev, ...feriadosEvents])
          }
        }
        
        // Carregar feriados estaduais do usuário
        if (user?.UF) {
          const feriadosEstaduaisResponse = await apiClient.getFeriadosEstaduais(user.UF)
          if (feriadosEstaduaisResponse.data) {
            setFeriadosEstaduais(feriadosEstaduaisResponse.data)
            
            // Adicionar feriados estaduais como eventos
            if (feriadosEstaduaisResponse.data.length > 0) {
              const feriadosEvents = feriadosEstaduaisResponse.data.map(feriado => {
                const feriadoDate = parseISO(feriado.data_feriado)
                return {
                  id: `feriado-estadual-${feriado.data_feriado}`,
                  title: `Feriado ${feriado.uf}: ${feriado.descricao_feriado}`,
                  start: feriadoDate,
                  end: feriadoDate,
                  allDay: true,
                  color: "#f97316", // Laranja para feriados estaduais
                  extendedProps: {
                    tipo: "feriado",
                    descricao: feriado.descricao_feriado,
                    uf: feriado.uf
                  }
                }
              })
              
              setEventos(prev => [...prev, ...feriadosEvents])
            }
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
  
  // Função para navegar entre datas
  const navigate = (direction: number) => {
    const newDate = new Date(currentDate)
    
    switch (viewType) {
      case Views.MONTH:
        newDate.setMonth(newDate.getMonth() + direction)
        break
      case Views.WEEK:
        newDate.setDate(newDate.getDate() + direction * 7)
        break
      case Views.DAY:
        newDate.setDate(newDate.getDate() + direction)
        break
      case Views.AGENDA:
        newDate.setMonth(newDate.getMonth() + direction)
        break
    }
    
    setCurrentDate(newDate)
  }
  
  // Função para ir para hoje
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  // Função para formatar cabeçalhos
  const formats = {
    monthHeaderFormat: (date) => format(date, 'MMMM yyyy', { locale: ptBR }),
    dayHeaderFormat: (date) => format(date, 'dd MMMM yyyy', { locale: ptBR }),
    dayRangeHeaderFormat: ({ start, end }) => 
      `${format(start, 'dd', { locale: ptBR })} - ${format(end, 'dd MMMM yyyy', { locale: ptBR })}`
  }
  
  // Estilização customizada para o calendário
  const calendarStyle = {
    height: 600,
    backgroundColor: "#fff",
    borderRadius: "0.5rem",
    border: "1px solid #e2e8f0",
    padding: "0.5rem",
  }
  
  return (
    <div className="space-y-4">
      {/* Controles do Calendário */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Calendário de Eventos</CardTitle>
            <div className="flex items-center space-x-2">
              <Tabs 
                defaultValue="todos" 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as "todos" | "aprovados")}
              >
                <TabsList>
                  <TabsTrigger value="todos">Todos os Eventos</TabsTrigger>
                  <TabsTrigger value="aprovados">Apenas Aprovados</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={goToToday}
              >
                hoje
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <h3 className="text-lg font-medium ml-2">
                {viewType === Views.MONTH && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                {viewType === Views.WEEK && `${format(startOfWeek(currentDate), 'dd')} - ${format(endOfWeek(currentDate), 'dd MMM yyyy', { locale: ptBR })}`}
                {viewType === Views.DAY && format(currentDate, 'dd MMMM yyyy', { locale: ptBR })}
                {viewType === Views.AGENDA && format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h3>
            </div>
            
            <div className="flex items-center">
              <Tabs 
                defaultValue={Views.MONTH} 
                value={viewType} 
                onValueChange={(value) => setViewType(value)}
              >
                <TabsList>
                  <TabsTrigger value={Views.MONTH}>mês</TabsTrigger>
                  <TabsTrigger value={Views.WEEK}>semana</TabsTrigger>
                  <TabsTrigger value={Views.DAY}>dia</TabsTrigger>
                  <TabsTrigger value={Views.AGENDA}>lista</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Calendário */}
          {loading ? (
            <div className="h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Carregando calendário...</p>
              </div>
            </div>
          ) : (
            <div className="calendar-container" style={{ height: '600px' }}>
              <style jsx global>{`
                .rbc-calendar {
                  background-color: #fff;
                  border-radius: 0.5rem;
                }
                .rbc-toolbar {
                  display: none;
                }
                .rbc-header {
                  padding: 8px 0;
                  font-weight: 500;
                  border-bottom: 1px solid #e2e8f0;
                }
                .rbc-today {
                  background-color: #e3d0cf30;
                }
                .rbc-off-range-bg {
                  background-color: #f8f9fa;
                }
                .rbc-event {
                  background-color: transparent;
                  border: none;
                  padding: 0;
                  margin: 0;
                }
                .rbc-event-content {
                  height: 100%;
                }
                .rbc-row-segment {
                  padding: 1px;
                }
                .rbc-show-more {
                  color: #7c3c3c;
                  font-size: 0.75rem;
                  background-color: transparent;
                }
                .rbc-day-slot .rbc-event {
                  border-radius: 4px;
                }
                .rbc-agenda-view table.rbc-agenda-table {
                  border: none;
                }
                .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
                  padding: 8px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .rbc-agenda-view table.rbc-agenda-table thead > tr > th {
                  padding: 8px;
                  border-bottom: 1px solid #e2e8f0;
                  font-weight: 500;
                }
              `}</style>
              <Calendar
                localizer={localizer}
                events={eventos}
                startAccessor="start"
                endAccessor="end"
                style={calendarStyle}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={viewType}
                onView={(view) => setViewType(view)}
                date={currentDate}
                onNavigate={(date) => setCurrentDate(date)}
                messages={messages}
                formats={formats}
                components={{
                  event: EventComponent,
                }}
                eventPropGetter={(event) => ({
                  style: {
                    backgroundColor: 'transparent',
                  }
                })}
                dayPropGetter={(date) => ({
                  style: {
                    backgroundColor: isSameDay(date, new Date()) ? '#e3d0cf30' : undefined,
                  }
                })}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 