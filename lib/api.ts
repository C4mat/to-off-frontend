// Use URL relativa quando estiver em produção para aproveitar o proxy do Next.js
// Em desenvolvimento, use a URL completa da API
const API_BASE_URL = process.env.NODE_ENV === "production" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000")

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export interface LoginRequest {
  email: string
  senha: string
}

export interface LoginResponse {
  autenticado: boolean
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  usuario: Usuario
}

export interface RefreshRequest {
  refresh_token: string
}

export interface RefreshResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface UserResponse {
  usuario: Usuario
}

export interface Usuario {
  cpf: number
  nome: string
  email: string
  tipo_usuario: "rh" | "gestor" | "comum"
  flag_gestor: "S" | "N"
  UF: string
  grupo_id: number
  grupo_nome: string
  inicio_na_empresa: string
  ativo: boolean
  criado_em: string
}

export interface Empresa {
  cnpj: number
  id: number
  nome: string
  endereco: string
  telefone: string
  email: string
  ativa: boolean
  criado_em: string
  total_grupos: number
}

export interface Grupo {
  id: number
  nome: string
  descricao: string
  cnpj_empresa: number
  empresa_nome: string
  telefone: string
  ativo: boolean
  criado_em: string
  total_usuarios: number
}

export interface Evento {
  id: number
  cpf_usuario: number
  usuario_nome: string
  data_inicio: string
  data_fim: string
  total_dias: number
  id_tipo_ausencia: number
  tipo_ausencia_desc: string
  status: "pendente" | "aprovado" | "rejeitado"
  aprovado_por?: number
  aprovado_por_nome?: string
  criado_em: string
  UF: string
}

export interface TipoAusencia {
  id_tipo_ausencia: number
  descricao_ausencia: string
  usa_turno: boolean
}

export interface Turno {
  id: number
  descricao_ausencia: string
}

export interface UF {
  cod_uf: number
  uf: string
}

export interface Feriado {
  data_feriado: string
  uf: string
  descricao_feriado: string
}

export interface EventoCalendario {
  id: number
  title: string
  start: string
  end: string
  color: string
  extendedProps: {
    cpf_usuario: number
    usuario_nome: string
    tipo_ausencia: string
    status: string
    total_dias: number
    uf: string
  }
}

export interface EventoAprovacaoRequest {
  aprovador_cpf: number
  observacoes?: string
}

export interface ValidacaoIntegridade {
  summary: {
    timestamp: string
    total_errors: number
    total_warnings: number
    total_info: number
    statistics: {
      total_empresas: number
      total_grupos: number
      total_usuarios: number
      total_eventos: number
      total_ufs: number
    }
  }
  errors: Array<any>
  warnings: Array<any>
  info: Array<any>
  statistics: {
    total_empresas: number
    total_grupos: number
    total_usuarios: number
    total_eventos: number
    total_ufs: number
    usuarios_por_tipo: {
      rh: number
      gestor: number
      comum: number
    }
    eventos_por_status: {
      pendente: number
      aprovado: number
      rejeitado: number
    }
  }
}

export interface DiasFerias {
  cpf: string
  nome: string
  dias_disponiveis: number
  ultimo_periodo_aquisitivo_fim: string
}

export interface Notificacao {
  id: number
  usuario_cpf: number
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'error' | 'success'
  lida: boolean
  data_criacao: string
  link?: string
}

class ApiClient {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    console.log(`Fazendo requisição para: ${url}`);

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    if (this.accessToken) {
      headers.set("Authorization", `Bearer ${this.accessToken}`);
      console.log("Token de autenticação incluído na requisição");
    }

    try {
      if (process.env.NODE_ENV === "development" && this.useMockData(endpoint)) {
        console.log(`Usando dados mockados para: ${endpoint}`);
        return this.getMockResponse<T>(endpoint, options)
      }

      console.log(`Enviando requisição real para: ${url}`);
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`Resposta recebida de ${url} com status: ${response.status}`);
      
      const data = await response.json()

