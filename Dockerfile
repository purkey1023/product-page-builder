FROM node:20-slim

# Puppeteer용 Chrome + 빌드 도구 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# 의존성 설치 (devDependencies 포함 - 빌드에 필요)
COPY package.json package-lock.json* ./
RUN npm ci

# 소스 복사 & 빌드
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 프로덕션 실행
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# standalone에 static 파일 복사
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
RUN cp -r public .next/standalone/public 2>/dev/null || true

CMD ["node", ".next/standalone/server.js"]
