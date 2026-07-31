# Stage 1: Build React App
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite 빌드 커맨드 (정적 파일 생성)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# 빌드된 정적 파일들을 Nginx의 기본 호스팅 폴더로 복사
COPY --from=build /app/dist /usr/share/nginx/html
# 우리가 직접 커스텀한 Nginx 설정 파일 덮어쓰기
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