      if (!response.ok) {
        console.error(`Erro na requisição para ${url}:`, data);
        return {
          error: data.erro || data.message || "Erro na requisição",
        }
      }

      return { data }
    } catch (error) {
      console.error(`Erro ao fazer requisição para ${url}:`, error);
      return {
        error: error instanceof Error ? error.message : "Erro de conexão",
      }
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async refresh(refreshToken: string): Promise<ApiResponse<RefreshResponse>> {
    return this.request<RefreshResponse>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  async me(): Promise<ApiResponse<UserResponse>> {
    return this.request<UserResponse>("/api/auth/me")
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    })
  }

  async getEmpresas(): Promise<ApiResponse<Empresa[]>> {
    return this.request<Empresa[]>("/api/empresas")
  }

  async getEmpresa(cnpj: number): Promise<ApiResponse<Empresa>> {
    return this.request<Empresa>(`/api/empresas/${cnpj}`)
  }

  async updateEmpresa(cnpj: number, data: Partial<Empresa>): Promise<ApiResponse<Empresa>> {
    return this.request<Empresa>(`/api/empresas/${cnpj}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getGrupos(filters?: { cnpj_empresa?: number; ativos?: boolean }): Promise<ApiResponse<Grupo[]>> {
    let endpoint = "/api/grupos"
    const params = new URLSearchParams()
    
    if (filters?.cnpj_empresa) params.append("cnpj_empresa", filters.cnpj_empresa.toString())
    if (filters?.ativos !== undefined) params.append("ativos", filters.ativos.toString())
    
    if (params.toString()) endpoint += `?${params.toString()}`
    
    return this.request<Grupo[]>(endpoint)
  }

  async getGrupo(id: number): Promise<ApiResponse<Grupo>> {
    return this.request<Grupo>(`/api/grupos/${id}`)
  }

  async createGrupo(data: Partial<Grupo>): Promise<ApiResponse<Grupo>> {
    return this.request<Grupo>("/api/grupos", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateGrupo(id: number, data: Partial<Grupo>): Promise<ApiResponse<Grupo>> {
    return this.request<Grupo>(`/api/grupos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteGrupo(id: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/api/grupos/${id}`, {
      method: "DELETE",
    })
  }

  async getUsuarios(filters?: { 
    grupo_id?: number; 
    tipo_usuario?: string; 
    ativos?: boolean 
  }): Promise<ApiResponse<Usuario[]>> {
    let endpoint = "/api/usuarios"
    const params = new URLSearchParams()
    
    if (filters?.grupo_id) params.append("grupo_id", filters.grupo_id.toString())
    if (filters?.tipo_usuario) params.append("tipo_usuario", filters.tipo_usuario)
    if (filters?.ativos !== undefined) params.append("ativos", filters.ativos.toString())
    
    if (params.toString()) endpoint += `?${params.toString()}`
    
    return this.request<Usuario[]>(endpoint)
  }

  async getUsuario(cpf: number): Promise<ApiResponse<Usuario>> {
    return this.request<Usuario>(`/api/usuarios/${cpf}`)
  }

  async createUsuario(data: Partial<Usuario> & { senha: string }): Promise<ApiResponse<Usuario>> {
    return this.request<Usuario>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateUsuario(cpf: number, data: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return this.request<Usuario>(`/api/usuarios/${cpf}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUsuario(cpf: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/api/usuarios/${cpf}`, {
      method: "DELETE",
    })
  }

  async getEventos(filters?: { 
    cpf_usuario?: number; 
    grupo_id?: number; 
    status?: string 
  }): Promise<ApiResponse<Evento[]>> {
    let endpoint = "/api/eventos"
    const params = new URLSearchParams()
    
    if (filters?.cpf_usuario) params.append("cpf_usuario", filters.cpf_usuario.toString())
    if (filters?.grupo_id) params.append("grupo_id", filters.grupo_id.toString())
    if (filters?.status) params.append("status", filters.status)
    
    if (params.toString()) endpoint += `?${params.toString()}`
    
    return this.request<Evento[]>(endpoint)
  }

  async getEvento(id: number): Promise<ApiResponse<Evento>> {
    return this.request<Evento>(`/api/eventos/${id}`)
  }

  async createEvento(data: Partial<Omit<Evento, "id">>): Promise<ApiResponse<Evento>> {
    return this.request<Evento>("/api/eventos", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateEvento(id: number, data: Partial<Evento>): Promise<ApiResponse<Evento>> {
    return this.request<Evento>(`/api/eventos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteEvento(id: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/api/eventos/${id}`, {
      method: "DELETE",
    })
  }

  async aprovarEvento(id: number, data: EventoAprovacaoRequest): Promise<ApiResponse<Evento>> {
    return this.request<Evento>(`/api/eventos/${id}/aprovar`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async rejeitarEvento(id: number, data: EventoAprovacaoRequest): Promise<ApiResponse<Evento>> {
    return this.request<Evento>(`/api/eventos/${id}/rejeitar`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getUFs(): Promise<ApiResponse<UF[]>> {
    return this.request<UF[]>("/api/ufs")
  }

  async getUF(uf: string): Promise<ApiResponse<UF>> {
    return this.request<UF>(`/api/ufs/${uf}`)
  }

  async createUF(data: UF): Promise<ApiResponse<UF>> {
    return this.request<UF>("/api/ufs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTiposAusencia(): Promise<ApiResponse<TipoAusencia[]>> {
    return this.request<TipoAusencia[]>("/api/tipos-ausencia")
  }

  async getTipoAusencia(id: number): Promise<ApiResponse<TipoAusencia>> {
    return this.request<TipoAusencia>(`/api/tipos-ausencia/${id}`)
  }

  async createTipoAusencia(data: Partial<TipoAusencia>): Promise<ApiResponse<TipoAusencia>> {
    return this.request<TipoAusencia>("/api/tipos-ausencia", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTurnos(): Promise<ApiResponse<Turno[]>> {
    return this.request<Turno[]>("/api/turnos")
  }

  async getTurno(id: number): Promise<ApiResponse<Turno>> {
    return this.request<Turno>(`/api/turnos/${id}`)
  }

  async createTurno(data: Partial<Turno>): Promise<ApiResponse<Turno>> {
    return this.request<Turno>("/api/turnos", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getFeriadosNacionais(uf?: string): Promise<ApiResponse<Feriado[]>> {
    let endpoint = "/api/feriados/nacionais"
    if (uf) endpoint += `?uf=${uf}`
    return this.request<Feriado[]>(endpoint)
  }

  async getFeriadosEstaduais(uf?: string): Promise<ApiResponse<Feriado[]>> {
    let endpoint = "/api/feriados/estaduais"
    if (uf) endpoint += `?uf=${uf}`
    return this.request<Feriado[]>(endpoint)
  }

  async createFeriadoNacional(data: Feriado): Promise<ApiResponse<Feriado>> {
    return this.request<Feriado>("/api/feriados/nacionais", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async createFeriadoEstadual(data: Feriado): Promise<ApiResponse<Feriado>> {
    return this.request<Feriado>("/api/feriados/estaduais", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getIntegrityCheck(): Promise<ApiResponse<ValidacaoIntegridade>> {
    return this.request<ValidacaoIntegridade>("/api/validation/integrity-check")
  }

  async getIntegrityReport(): Promise<ApiResponse<{ report: string; summary: any }>> {
    return this.request<{ report: string; summary: any }>("/api/validation/integrity-report")
  }

  async getCalendario(apenasAprovados?: boolean): Promise<ApiResponse<EventoCalendario[]>> {
    let endpoint = "/api/calendario"
    if (apenasAprovados !== undefined) endpoint += `?apenas_aprovados=${apenasAprovados}`
    return this.request<EventoCalendario[]>(endpoint)
  }

  async getCalendarioGrupo(id: number, apenasAprovados?: boolean): Promise<ApiResponse<{ grupo: Partial<Grupo>; eventos: EventoCalendario[] }>> {
    let endpoint = `/api/calendario/grupo/${id}`
    if (apenasAprovados !== undefined) endpoint += `?apenas_aprovados=${apenasAprovados}`
    return this.request<{ grupo: Partial<Grupo>; eventos: EventoCalendario[] }>(endpoint)
  }

  async getDiasFerias(cpf: number): Promise<ApiResponse<DiasFerias>> {
    return this.request<DiasFerias>(`/api/ferias/disponivel/${cpf}`)
  }

  async getNotificacoes(): Promise<ApiResponse<Notificacao[]>> {
    return this.request<Notificacao[]>("/api/notificacoes")
  }

  async marcarNotificacaoComoLida(id: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/api/notificacoes/${id}/lida`, {
      method: "PUT",
    })
  }

  async marcarTodasNotificacoesComoLidas(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>("/api/notificacoes/lidas", {
      method: "PUT",
    })
  }

  async excluirNotificacao(id: number): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/api/notificacoes/${id}`, {
      method: "DELETE",
    })
  }

  private useMockData(endpoint: string): boolean {
    // Forçar o uso da API real, independente das variáveis de ambiente
    console.log("Forçando uso da API real para:", endpoint);
    return false; // Sempre retorna false para garantir o uso da API real
  }

  private getMockResponse<T>(endpoint: string, options: RequestInit): ApiResponse<T> {
    if (endpoint === "/api/auth/login" && options.method === "POST") {
      const body = JSON.parse(options.body as string) as LoginRequest
      
      if (body.email === "maria.rh@techsolutions.com" && body.senha === "123456") {
        return {
          data: {
            autenticado: true,
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            token_type: "Bearer",
            expires_in: 3600,
            usuario: {
              cpf: 12345678901,
              nome: "Maria Silva",
              email: "maria.rh@techsolutions.com",
              tipo_usuario: "rh",
              flag_gestor: "N",
              UF: "SP",
              grupo_id: 1,
              grupo_nome: "Recursos Humanos",
              inicio_na_empresa: "2020-01-15",
              ativo: true,
              criado_em: "2023-06-01T10:00:00"
            }
          } as unknown as T
        }
      } 
      
      if (body.email === "joao.gestor@techsolutions.com" && body.senha === "123456") {
        return {
          data: {
            autenticado: true,
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            token_type: "Bearer",
            expires_in: 3600,
            usuario: {
              cpf: 23456789012,
              nome: "João Santos",
              email: "joao.gestor@techsolutions.com",
              tipo_usuario: "gestor",
              flag_gestor: "S",
              UF: "SP",
              grupo_id: 2,
              grupo_nome: "Desenvolvimento",
              inicio_na_empresa: "2021-03-10",
              ativo: true,
              criado_em: "2023-06-01T10:00:00"
            }
          } as unknown as T
        }
      }
      
      if (body.email === "ana.dev@techsolutions.com" && body.senha === "123456") {
        return {
          data: {
            autenticado: true,
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            token_type: "Bearer",
            expires_in: 3600,
            usuario: {
              cpf: 34567890123,
              nome: "Ana Costa",
              email: "ana.dev@techsolutions.com",
              tipo_usuario: "comum",
              flag_gestor: "N",
              UF: "SP",
              grupo_id: 2,
              grupo_nome: "Desenvolvimento",
              inicio_na_empresa: "2022-05-20",
              ativo: true,
              criado_em: "2023-06-01T10:00:00"
            }
          } as unknown as T
        }
      }
      
      return {
        error: "Credenciais inválidas"
      }
    }
    
    if (endpoint === "/api/auth/me") {
      return {
        data: {
          usuario: {
            cpf: 12345678901,
            nome: "Maria Silva",
            email: "maria.rh@techsolutions.com",
            tipo_usuario: "rh",
            flag_gestor: "N",
            UF: "SP",
            grupo_id: 1,
            grupo_nome: "Recursos Humanos",
            inicio_na_empresa: "2020-01-15",
            ativo: true,
            criado_em: "2023-06-01T10:00:00"
          }
        } as unknown as T
      }
    }
    
    if (endpoint === "/api/empresas") {
      return {
        data: [
          {
            cnpj: 12345678000190,
            id: 1,
            nome: "Tech Solutions LTDA",
            endereco: "Rua das Flores, 123 - São Paulo/SP",
            telefone: "(11) 1234-5678",
            email: "contato@techsolutions.com",
            ativa: true,
            criado_em: "2023-06-01",
            total_grupos: 3
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/grupos") {
      return {
        data: [
          {
            id: 1,
            nome: "Recursos Humanos",
            descricao: "Equipe de recursos humanos",
            cnpj_empresa: 12345678000190,
            empresa_nome: "Tech Solutions LTDA",
            telefone: "(11) 1234-5679",
            ativo: true,
            criado_em: "2023-06-01",
            total_usuarios: 1
          },
          {
            id: 2,
            nome: "Desenvolvimento",
            descricao: "Equipe de desenvolvimento de software",
            cnpj_empresa: 12345678000190,
            empresa_nome: "Tech Solutions LTDA",
            telefone: "(11) 1234-5680",
            ativo: true,
            criado_em: "2023-06-01",
            total_usuarios: 3
          },
          {
            id: 3,
            nome: "Suporte",
            descricao: "Equipe de suporte técnico",
            cnpj_empresa: 12345678000190,
            empresa_nome: "Tech Solutions LTDA",
            telefone: "(11) 1234-5682",
            ativo: true,
            criado_em: "2023-06-01",
            total_usuarios: 2
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/usuarios") {
      return {
        data: [
          {
            cpf: 12345678901,
            nome: "Maria Silva",
            email: "maria.rh@techsolutions.com",
            tipo_usuario: "rh",
            grupo_id: 1,
            grupo_nome: "Recursos Humanos",
            inicio_na_empresa: "2020-01-15",
            ativo: true,
            criado_em: "2023-06-01",
            UF: "SP",
            flag_gestor: "N"
          },
          {
            cpf: 23456789012,
            nome: "João Santos",
            email: "joao.gestor@techsolutions.com",
            tipo_usuario: "gestor",
            grupo_id: 2,
            grupo_nome: "Desenvolvimento",
            inicio_na_empresa: "2021-03-10",
            ativo: true,
            criado_em: "2023-06-01",
            UF: "SP",
            flag_gestor: "S"
          },
          {
            cpf: 34567890123,
            nome: "Ana Costa",
            email: "ana.dev@techsolutions.com",
            tipo_usuario: "comum",
            grupo_id: 2,
            grupo_nome: "Desenvolvimento",
            inicio_na_empresa: "2022-05-20",
            ativo: true,
            criado_em: "2023-06-01",
            UF: "SP",
            flag_gestor: "N"
          },
          {
            cpf: 45678901234,
            nome: "Pedro Souza",
            email: "pedro.suporte@techsolutions.com",
            tipo_usuario: "comum",
            grupo_id: 3,
            grupo_nome: "Suporte",
            inicio_na_empresa: "2023-01-10",
            ativo: true,
            criado_em: "2023-06-01",
            UF: "RJ",
            flag_gestor: "N"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/eventos") {
      return {
        data: [
          {
            id: 1,
            cpf_usuario: 34567890123,
            usuario_nome: "Ana Costa",
            data_inicio: "2024-02-15",
            data_fim: "2024-02-19",
            total_dias: 5,
            id_tipo_ausencia: 1,
            tipo_ausencia_desc: "Férias",
            status: "aprovado",
            aprovado_por: 23456789012,
            aprovado_por_nome: "João Santos",
            criado_em: "2023-06-01T10:00:00",
            UF: "SP"
          },
          {
            id: 2,
            cpf_usuario: 45678901234,
            usuario_nome: "Pedro Souza",
            data_inicio: "2024-03-10",
            data_fim: "2024-03-15",
            total_dias: 6,
            id_tipo_ausencia: 1,
            tipo_ausencia_desc: "Férias",
            status: "pendente",
            criado_em: "2023-06-01T11:30:00",
            UF: "RJ"
          },
          {
            id: 3,
            cpf_usuario: 23456789012,
            usuario_nome: "João Santos",
            data_inicio: "2024-04-05",
            data_fim: "2024-04-05",
            total_dias: 1,
            id_tipo_ausencia: 2,
            tipo_ausencia_desc: "Assiduidade",
            status: "aprovado",
            aprovado_por: 12345678901,
            aprovado_por_nome: "Maria Silva",
            criado_em: "2023-06-01T14:20:00",
            UF: "SP"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/tipos-ausencia") {
      return {
        data: [
          {
            id_tipo_ausencia: 1,
            descricao_ausencia: "Férias",
            usa_turno: false
          },
          {
            id_tipo_ausencia: 2,
            descricao_ausencia: "Assiduidade",
            usa_turno: false
          },
          {
            id_tipo_ausencia: 3,
            descricao_ausencia: "Plantão",
            usa_turno: true
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/turnos") {
      return {
        data: [
          {
            id: 1,
            descricao_ausencia: "Dia"
          },
          {
            id: 2,
            descricao_ausencia: "Noite"
          },
          {
            id: 3,
            descricao_ausencia: "Madrugada"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/ufs") {
      return {
        data: [
          {
            cod_uf: 11,
            uf: "SP"
          },
          {
            cod_uf: 21,
            uf: "RJ"
          },
          {
            cod_uf: 31,
            uf: "MG"
          },
          {
            cod_uf: 41,
            uf: "RS"
          },
          {
            cod_uf: 51,
            uf: "GO"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/feriados/nacionais") {
      return {
        data: [
          {
            data_feriado: "2024-01-01",
            uf: "SP",
            descricao_feriado: "Confraternização Universal"
          },
          {
            data_feriado: "2024-04-21",
            uf: "SP",
            descricao_feriado: "Tiradentes"
          },
          {
            data_feriado: "2024-05-01",
            uf: "SP",
            descricao_feriado: "Dia do Trabalho"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/feriados/estaduais") {
      return {
        data: [
          {
            data_feriado: "2024-01-25",
            uf: "SP",
            descricao_feriado: "Aniversário de São Paulo"
          },
          {
            data_feriado: "2024-07-09",
            uf: "SP",
            descricao_feriado: "Revolução Constitucionalista"
          }
        ] as unknown as T
      }
    }
    
    if (endpoint === "/api/calendario") {
      return {
        data: [
          {
            id: 1,
            title: "Ana Costa - Férias",
            start: "2024-02-15",
            end: "2024-02-19",
            color: "#4CAF50",
            extendedProps: {
              cpf_usuario: 34567890123,
              usuario_nome: "Ana Costa",
              tipo_ausencia: "Férias",
              status: "aprovado",
              total_dias: 5,
              uf: "SP"
            }
          },
          {
            id: 2,
            title: "Pedro Souza - Férias (Pendente)",
            start: "2024-03-10",
            end: "2024-03-15",
            color: "#FF9800",
            extendedProps: {
              cpf_usuario: 45678901234,
              usuario_nome: "Pedro Souza",
              tipo_ausencia: "Férias",
              status: "pendente",
              total_dias: 6,
              uf: "RJ"
            }
          },
          {
            id: 3,
            title: "João Santos - Assiduidade",
            start: "2024-04-05",
            end: "2024-04-05",
            color: "#2196F3",
            extendedProps: {
              cpf_usuario: 23456789012,
              usuario_nome: "João Santos",
              tipo_ausencia: "Assiduidade",
              status: "aprovado",
              total_dias: 1,
              uf: "SP"
            }
          }
        ] as unknown as T
      }
    }
    
    if (endpoint.startsWith("/api/calendario/grupo/")) {
      const id = parseInt(endpoint.split("/").pop()?.split("?")[0] || "0")
      
      return {
        data: {
          grupo: {
            id: id,
            nome: id === 1 ? "Recursos Humanos" : id === 2 ? "Desenvolvimento" : "Suporte",
            total_usuarios: id === 1 ? 1 : id === 2 ? 3 : 2
          },
          eventos: id === 2 ? [
            {
              id: 1,
              title: "Ana Costa - Férias",
              start: "2024-02-15",
              end: "2024-02-19",
              color: "#4CAF50",
              extendedProps: {
                cpf_usuario: 34567890123,
                usuario_nome: "Ana Costa",
                tipo_ausencia: "Férias",
                status: "aprovado",
                total_dias: 5,
                uf: "SP"
              }
            }
          ] : [] 
        } as unknown as T
      }
    }
    
    if (endpoint.startsWith("/api/ferias/disponivel/")) {
      const cpf = parseInt(endpoint.split("/").pop() || "0")
      
      return {
        data: {
          cpf: cpf.toString(),
          nome: cpf === 12345678901 ? "Maria Silva" : 
                cpf === 23456789012 ? "João Santos" : 
                cpf === 34567890123 ? "Ana Costa" : "Usuário Desconhecido",
          dias_disponiveis: 20,
          ultimo_periodo_aquisitivo_fim: "2024-12-31"
        } as unknown as T
      }
    }
    
    if (endpoint === "/api/validation/integrity-check") {
      return {
        data: {
          summary: {
            timestamp: "2023-06-01T10:00:00",
            total_errors: 0,
            total_warnings: 1,
            total_info: 8,
            statistics: {
              total_empresas: 1,
              total_grupos: 3,
              total_usuarios: 5,
              total_eventos: 3,
              total_ufs: 27
            }
          },
          errors: [],
          warnings: [
            {
              category: "EVENTOS_PENDENTES",
              message: "Existem 3 eventos pendentes de aprovação",
              details: {},
              severity: "WARNING"
            }
          ],
          info: [
            {
              category: "CPF_FORMAT",
              message: "Todos os CPFs no banco são válidos",
              details: {},
              severity: "INFO"
            }
          ],
          statistics: {
            total_empresas: 1,
            total_grupos: 3,
            total_usuarios: 5,
            total_eventos: 3,
            total_ufs: 27,
            usuarios_por_tipo: {
              rh: 1,
              gestor: 1,
              comum: 3
            },
            eventos_por_status: {
              pendente: 1,
              aprovado: 2,
              rejeitado: 0
            }
          }
        } as unknown as T
      }
    }

    if (endpoint === "/api/notificacoes") {
      return {
        data: [
          {
            id: 1,
            usuario_cpf: 12345678900,
            titulo: "Evento aprovado",
            mensagem: "Seu evento de férias foi aprovado pelo gestor",
            tipo: "success",
            lida: false,
            data_criacao: "2023-06-01T10:00:00",
            link: "/eventos/1"
          },
          {
            id: 2,
            usuario_cpf: 12345678900,
            titulo: "Novo evento pendente",
            mensagem: "Você tem um novo evento aguardando aprovação",
            tipo: "info",
            lida: false,
            data_criacao: "2023-06-02T14:30:00",
            link: "/aprovacoes"
          },
          {
            id: 3,
            usuario_cpf: 12345678900,
            titulo: "Evento rejeitado",
            mensagem: "Seu evento de folga foi rejeitado",
            tipo: "error",
            lida: true,
            data_criacao: "2023-05-28T09:15:00",
            link: "/eventos/3"
          }
        ] as any,
      }
    }

    if (endpoint.match(/\/api\/notificacoes\/\d+\/lida/) && options.method === "PUT") {
      return {
        data: { status: "success" } as any,
      }
    }

    if (endpoint === "/api/notificacoes/lidas" && options.method === "PUT") {
      return {
        data: { status: "success" } as any,
      }
    }

    if (endpoint.match(/\/api\/notificacoes\/\d+/) && options.method === "DELETE") {
      return {
        data: { status: "success" } as any,
      }
    }

    return {
      error: "Endpoint não mockado ainda"
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
