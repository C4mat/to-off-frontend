import type { LucideIcon } from "lucide-react"

export interface NavigationItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  requiredUserType?: "rh" | "gestor" | "comum"
  requireGestor?: boolean
  children?: NavigationItem[]
}

export interface NavigationSection {
  title: string
  items: NavigationItem[]
}
