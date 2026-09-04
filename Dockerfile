# SG16 AI Engine — site + Postgres + cloud brain (api.mistralbrain.com) + shield CLIs
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    curl ca-certificates zstd git python3 python3-pip unzip lynis \
  && pip install --break-system-packages semgrep \
  && curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.24.2/gitleaks_8.24.2_linux_x64.tar.gz \
    | tar xz -C /usr/local/bin gitleaks \
  && chmod +x /usr/local/bin/gitleaks \
  && curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin \
  && curl -sSfL https://github.com/projectdiscovery/nuclei/releases/download/v3.3.5/nuclei_3.3.5_linux_amd64.zip -o /tmp/nuclei.zip \
  && unzip -o /tmp/nuclei.zip -d /usr/local/bin \
  && chmod +x /usr/local/bin/nuclei \
  && rm /tmp/nuclei.zip \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY project/package.json project/package-lock.json ./project/
COPY backend/package.json backend/package-lock.json ./backend/

RUN npm ci --include=dev \
  && npm ci --prefix project \
  && npm ci --prefix backend --omit=dev

COPY . .

RUN npm run build:docker

ENV NODE_ENV=production \
  NODE_PATH=/app/node_modules:/app/backend/node_modules \
  SG16_BRAIN=mistralbrain \
  SG16_SOVEREIGN_FALLBACK=0 \
  SG16_CHILDREN_ENABLED=1 \
  HOST=0.0.0.0

EXPOSE 8000

RUN chmod +x scripts/start-railway.sh

CMD ["scripts/start-railway.sh"]
