FROM node:20-slim

# Puppeteer용 Chrome 의존성 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer가 시스템 Chrome 사용하도록
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# 의존성 먼저 설치 (캐시 활용)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# 소스 복사 & 빌드
COPY . .
RUN npm run build

# standalone 서버 실행
ENV PORT=3000
EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]
