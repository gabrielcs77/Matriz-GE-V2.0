// app/layout.js

// Se você estiver usando MantineProvider aqui, ele precisará de "use client"
// Se não, e for só para metadata e estrutura HTML, não precisa de "use client"
// Vamos assumir que MantineProvider está aqui para um exemplo completo:
"use client"; // Necessário se MantineProvider está aqui

import { MantineProvider } from '@mantine/core';
import { SessionProvider } from 'next-auth/react';
import '@mantine/core/styles.css'; // Importar estilos globais do Mantine

// Exportar metadados do layout
// Esta exportação de metadata SÓ FUNCIONA se "use client" NÃO estiver neste arquivo.
// Se "use client" é necessário para MantineProvider, então o metadata estático
// deve vir de um componente pai que é Server Component, ou o título do HTML principal.
// Para simplificar, vamos focar em fazer o app rodar.
// O Next.js usará o <title> dentro do <head> se metadata não puder ser exportado daqui.

/*
// Forma correta de metadata se layout.js PUDESSE ser Server Component:
export const metadata = {
  title: 'Matriz GE App (Layout)',
  description: 'Aplicação da Matriz GE',
};
*/

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Se "use client" está ativo, você pode definir um título padrão aqui
            mas o ideal é que metadata venha de Server Components. */}
        <title>Matriz GE - Educação Profissional</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wght@8..144,100..1000&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body>
        <SessionProvider>
        <MantineProvider theme={{ colorScheme: 'light' }} withGlobalStyles withNormalizeCSS>
          {children}
        </MantineProvider>
        </SessionProvider>
      </body>
    </html>
  );
}