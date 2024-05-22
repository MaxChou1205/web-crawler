FROM node:18

RUN apt-get update \
 && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends

RUN npm install -g pnpm

WORKDIR /usr/src/app

COPY package*.json ./
COPY pnpm-lock.yaml ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN pnpm install

COPY . .


USER root

EXPOSE 3000

CMD ["node", "index.js"]