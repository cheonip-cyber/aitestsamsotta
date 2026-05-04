# AI 활용 진단앱 (SAM.SOTTA)

## 기술 스택
- **프론트엔드**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **백엔드**: Google Apps Script (GAS)
- **데이터베이스**: Google Sheets
- **배포**: Vercel (프론트) + GAS 웹앱 (API)

## 배포 순서

### 1. GAS 백엔드 설정
1. [Google Sheets](https://sheets.new) 새 시트 생성
2. 확장 프로그램 → Apps Script
3. `gas/Code.gs` 내용 전체 붙여넣기
4. 프로젝트 속성 → 스크립트 속성 → `ADMIN_PASSWORD` 추가 (원하는 비밀번호)
5. 배포 → 새 배포 → **웹 앱**
   - 설명: v1
   - 실행: **나**
   - 액세스: **모든 사용자**
6. 배포 URL 복사 (`https://script.google.com/macros/s/.../exec`)

### 2. Vercel 배포
1. 이 레포를 GitHub에 push
2. [Vercel](https://vercel.com) → 새 프로젝트 → 레포 연결
3. 환경변수 추가:
   - `VITE_GAS_URL` = GAS 배포 URL
4. 배포

### 3. 관리자 접속
- `/admin/login` 접속 → GAS 스크립트 속성에 설정한 비밀번호 입력

## 기능
- 캠페인(설문 링크) 생성/관리
- 설문 응답 수집 → Google Sheets 자동 저장
- 레벨 산출 알고리즘 (가중치 기반 1~4단계)
- 차트 시각화 (레벨 분포, AI 도구 사용률 등)
- **CSV + Excel 내보내기** (요약 시트 + 응답 원본 시트)
