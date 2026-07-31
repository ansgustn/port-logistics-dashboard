# 1. Base 이미지 (가벼운 slim 버전 사용)
FROM python:3.10-slim

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. 소스 코드 복사 (학습된 pkl 모델 파일 포함)
COPY . .

# 5. FastAPI 포트 노출
EXPOSE 8000

# 6. Uvicorn 웹 서버 실행 (0.0.0.0으로 바인딩해야 외부 접속 가능)
CMD ["uvicorn", "api_server:app", "--host", "0.0.0.0", "--port", "8000"]
