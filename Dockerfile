FROM node:18

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install

COPY . .


USER root

EXPOSE 3000

CMD ["node", "index.js"]