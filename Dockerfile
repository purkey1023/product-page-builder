FROM node:20-slim

# Puppeteer용 Chrome 의존성 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 복사 & 빌드
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# next start로 실행 (standalone 대신 - 더 안정적)
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
