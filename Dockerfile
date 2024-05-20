FROM ghcr.io/puppeteer/puppeteer:22.8.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

USER root

COPY package*.json ./
RUN npm install
COPY . .
COPY data.json /usr/src/app/data.json
RUN chmod 644 /usr/src/app/data.json
CMD ["node", "index.js"]
