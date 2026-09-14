# MEL LILIAM

## 1. Sobre o Projeto MEL LILIAM e MVP

O **MEL LILIAM** é uma plataforma de e-commerce especializada na comercialização de mel e produtos apícolas artesanais. Este repositório contém o **MVP (Minimum Viable Product)** da aplicação, com foco em oferecer uma experiência de compra completa, simples e segura para os clientes, além de um painel administrativo robusto para a gestão dos produtos, pedidos e configurações da loja.

### Objetivos do MVP

- Disponibilizar catálogo de produtos com imagens e descrições
- Permitir a montagem de carrinho de compras e checkout completo
- Integração nativa com pagamento via PIX com geração de QR Code
- Acompanhamento de pedidos por número do pedido e telefone
- Painel administrativo para gestão completa da loja
- Design responsivo e experiência mobile-first

---

## 2. Tecnologias

| Categoria | Tecnologia | Descrição |
|-----------|------------|-----------|
| **Frontend** | React 19 + TypeScript | Interface do usuário com tipagem estática |
| **Build Tool** | Vite | Bundler e servidor de desenvolvimento ultrarrápido |
| **Estilização** | Tailwind CSS | Framework CSS utilitário para design responsivo |
| **Backend/BaaS** | Supabase | Banco PostgreSQL, autenticação, storage e RLS |
| **Deploy** | Vercel | Hospedagem e deploy contínuo da aplicação |
| **Pagamento** | PIX | Geração de QR Code e código Copia e Cola |
| **Contato** | WhatsApp | Integração para suporte e confirmação de pedidos |

### Dependências Principais

```json
{
  "@supabase/supabase-js": "^2.116.0",
  "react-router-dom": "^7.18.3",
  "lucide-react": "^1.45.0",
  "qrcode": "^1.5.4",
  "date-fns": "^4.4.0",
  "clsx": "^2.1.1"
}
```

---

## 3. Funcionalidades

### 🏠 Home
- Página inicial com banner, destaques e chamada para ação
- Exibição de produtos em destaque
- Links rápidos para categorias e informações da loja

### 🛍️ Produtos
- Catálogo completo de produtos com paginação/rolagem
- Ficha individual do produto com imagens, descrição, tamanho e preço
- Cálculo automático de descontos percentuais
- Indicação de produtos disponíveis/indisponíveis

### 🛒 Carrinho
- Adicionar/remover itens
- Alterar quantidade de cada produto
- Cálculo automático de subtotal, descontos e total
- Aplicação de cupons de desconto
- Persistência local do carrinho

### 💳 Checkout
- Formulário completo de dados do cliente (nome, telefone, email)
- Endereço completo com CEP, rua, número, bairro, cidade e estado
- Resumo do pedido com valores detalhados
- Validação de campos obrigatórios

### 💰 PIX
- Geração automática de QR Code para pagamento via PIX
- Código "Copia e Cola" para transferência manual
- Exibição do valor exato do pedido
- Campo para o cliente informar que o pagamento foi realizado
- Dados do recebedor configuráveis no painel admin

### 📦 Acompanhar Pedido
- Busca por número do pedido + telefone do cliente
- Exibição do status atual do pagamento e do pedido
- Histórico completo de alterações de status com datas
- Detalhamento dos itens comprados e valores

### ⚙️ Admin (Painel Administrativo)
- Dashboard com visão geral dos pedidos
- **Produtos**: CRUD completo com upload de múltiplas imagens
- **Pedidos**: Visualização detalhada e alteração de status
- **Cupons**: Criação e gerenciamento de cupons (percentual ou fixo)
- **Configurações**: Dados do PIX, frete e informações gerais
- **Conteúdo**: Edição de textos e conteúdos do site
- Login seguro autenticado via Supabase

---

## 4. Requisitos

