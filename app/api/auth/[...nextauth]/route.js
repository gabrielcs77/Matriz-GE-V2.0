import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          prompt: "select_account"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback - User:', user.email);
      const allowedEmails = [
"gabriel.costa@sistemafiea.com.br",
"leandro.lima@sistemafiea.com.br",
"maryane.oliveira@sistemafiea.com.br",
"scharon.schafhauser@sistemafiea.com.br",
"clarisse.araujo@sistemafiea.com.br",
"thiago.almeida@al.senai.br",
"weverton.silva@al.senai.br",
"ygor.oliveira@al.senai.br",
"gustavo.ferreira@al.senai.br",
"fernando.oliveira@al.senai.br",
"andrea.fernandes@al.senai.br",
"carolina.melo@al.senai.br"
];
      const isAllowed = allowedEmails.includes(user.email);
      console.log('User is allowed:', isAllowed);
      
      if (!isAllowed) {
        throw new Error('Unauthorized email');
      }
      
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url, 'BaseURL:', baseUrl);
      // Se a URL for relativa (começar com /), adicione o baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Se a URL já for do mesmo domínio, retorne-a
      else if (url.startsWith(baseUrl)) {
        return url;
      }
      // Caso contrário, redirecione para a página inicial
      return baseUrl;
    },
    async session({ session, token }) {
      console.log('Session callback - Session:', session);
      if (token) {
        session.user.accessToken = token.accessToken;
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      console.log('JWT callback - Token:', token);
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
      }
      if (profile) {
        token.profile = profile;
      }
      return token;
    }
  },
  events: {
    async signIn(message) {
      console.log('User signed in:', message);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    },
    async error(message) {
      console.error('Auth error:', message);
    }
  }
})

export { handler as GET, handler as POST };
