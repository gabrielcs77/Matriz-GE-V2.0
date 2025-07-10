/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilita o uso de imagens de domínios externos (necessário para o Azure AD)
  images: {
    domains: ['graph.microsoft.com'],
  },
  // Configurações de segurança recomendadas
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
