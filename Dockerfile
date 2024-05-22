# FROM ghcr.io/puppeteer/puppeteer:22.8.0

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#   PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# WORKDIR /usr/src/app

# USER root

# COPY package*.json ./
# RUN npm install
# COPY . .
# COPY data.json /usr/src/app/data.json
# RUN chmod 644 /usr/src/app/data.json
# CMD ["node", "index.js"]

FROM node:18

RUN apt-get update \
 && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends

RUN npm install -g pnpm

# USER node

WORKDIR /usr/src/app

COPY package*.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN pnpm install

COPY . .


USER root

EXPOSE 3000

CMD ["node", "index.js"]