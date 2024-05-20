FROM ghcr.io/puppeteer/puppeteer:22.8.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

USER root

COPY package*.json ./
RUN chmod 644 ./data.json
RUN npm install
COPY . .
CMD ["node", "index.js"]
