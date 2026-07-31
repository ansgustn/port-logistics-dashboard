# 1. Base 이미지 (LTS 버전)
FROM node:20-alpine

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 패키지 파일 복사 및 모듈 설치
COPY package*.json ./
RUN npm install --production

# 4. 전체 소스 복사
COPY . .

# 5. 웹소켓 및 API 서버 포트 노출
EXPOSE 3000

# 6. Node.js 서버 실행
CMD ["node", "server.js"]
