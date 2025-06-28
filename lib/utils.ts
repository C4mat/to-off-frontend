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
export function formatDate(date: string | Date, includeTime: boolean = false): string {
  if (!date) return 'N/A'
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (includeTime) {
      return d.toLocaleString('pt-BR')
    }
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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'aprovado':
      return 'bg-green-500'
    case 'pendente':
      return 'bg-yellow-500'
    case 'rejeitado':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Validação dos dígitos verificadores
  let sum = 0
  let remainder
  
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleaned.substring(i-1, i)) * (11 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false
  
  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleaned.substring(i-1, i)) * (12 - i)
  }
  
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false
  
  return true
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Validação dos dígitos verificadores
  let size = cleaned.length - 2
  let numbers = cleaned.substring(0, size)
  const digits = cleaned.substring(size)
  let sum = 0
  let pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11
  if (result !== parseInt(digits.charAt(0))) return false
  
  size = size + 1
  numbers = cleaned.substring(0, size)
  sum = 0
  pos = size - 7
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11
  if (result !== parseInt(digits.charAt(1))) return false
  
  return true
}
