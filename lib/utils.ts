import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatar CPF: 12345678901 -> 123.456.789-01
export function formatCPF(cpf: number | string): string {
  const cpfString = String(cpf).padStart(11, '0')
  return cpfString.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// Formatar CNPJ: 12345678000190 -> 12.345.678/0001-90
export function formatCNPJ(cnpj: number | string): string {
  const cnpjString = String(cnpj).padStart(14, '0')
  return cnpjString.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Formatar data: 2021-01-15 -> 15/01/2021
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A'
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR')
  } catch (error) {
    return 'Data inválida'
  }
}

// Calcular número de dias entre duas datas
export function calcDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate
    
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays + 1  // Inclusivo (contando o dia inicial e final)
  } catch (error) {
    return 0
  }
}

// Obter cores para os tipos de ausência
export function getEventColor(tipo: string, status?: string): string {
  if (status === 'pendente') return '#FF9800' // Laranja
  
  switch (tipo.toLowerCase()) {
    case 'férias':
      return '#4CAF50' // Verde
    case 'assiduidade':
      return '#2196F3' // Azul
    case 'plantão':
      return '#9C27B0' // Roxo
    case 'licença maternidade':
    case 'licença paternidade':
      return '#E91E63' // Rosa
    case 'evento especial':
      return '#607D8B' // Cinza Azulado
    default:
      return '#795548' // Marrom
  }
}

// Traduzir tipo de usuário para exibição
export function getUserTypeLabel(tipo: string): string {
  switch (tipo) {
    case 'rh':
      return 'Recursos Humanos'
    case 'gestor':
      return 'Gestor'
    case 'comum':
      return 'Usuário Comum'
    default:
      return tipo
  }
}

// Extrair iniciais do nome
export function getInitials(name: string): string {
  if (!name) return '??'
  
  const names = name.split(' ')
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase()
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase()
}

// Verificar se um usuário tem determinada permissão
export function hasPermission(
  user: { tipo_usuario: string; flag_gestor: string } | null, 
  requiredType?: string, 
  requireGestor?: boolean
): boolean {
  if (!user) return false
  
  // Verificar tipo específico de usuário
  if (requiredType && user.tipo_usuario !== requiredType) {
    return false
  }
  
  // Verificar se precisa ser gestor
  if (requireGestor && user.flag_gestor !== 'S') {
    return false
  }
  
  return true
}
