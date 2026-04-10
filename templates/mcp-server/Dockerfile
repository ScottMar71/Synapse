FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./tsconfig.json
COPY src ./src

RUN npm run build

CMD ["node", "dist/index.js"]
