# --- STAGE 1: Build ---
# Usamos a imagem 'iron-alpine' por ser baseada em Alpine Linux, extremamente leve e segura.
FROM node:iron-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Otimização de Cache: Copiamos apenas os arquivos de dependências primeiro.
# Isso garante que o Docker não precise reinstalar pacotes se o código mudar, mas o package.json não.
COPY package*.json ./

# Instalação de dependências (incluindo devDependencies para o build se necessário)
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Se houvesse um passo de compilação (ex: tsc), ele seria executado aqui.
# RUN npm run build

# Remove dependências de desenvolvimento para manter apenas o necessário para produção
RUN npm prune --production

# --- STAGE 2: Production ---
# Iniciamos uma nova camada limpa. O multi-stage reduz o tamanho final pois
# não inclui ferramentas de build, cache do npm ou arquivos fonte originais (se compilados).
FROM node:iron-alpine

# Segurança: Define variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Segurança: Copia apenas o essencial do estágio de build
# Isso evita que segredos ou arquivos temporários do build vazem para a imagem final.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Segurança: Não rodar como root. O usuário 'node' já existe na imagem oficial.
USER node

# Telemetria: Exposição da porta configurada
EXPOSE 3000

# Healthcheck simples para garantir que o processo está respondendo
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/ready || exit 1

# Comando de inicialização
CMD ["node", "server.js"]
