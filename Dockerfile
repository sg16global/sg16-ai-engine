# SG16 AI Engine — site + Postgres (Railway plugin) + sovereign Ollama brain in one container.
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates zstd \
  && curl -fsSL https://ollama.com/install.sh | sh \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY project/package.json project/package-lock.json ./project/
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci --prefix project \
  && npm ci --prefix backend --omit=dev

COPY . .

RUN npm run build

ENV NODE_ENV=production \
  SG16_BRAIN=ollama \
  OLLAMA_URL=http://127.0.0.1:11434 \
  OLLAMA_HOST=127.0.0.1:11434 \
  SG16_OLLAMA_MODEL=mistral:7b-instruct \
  HOST=0.0.0.0

EXPOSE 8000

RUN chmod +x scripts/start-railway.sh

CMD ["scripts/start-railway.sh"]
