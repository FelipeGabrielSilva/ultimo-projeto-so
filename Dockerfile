# Imagem base oficial do Node.js (versão LTS leve em Alpine Linux)
FROM node:20-alpine

# Definir diretório de trabalho no container
WORKDIR /app

# Instalar dependências necessárias do sistema (se houver)
RUN apk --no-cache add curl

# Copiar arquivos de definição de dependências
COPY package*.json ./

# Instalar apenas dependências de produção para otimizar tamanho da imagem
RUN npm ci --omit=dev

# Copiar código-fonte da aplicação
COPY . .

# Usar usuário não-root por segurança
USER node

# Expor a porta padrão da aplicação
EXPOSE 3000

# Comando para inicializar o servidor
CMD ["node", "src/server.js"]
