"use client"

import { useState } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { FileText, Shield, Calendar } from "lucide-react"

export default function RelatoriosPage() {
  const router = useRouter()
  
  const relatorios = [
    {
      title: "Integridade do Sistema",
      description: "Verificação completa da integridade dos dados do sistema",
      icon: Shield,
      href: "/relatorios/integridade",
      color: "bg-blue-100 text-blue-700",
    },
    {
      title: "Férias",
      description: "Relatório de férias dos colaboradores",
      icon: Calendar,
      href: "/relatorios/ferias",
      color: "bg-green-100 text-green-700",
    },
    {
      title: "Eventos",
      description: "Relatório de eventos por período",
      icon: FileText,
      href: "/relatorios/eventos",
      color: "bg-purple-100 text-purple-700",
    },
  ]

  return (
    <RouteGuard requiredUserType="rh">
      <AppLayout 
        title="Relatórios" 
        subtitle="Acesse os relatórios do sistema"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {relatorios.map((relatorio, index) => {
            const Icon = relatorio.icon
            
            return (
              <Card key={index} className="overflow-hidden">
                <CardHeader className={`${relatorio.color} flex flex-row items-center gap-4 p-6`}>
                  <div className="rounded-full bg-white p-2">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle>{relatorio.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {relatorio.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Acesse este relatório para obter informações detalhadas sobre {relatorio.title.toLowerCase()}.
                  </p>
                </CardContent>
                <CardFooter className="border-t bg-muted/50 p-6">
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(relatorio.href)}
                  >
                    Acessar Relatório
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </AppLayout>
    </RouteGuard>
  )
} 