- **Node.js** 18+ (recomendado 20.x LTS)
- **npm** ou **pnpm**
- Conta no [Supabase](https://supabase.com/) (gratuita disponível)
- Conta no [Vercel](https://vercel.com/) (gratuita disponível) — para deploy

---

## 5. Instalação Local Passo a Passo

### Passo 1: Clonar o repositório

```bash
git clone https://github.com/seu-usuario/melliliam.git
cd melliliam
```

### Passo 2: Instalar as dependências

```bash
npm install
```

### Passo 3: Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha as chaves com os dados do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Passo 4: Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

---

## 6. Configuração Supabase

### a) Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/) e crie uma conta ou faça login
2. Clique em **New Project**
3. Preencha nome, senha do banco e selecione a região mais próxima
4. Aguarde a criação (leva alguns minutos)

### b) Executar Migrations no SQL Editor

No painel do Supabase, acesse **SQL Editor → New Query** e execute os arquivos da pasta `supabase/migrations/` **na ordem**:

1. **001_init_tables.sql** — Cria todas as tabelas e índices
2. **002_rls.sql** — Habilita RLS e cria políticas de segurança
3. **003_seed.sql** — Insere dados iniciais (se houver)
4. **004_functions.sql** — Funções e triggers auxiliares

Exemplo de execução no SQL Editor:

```sql
-- Cole o conteúdo completo de 001_init_tables.sql e execute
-- Depois cole 002_rls.sql e execute
-- Depois 003_seed.sql
-- E finalmente 004_functions.sql
```

### c) Criar Bucket de Storage

1. No painel Supabase, acesse **Storage → Create new bucket**
2. Nome: `product_images`
3. Marque a opção **Public bucket** (público)
4. Clique em **Create bucket**

### d) Criar Usuário Admin

1. Acesse **Authentication → Add user**
2. Preencha email e senha do administrador
3. Clique em **Create user**
4. Copie o **UUID** do usuário criado (coluna `USER UID`)

### e) Adicionar Perfil de Admin via SQL

Volte ao **SQL Editor** e execute, substituindo `'UUID_DO_USUARIO'` pelo UUID copiado no passo anterior:

```sql
INSERT INTO admin_profiles (auth_user_id, name, role)
VALUES ('UUID_DO_USUARIO', 'Administrador', 'admin');
```

---

## 7. Variáveis de Ambiente Vercel

No painel do Vercel, em **Project Settings → Environment Variables**, adicione:

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (Project Settings → API → Project URL) |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima pública (Project Settings → API → Project API keys → anon public) |

> ⚠️ **Importante**: Nunca adicione a `service_role_key` nas variáveis do frontend. Ela deve ser usada apenas em ambientes seguros (backend/serverless).

---

## 8. Deploy Vercel

### Passo 1: Conectar o repositório

1. Faça login no [Vercel](https://vercel.com/)
2. Clique em **Add New → Project**
3. Importe o repositório GitHub/GitLab/Bitbucket do projeto

### Passo 2: Adicionar variáveis de ambiente

Na tela de configuração do deploy, na seção **Environment Variables**, adicione:

```
VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
```

### Passo 3: Deploy

Clique em **Deploy** e aguarde a conclusão. O Vercel irá:
- Instalar dependências automaticamente (`npm install`)
- Rodar o build (`npm run build`)
- Publicar a aplicação em um domínio `.vercel.app`

---

## 9. Configuração PIX

Após o primeiro login no painel administrativo:

1. Acesse `https://seu-dominio.com/admin/configuracoes`
2. Na seção **Dados do PIX**, preencha:
   - **Chave PIX**: CPF, CNPJ, email, telefone ou chave aleatória
   - **Nome do Recebedor**: Nome completo do titular da conta
   - **Cidade**: Cidade do titular (ex: `SAO PAULO`) — sem acentos, em letras maiúsculas
3. Clique em **Salvar**

> Os dados são usados para gerar o QR Code e o código Copia e Cola de forma 100% client-side (sem dependência de terceiros).

---

## 10. Uso do Painel Administrativo

### Login

Acesse `/admin/login` e entre com o email e senha criados no passo **6d**.

### Funcionalidades do Admin

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral com quantidade de pedidos por status |
| **Produtos** | Listar, criar, editar e excluir produtos com upload de imagens |
| **Pedidos** | Visualizar todos os pedidos, detalhes e alterar status |
| **Cupons** | Criar cupons percentuais ou de valor fixo, com data de expiração |
| **Configurações** | Dados do PIX, valores de frete e configurações gerais |
| **Conteúdo** | Editar textos e conteúdos das páginas do site |

### CRUD de Produtos

1. Vá em **Produtos → Novo Produto**
2. Preencha nome, slug (gerado automaticamente), descrição, tamanho, preço, desconto %
3. Faça upload de uma ou mais imagens (armazenadas no Storage `product_images`)
4. Defina a ordem de exibição e se está disponível
5. Salve

### Gerenciar Pedidos

1. Acesse **Pedidos**
2. Clique em um pedido para ver detalhes completos
3. Altere o status conforme o andamento:
   - `awaiting_payment` → Aguardando pagamento
   - `payment_informed` → Cliente informou pagamento
   - `payment_confirmed` → Pagamento confirmado manualmente
   - `preparing` → Em preparação
   - `shipped` → Enviado
   - `delivered` → Entregue
   - `cancelled` → Cancelado

---

## 11. Segurança

### RLS (Row Level Security) Habilitado

Todas as tabelas públicas possuem **Row Level Security** ativado com políticas específicas:

- **Produtos, imagens e configurações**: Leitura pública, escrita apenas por admins
- **Cupons**: Leitura por código (aplicação), gestão por admins
- **Pedidos**: Clientes visualizam apenas seus próprios pedidos (order_number + phone), admins veem todos
- **Perfis de admin**: Acesso restrito apenas a admins autenticados

### Preços Recalculados no Servidor

O valor final do pedido é recalculado via função SQL no banco de dados, evitando manipulação no frontend:
- Snapshot do nome e preço unitário dos produtos no momento da compra
- Descontos e cupons validados no backend
- Totais calculados e persistidos com segurança

### Snapshots de Pedido

A tabela `order_items` armazena cópias (`snapshot`) dos dados do produto:
- `product_name_snapshot`
- `unit_price_snapshot`
- `discount_percent_snapshot`

Isso garante que alterações futuras em preços ou nomes não afetem pedidos já realizados.

### Service Role Não Exposto

A chave `service_role` do Supabase **nunca** é utilizada no frontend. Todas as operações seguem as regras do RLS através da chave anônima pública.

---

## 12. Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento em `http://localhost:5173` com HMR |
| `npm run build` | Compila TypeScript e gera build de produção na pasta `dist/` |
| `npm run preview` | Sobe um servidor local para pré-visualizar o build de produção |

---

## 13. Observações Importantes

### Status MVP
Este é um produto em versão **MVP (Minimum Viable Product)**. Novas funcionalidades podem ser adicionadas em versões futuras (ex: integração com gateway de pagamento automático, emissão de nota fiscal, cálculo de frete por CEP, etc.).

### Confirmação PIX Manual
A confirmação de pagamento via PIX atualmente é **manual**:
1. Cliente escaneia o QR Code e realiza o pagamento
2. Cliente clica em "Já efetuei o pagamento" no site
3. Status vai para `payment_informed`
4. O administrador confirma manualmente o recebimento no extrato bancário e altera para `payment_confirmed`

Integrações com APIs de bancos ou PSPs podem ser adicionadas posteriormente para automatizar esse processo.

### Não Inventar Dados
- Nunca adicione dados de exemplo fictícios em produção
- Testes locais devem usar a conta de admin real criada no passo 6
- Produtos, pedidos e cupons devem ser cadastrados através do painel administrativo oficial

---

<div align="center">
  <strong>MEL LILIAM</strong> — MVP de E-commerce Apícola 🍯
</div>
