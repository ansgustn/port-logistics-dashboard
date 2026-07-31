# 🔑 카카오 맵 / 네이버 지도 / 구글 맵 API 키 연동 가이드

본 시스템은 **카카오 맵(Kakao Maps API)**, **네이버 지도(Naver Maps API)**, **구글 맵(Google Maps API)** 및 **MapTiler**를 모두 지원하도록 환경변수 구조가 설계되어 있습니다. 

아래 단계에 따라 API 키를 발급받아 프로젝트 `.env` 파일에 등록하시면 실제 국내 포털 지도를 곧바로 연동하여 사용하실 수 있습니다.

---

## 1. 🟡 카카오 맵 (Kakao Maps API) 발급 및 등록

### 📌 발급 절차
1. **[카카오 디벨로퍼스 콘솔](https://developers.kakao.com/)** 접속 및 로그인
2. `[내 애플리케이션]` -> `[애플리케이션 추가하기]` 클릭 (앱 이름: 스마트 항만 관제)
3. 생성된 앱 선택 -> `[앱 키]` 항목에서 **`JavaScript 키`** 복사
4. 좌측 메뉴 `[플랫폼]` -> `[Web 플랫폼 등록]` 클릭 후 허용 도메인 추가:
   - `http://localhost:5173` (PWA)
   - `http://localhost:8080` (관제 대시보드)

### ⚙️ `.env` 설정 (`frontend/.env` 및 `mobile-pwa/.env`)
```env
VITE_KAKAO_MAP_API_KEY=복사한_카카오_JavaScript_키
```

---

## 2. 🟢 네이버 지도 (Naver Maps API v3) 발급 및 등록

### 📌 발급 절차
1. **[네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com/)** 접속 및 로그인
2. `[Services]` -> `[AI·NAVER API]` -> `[Application]` 선택 -> `[Application 등록]` 클릭
3. 서비스 선택: **`Web Dynamic Map`** 체크
4. Web 서비스 URL 등록:
   - `http://localhost:5173`
   - `http://localhost:8080`
5. 등록 완료 후 발급된 **`Client ID`** 복사

### ⚙️ `.env` 설정 (`frontend/.env` 및 `mobile-pwa/.env`)
```env
VITE_NAVER_MAP_CLIENT_ID=복사한_네이버_Client_ID
```

---

## 3. 🔵 Google Maps API / MapTiler 위성 지도 발급 및 등록

### 📌 Google Maps 발급 절차
1. **[Google Cloud Console](https://console.cloud.google.com/)** 접속
2. `[Maps JavaScript API]` 활성화 후 **API 키** 생성

### 📌 MapTiler (초고화질 위성 지도) 발급 절차
1. **[MapTiler Cloud](https://cloud.maptiler.com/)** 회원가입 후 **Key** 복사

### ⚙️ `.env` 설정 (`frontend/.env` 및 `mobile-pwa/.env`)
```env
VITE_GOOGLE_MAPS_API_KEY=복사한_구글맵_API_KEY
VITE_MAPTILER_API_KEY=복사한_MapTiler_Key
```

---

## 🚀 프로젝트 반영 방법

1. `frontend/.env.example` 파일을 복사하여 `frontend/.env` 파일 생성 후 키 입력
2. `mobile-pwa/.env.example` 파일을 복사하여 `mobile-pwa/.env` 파일 생성 후 키 입력
3. 개발 서버 재가동 (`npm run dev`) 시 환경변수가 자동으로 로드되어 연동됩니다.
