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

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY package*.json ./

RUN pnpm install

COPY . .

RUN apt-get update && apt-get install -y \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

CMD ["node", "index.js"]