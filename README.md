# To Off -  Sistema de Gestão de Eventos Corporativos

## Como executar o projeto

### Pré-requisitos
- Node.js (versão 18 ou superior)
- npm, yarn ou pnpm

### Passos para execução

1. **Clone o repositório**
   ```bash
   git clone [URL-DO-REPOSITORIO]
   cd to-off-funcional
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   # Copie o arquivo de exemplo
   cp .env.local.example .env.local
   
   # Edite o arquivo .env.local com as configurações corretas
   # NEXT_PUBLIC_API_URL=http://seu-servidor-api:5000
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

5. **Acesse a aplicação**
   Abra seu navegador e acesse `http://localhost:3000`

## API Backend

O frontend se comunica com uma API Flask. Por padrão, a aplicação espera que a API esteja rodando em:
```
http://127.0.0.1:5000
```

### Configuração da API

Para conectar à API real:

1. Crie um arquivo `.env.local` na raiz do projeto (você pode copiar o arquivo `.env.local.example`)
2. Defina a URL da API:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
   ```
3. Para usar a API real mesmo em ambiente de desenvolvimento:
   ```
   USE_REAL_API=true
   ```

Durante o desenvolvimento, se a API não estiver disponível e `USE_REAL_API` não estiver definido como `true`, o sistema utilizará dados mockados para testes.

### Proxy e CORS

O projeto está configurado com:

1. **Proxy reverso**: Em produção, todas as requisições para `/api/*` são redirecionadas para a API Flask, evitando problemas de CORS.
   - Configurado em `next.config.mjs` através da função `rewrites()`
   - Em produção, a API é acessada através de caminhos relativos
   - Em desenvolvimento, a API é acessada diretamente pela URL configurada

2. **Headers CORS**: Configurados para permitir requisições de diferentes origens
   - Configurados em `next.config.mjs` através da função `headers()`
   - Incluem todos os headers necessários para autenticação e métodos HTTP

Para modificar estas configurações, edite o arquivo `next.config.mjs`.

## Histórico de Desenvolvimento

### Fase Inicial - Conexão com API Flask
- Criação de interfaces e tipos no arquivo `lib/api.ts` para todos os endpoints da API
- Implementação dos métodos para comunicação com a API Flask
- Adição de dados mockados para desenvolvimento sem a necessidade da API real
- Implementação de funções utilitárias para formatação de CPF/CNPJ e datas no arquivo `lib/utils.ts`

### Desenvolvimento das Páginas
- Criação das páginas de eventos, calendário, grupos e usuários
- Implementação de sistema de autenticação e permissões baseado nos tipos de usuário (RH, Gestor, Comum)
- Desenvolvimento de interfaces para interação com a API

### Correções de Layout
- Ajustes no `AppLayout` para usar flex e overflow-hidden
- Correção do posicionamento do sidebar
- Adição de sticky ao header
- Alteração da cor de fundo para #e3d0cf
- Ajustes no posicionamento do conteúdo principal para ficar rente ao sidebar
- Remoção de espaçamentos desnecessários

### Implementação de Relatórios
- Criação da seção de relatórios com páginas específicas para diferentes tipos de relatórios
- Implementação de relatório de integridade com dashboard, visão detalhada e relatório bruto
- Implementação de relatório de férias com visualização de dias disponíveis por colaborador
- Implementação de relatório de eventos com filtros por status
- Adição de funcionalidades de exportação de dados e filtros de busca

### Implementação do Sistema de Notificações
- Criação de interface `Notificacao` e métodos de API para gerenciar notificações
- Desenvolvimento do contexto `NotificationContext` para gerenciar o estado das notificações
- Implementação do componente `NotificationDropdown` para exibição de notificações no header
- Criação da página `/notificacoes` para visualização e gerenciamento de todas as notificações
- Adição de funcionalidades como marcar como lida, excluir e filtrar notificações
- Integração com o sistema de navegação e layout principal da aplicação

## Estrutura do Projeto

### Principais diretórios
- `/app`: Páginas da aplicação (Next.js App Router)
  - `/calendario`: Visualização de calendário de eventos
  - `/dashboard`: Página inicial com visão geral
  - `/eventos`: Gerenciamento de eventos/ausências
  - `/grupos`: Gerenciamento de grupos
  - `/login`: Tela de autenticação
  - `/notificacoes`: Gerenciamento de notificações
  - `/relatorios`: Relatórios do sistema
  - `/usuarios`: Gerenciamento de usuários
- `/components`: Componentes reutilizáveis
  - `/auth`: Componentes relacionados à autenticação
  - `/layout`: Componentes de layout (header, sidebar, notification-dropdown)
  - `/ui`: Componentes de interface do usuário (shadcn/ui)
- `/contexts`: Contextos React
  - `auth-context.tsx`: Gerenciamento de autenticação e sessão
  - `notification-context.tsx`: Gerenciamento de notificações
- `/hooks`: Hooks personalizados
  - `use-mobile.tsx`: Detecção de dispositivos móveis
  - `use-sidebar.tsx`: Controle do estado do sidebar
  - `use-toast.ts`: Notificações toast
- `/lib`: Utilitários e serviços
  - `api.ts`: Cliente de API e interfaces de dados
  - `utils.ts`: Funções utilitárias (formatação, cálculos, etc.)
- `/public`: Arquivos estáticos (imagens, etc.)
- `/types`: Definições de tipos TypeScript
  - `navigation.ts`: Tipos para configuração de navegação

## Sistema de Autenticação

O sistema utiliza autenticação baseada em token JWT com refresh token, implementado no `auth-context.tsx`. O fluxo inclui:

1. **Login**: Obtém tokens (access e refresh) e dados do usuário
2. **Armazenamento local**: Tokens e dados são armazenados no localStorage
3. **Refresh automático**: Renovação de tokens expirados
4. **Verificação de sessão**: Validação de autenticação em rotas protegidas

Os níveis de acesso são:
- **RH**: Acesso total ao sistema, pode gerenciar usuários, grupos e aprovar eventos
- **Gestor**: Pode aprovar eventos de seus subordinados
- **Comum**: Pode criar e visualizar seus próprios eventos

## Sistema de Notificações

O sistema de notificações permite manter os usuários informados sobre eventos importantes:

### Funcionalidades
- **Notificações em tempo real**: Exibição de notificações no header com contador de não lidas
- **Tipos de notificações**: Suporte para diferentes tipos (info, warning, error, success) com ícones distintos
- **Ações rápidas**: Marcar como lida, excluir, navegar para links relacionados
- **Página dedicada**: Visualização completa de todas as notificações com filtros e busca
- **Atualização automática**: Verificação periódica de novas notificações a cada 2 minutos

### Componentes principais
- `notification-context.tsx`: Contexto React para gerenciar o estado das notificações
- `notification-dropdown.tsx`: Dropdown no header para visualização rápida de notificações
- `app/notificacoes/page.tsx`: Página completa para gerenciamento de notificações

### Integração com API
- `getNotificacoes()`: Busca todas as notificações do usuário
- `marcarNotificacaoComoLida(id)`: Marca uma notificação específica como lida
- `marcarTodasNotificacoesComoLidas()`: Marca todas as notificações como lidas
- `excluirNotificacao(id)`: Remove uma notificação do sistema

## Layout do Sistema

O sistema utiliza um layout responsivo com:

- **Sidebar**: Navegação principal, ajustável para desktop e móvel
  - Sempre visível em telas grandes
  - Recolhível em dispositivos móveis
  - Exibe informações do usuário e menu de navegação

- **Header**: Cabeçalho com:
  - Botão para recolher sidebar (em dispositivos móveis)
  - Campo de busca
  - Notificações com indicador de não lidas
  - Menu do usuário logado com opções de perfil e logout

- **Conteúdo principal**: Adaptável ao tamanho da tela com:
  - Área de conteúdo com scroll independente
  - Posicionamento adequado respeitando header e sidebar
  - Fundo com cor personalizada (#e3d0cf)

## Funcionalidades Principais

1. **Gestão de Usuários**: Cadastro, edição e exclusão de usuários
   - CPF como identificador único
   - Diferentes níveis de acesso

2. **Gestão de Grupos**: Organização de usuários em grupos
   - Associação de usuários a grupos
   - Visualização de membros por grupo

3. **Gestão de Eventos**: Registro e aprovação de ausências
   - Férias, folgas e outros tipos de ausência
   - Sistema de aprovação por gestores/RH
   - Fluxo de aprovação baseado em hierarquia

4. **Calendário**: Visualização de eventos programados
   - Visualização mensal/semanal
   - Filtros por tipo de evento e status

5. **Notificações**: Sistema de alertas e informações
   - Notificações em tempo real
   - Diferentes tipos e níveis de prioridade
   - Ações rápidas e página de gerenciamento

6. **Relatórios**: Geração de relatórios diversos
   - Relatório de integridade de dados
   - Relatório de férias disponíveis
   - Relatório de eventos por status

## Utilitários

O sistema inclui diversos utilitários implementados em `lib/utils.ts`:
- Formatação de CPF/CNPJ: `formatCPF()`, `formatCNPJ()`
- Formatação de datas: `formatDate()`
- Cálculo de dias entre datas: `calcDaysBetween()`
- Definição de cores para eventos: `getEventColor()`
- Verificação de permissões: `hasPermission()` 
