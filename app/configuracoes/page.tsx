"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TiposAusenciaTab } from "./tipos-ausencia-tab"
import { TurnosTab } from "./turnos-tab"
import { FeriadosTab } from "./feriados-tab"
import { UfsTab } from "./ufs-tab"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState("tipos-ausencia")

  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout 
        title="Config. Ausências" 
        subtitle="Gerenciar tipos de ausência, turnos, feriados e UFs"
      >
        <div className="space-y-6">
          <Tabs 
            defaultValue="tipos-ausencia" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
              <TabsTrigger value="tipos-ausencia">Tipos de Ausência</TabsTrigger>
              <TabsTrigger value="turnos">Turnos</TabsTrigger>
              <TabsTrigger value="feriados">Feriados</TabsTrigger>
              <TabsTrigger value="ufs">UFs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tipos-ausencia" className="mt-6">
              <TiposAusenciaTab />
            </TabsContent>
            
            <TabsContent value="turnos" className="mt-6">
              <TurnosTab />
            </TabsContent>
            
            <TabsContent value="feriados" className="mt-6">
              <FeriadosTab />
            </TabsContent>
            
            <TabsContent value="ufs" className="mt-6">
              <UfsTab />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 