from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pandas as pd
import joblib
import logging
import os

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="항만 물류 대기시간 예측 AI 서버",
    description="XGBoost 모델 기반 항만 터미널 진입 대기시간 예측 API",
    version="1.0.0"
)

# 1. AI 모델 적재 (서버 가동 시 1회만 실행하여 속도 최적화)
try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, 'wait_time_model.joblib')
    
    model_pipeline = joblib.load(model_path)
    logger.info("[SUCCESS] 머신러닝 예측 모델을 성공적으로 로드했습니다.")
except Exception as e:
    logger.warning(f"[WARNING] 모델 로드 실패 (테스트 모드로 전환): {e}")
    model_pipeline = None

# 2. 클라이언트(Node.js)가 보낼 요청 데이터(Payload) 스키마 정의
# Phase 3에서 학습시킨 XGBoost 모델의 Feature와 정확히 일치하도록 수정했습니다.
class WaitTimeRequest(BaseModel):
    cargo_volume: float = Field(..., example=2500, description="하역 물동량 (TEU)")
    temperature: float = Field(..., example=28.5, description="기온 (섭씨)")
    precipitation: float = Field(..., example=0, description="강수량 (mm)")
    traffic_volume: float = Field(..., example=550, description="주변 도로 교통량")
    terminal_code: str = Field(..., example="PNC", description="터미널 코드 (PNIT, PNC, HJNC, HPNT)")
    day_of_week: str = Field(..., example="FRI", description="요일 (MON, TUE, WED, THU, FRI, SAT, SUN)")
    time_block: str = Field(..., example="12-18", description="시간대 (00-06, 06-12, 12-18, 18-24)")

# 3. 예측 결과를 반환할 응답 데이터 스키마 정의
class WaitTimeResponse(BaseModel):
    terminal_code: str
    predicted_wait_time_minutes: int
    status: str
    co2_emissions_kg: float  # [신규] 탄소 배출량 필드 추가

# 4. 예측 API 엔드포인트 구현
@app.post("/api/predict/wait-time", response_model=WaitTimeResponse)
async def predict_wait_time(data: WaitTimeRequest):
    try:
        # Pydantic 모델을 Pandas DataFrame으로 변환
        input_df = pd.DataFrame([{
            "cargo_volume": data.cargo_volume,
            "temperature": data.temperature,
            "precipitation": data.precipitation,
            "traffic_volume": data.traffic_volume,
            "terminal_code": data.terminal_code,
            "day_of_week": data.day_of_week,
            "time_block": data.time_block
        }])

        if model_pipeline:
            # Pipeline 내부에 결측치 채우기 및 스케일링/원핫인코딩 로직이 이미 포함되어 있습니다.
            predicted_value = model_pipeline.predict(input_df)[0]
            wait_time = int(max(0, predicted_value)) # 대기 시간은 음수가 될 수 없음
        else:
            # 모델이 없을 경우를 위한 더미(Dummy) 응답 로직
            base_time = {"PNIT": 15, "PNC": 45, "HJNC": 10, "HPNT": 25}.get(data.terminal_code.upper(), 20)
            wait_time = base_time + int(data.traffic_volume // 10)

        # 상태값 부여 (예: 60분 이상이면 심각, 30분 이상 혼잡)
        if wait_time >= 60:
            status = "심각"
        elif wait_time >= 30:
            status = "혼잡"
        else:
            status = "원활"

        # [신규] ESG 비선형 다변량 탄소 배출량 산출 (단위: kg)
        # 공차/공회전으로 인한 연료 소모 기반의 비선형 CO2 배출 추정식
        co2_emissions = round((wait_time ** 1.1) * (data.traffic_volume * 0.012) * 0.045, 2)

        return WaitTimeResponse(
            terminal_code=data.terminal_code,
            predicted_wait_time_minutes=wait_time,
            status=status,
            co2_emissions_kg=co2_emissions
        )

    except Exception as e:
        logger.error(f"[ERROR] 예측 처리 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail="서버 내부 예측 모델에서 오류가 발생했습니다.")

# 서버 생존 확인용 엔드포인트 (Health Check)
@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": model_pipeline is not None}
