import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  UserCheck,
  ClipboardList,
  Settings,
  BarChart3,
  FileText,
  Clock,
  MapPin,
  Briefcase,
  CalendarDays,
  Shield,
  User,
  UserPlus,
  Bell,
} from "lucide-react"
import type { NavigationSection } from "@/types/navigation"

export const navigationConfig: NavigationSection[] = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        name: "Calendário",
        href: "/calendario",
        icon: Calendar,
      },
    ],
  },
  {
    title: "Eventos",
    items: [
      {
        name: "Meus Eventos",
        href: "/eventos",
        icon: ClipboardList,
      },
      {
        name: "Solicitar Evento",
        href: "/eventos/novo",
        icon: CalendarDays,
      },
      {
        name: "Aprovações",
        href: "/aprovacoes",
        icon: UserCheck,
        requireGestor: true,
      },
      {
        name: "Notificações",
        href: "/notificacoes",
        icon: Bell,
      },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        name: "Usuários",
        href: "/usuarios",
        icon: Users,
        children: [
          {
            name: "Listar Usuários",
            href: "/usuarios",
            icon: Users,
          },
          {
            name: "Novo Usuário",
            href: "/usuarios/novo",
            icon: Users,
            requiredUserType: "rh",
          },
        ],
      },
      {
        name: "Grupos",
        href: "/grupos",
        icon: Building2,
        requiredUserType: "rh",
        children: [
          {
            name: "Listar Grupos",
            href: "/grupos",
            icon: Building2,
          },
          {
            name: "Novo Grupo",
            href: "/grupos/novo",
            icon: Building2,
          },
        ],
      },
      {
        name: "Empresa",
        href: "/empresa",
        icon: Briefcase,
        requiredUserType: "rh",
      },
    ],
  },
  {
    title: "Configurações",
    items: [
      {
        name: "Config. Ausências",
        href: "/configuracoes",
        icon: Settings,
        requiredUserType: "rh",
      },
    ],
  },
  {
    title: "Relatórios",
    items: [
      {
        name: "Relatórios",
        href: "/relatorios",
        icon: BarChart3,
        requiredUserType: "rh",
      },
      {
        name: "Integridade",
        href: "/relatorios/integridade",
        icon: Shield,
        requiredUserType: "rh",
      },
      {
        name: "Férias",
        href: "/relatorios/ferias",
        icon: FileText,
      },
    ],
  },
  {
    title: "Conta",
    items: [
      {
        name: "Meu Perfil",
        href: "/perfil",
        icon: User,
      },
    ],
  },
]
