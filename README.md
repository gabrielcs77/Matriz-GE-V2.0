# Matriz GE - Sistema FIEA

## Sobre o Projeto

Aplicação web para visualização e análise da Matriz GE (General Electric/McKinsey), desenvolvida para o Sistema FIEA.

## Requisitos

- Node.js 18.x ou superior
- npm 9.x ou superior
- Conta Microsoft Azure AD (para autenticação)

## Configuração

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd matriz-ge
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
- Copie o arquivo `.env.example` para `.env.local`
- Preencha as variáveis com suas credenciais do Azure AD

4. Configure o Azure AD:
- Registre um novo aplicativo no [Portal do Azure](https://portal.azure.com)
- Configure as URIs de redirecionamento
- Adicione as permissões necessárias
- Copie as credenciais para o arquivo .env.local

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

## Autenticação

A aplicação utiliza autenticação Microsoft Azure AD com as seguintes características:
- Login com conta Microsoft
- Restrição de acesso por email
- Proteção de rotas
- Sessão persistente

## Build e Produção

Para criar uma build de produção:
```bash
npm run build
```

Para iniciar o servidor de produção:
```bash
npm start
```

## Estrutura do Projeto

```
matriz-ge/
├── app/                    # Código fonte da aplicação
│   ├── api/               # Endpoints da API
│   ├── login/            # Página de login
│   └── ...               # Outros componentes e páginas
├── public/               # Arquivos estáticos
└── ...
```

## Tecnologias Utilizadas

- Next.js 14
- React 19
- NextAuth.js
- Azure AD
- MSAL (Microsoft Authentication Library)

## Licença

Propriedade do Sistema FIEA - Todos os direitos reservados
