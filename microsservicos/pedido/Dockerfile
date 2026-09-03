# Pegar imagem do remote
FROM node:20-alpine

# Crio um diretório app
WORKDIR /app

# Copiar o package json pro /app pra já ir baixando dependencia
COPY package*.json ./

# Baixa dependencia
RUN npm install

# Copia arquivos de projeto no container 
COPY . .

EXPOSE 3002

CMD ["npm", "start"]
