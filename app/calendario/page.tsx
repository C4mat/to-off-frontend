"use client"

import React from 'react'
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import dynamic from 'next/dynamic'

// Importar o componente de calendário dinamicamente para evitar problemas de SSR
const CalendarioComponent = dynamic(
  () => import('./calendario-component'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando calendário...</p>
        </div>
      </div>
    )
  }
)

export default function CalendarioPage() {
  return (
    <RouteGuard>
      <AppLayout title="Calendário" subtitle="Visualize eventos e feriados">
        <CalendarioComponent />
      </AppLayout>
    </RouteGuard>
  )
}