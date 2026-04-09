@AGENTS.md

# Product Page Builder — Design & Development Guide

## 프로젝트 개요
ANUA/PEPTOIR 수준의 한국 프리미엄 e-commerce 상세페이지를 AI로 자동 생성하는 780px 이미지 시퀀스 에디터.
스마트스토어/쿠팡에 바로 업로드 가능한 PNG 이미지 시퀀스를 출력한다.

## 핵심 기술 스택
- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript, Tailwind CSS 4, Zustand
- react-rnd (드래그/리사이즈), html-to-image + JSZip (내보내기)
- AI: Gemini 2.5 Flash (콘텐츠 JSON), gpt-image-1/DALL-E 3 (이미지)
- 로컬 저장: IndexedDB (Supabase 미설정 시 자동 폴백)

## 디자인 원칙 (매우 중요 — 반드시 준수)

### 1. 780px 이미지 시퀀스 규격
- 모든 섹션은 너비 780px 고정
- 각 섹션은 독립된 이미지로 내보내짐
- 배경색/이미지 + 엘리먼트(텍스트/이미지/도형)로 구성

### 2. 레이아웃 철칙
- **텍스트와 이미지는 절대 겹치지 않는다** (shape 배경 위 텍스트는 예외)
- 좌우 배치 시: 좌 x:40~380, 우 x:420~740 (20px 간격)
- 풀폭 텍스트: x:40, width:700
- 가운데 이미지: x = (780 - width) / 2
- 엘리먼트 간 최소 20px 수직 여백

### 3. 타이포그래피 체계
| 용도 | 크기 | 굵기 | 폰트 |
|------|------|------|------|
| 영문 라벨 | 11-13px | 400 | Playfair Display |
| 히어로 제목 | 38-44px | 300 | Noto Sans KR |
| 섹션 제목 | 28-34px | 600 | Noto Sans KR |
| 소제목 | 18-22px | 600 | Noto Sans KR |
| 본문 | 14-16px | 400 | Noto Sans KR |
| 캡션/출처 | 11-12px | 400 | Noto Sans KR |

### 4. 색상 팔레트 (무드별)
- **premium**: bg #0A0A0A, text #F5F0E8, accent #C9A96E
- **clean**: bg #FFFFFF, text #1A1A1A, accent #3B82F6
- **natural**: bg #FAF7F2, text #3D2B1F, accent #6B8E5A
- **impact**: bg #0D0D0D, text #FFFFFF, accent #FF4444

### 5. 이미지 규칙
- AI 이미지 borderRadius: 최대 30px
- 배경 이미지는 texture/banner/cta 섹션만 사용
- 나머지 섹션에서 이미지는 엘리먼트로 배치 (배경 X)
- 이미지 톤: 밝고 따뜻한 한국 뷰티 화보 톤 (PEPTOIR/ANUA 수준)
- 이미지 생성 시 제품 사진 분석 → 색감 매칭 필수

### 6. 섹션 구조 (11개)
1. **hero** (1100px) — 브랜드 라벨 + 제목 + 서브카피 + 제품 이미지
2. **philosophy** (600px) — 인용구 + 브랜드 설명
3. **benefits** (1300px) — 장점 3개 좌우 교차 레이아웃
4. **ingredients** (1100px) — 성분 3개 카드 (이미지+텍스트 좌우 교차)
5. **texture** (900px) — 풀폭 배경 이미지 + 텍스처 설명
6. **proof** (700px) — 수치 4개 그리드 + Before/After
7. **howto** (1000px) — 3단계 스텝 카드
8. **banner** (600px) — 어두운 배경 + 감성 카피
9. **reviews** (900px) — 리뷰 카드 3개
10. **specs** (750px) — 제품 이미지 + 스펙 테이블
11. **cta** (500px) — 제품 이미지 + CTA 버튼

### 7. AI 콘텐츠 생성 규칙
- Gemini 2.5 Flash 1차 (JSON 모드, 32K) → Claude Sonnet 폴백 (16K)
- 11개 섹션 전체 생성, 섹션당 5~12개 elements
- 카피: 한국어 위주 + 영문 UPPERCASE 라벨
- 카피 톤: 상위 1% 매출 상세페이지 수준

### 8. AI 이미지 생성 규칙
- Gemini Vision으로 제품 사진 분석 → 색감/형태 추출
- 섹션 텍스트 컨텍스트 → Gemini가 맞춤 프롬프트 작성
- gpt-image-1 (quality: high) 1차 → DALL-E 3 HD 폴백
- 톤: 밝고 따뜻함, 배경 항상 밝은 베이지/크림/화이트
- 카메라 스펙 명시 (Canon R5, Sony A7RV 등)

### 9. 레퍼런스 브랜드
- ANUA (https://anua.kr) — 자연주의, 어성초 라인
- PEPTOIR — 펩타이드 세럼, 골든 톤
- 라운드랩 — 클린 미니멀
- 이니스프리 — 내추럴 보태니컬
- 설화수 — 프리미엄 한방

## 개발 규칙

### react-rnd 주의사항
- transform 직접 조작 금지 (이벤트 바인딩 깨짐)
- pointer-events-none 사용 금지 (클릭 선택 불가)
- z-index는 style prop으로만 전달
- 레이어 순서: elements 배열 순서 = z-index (뒤가 위)

### 파일 구조
- 섹션 템플릿: src/lib/sections.ts
- AI 프롬프트: src/lib/ai/prompts.ts
- 이미지 생성: src/app/api/generate-image/route.ts
- 에디터 캔버스: src/components/editor/CanvasElement.tsx
- 프로젝트 저장: src/lib/supabase/projects.ts + src/lib/local-db.ts

### 배포
- Railway (main 브랜치 자동 배포)
- .gitignore: dist-electron/, cloudflared.exe, .next/
