"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { formatCPF, getUserTypeLabel } from "@/lib/utils"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Acesso Negado</CardTitle>
          <CardDescription>Você não tem permissão para acessar esta página</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              Usuário: <strong>{user?.nome}</strong>
            </p>
            <p>
              CPF: <strong>{user ? formatCPF(user.cpf) : ""}</strong>
            </p>
            <p>
              Tipo: <strong>{user ? getUserTypeLabel(user.tipo_usuario) : ""}</strong>
            </p>
            <p>
              Gestor: <strong>{user?.flag_gestor === "S" ? "Sim" : "Não"}</strong>
            </p>
          </div>

          <Button onClick={() => router.push("/dashboard")} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
