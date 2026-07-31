import pandas as pd
import joblib
import os

class WaitTimePredictor:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'wait_time_model.joblib')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError("wait_time_model.joblib 파일이 없습니다. train.py를 먼저 실행하세요.")
        
        # 저장된 전체 파이프라인(전처리기 + XGBoost)을 한 번에 로드
        self.pipeline = joblib.load(model_path)
        print("[SUCCESS] 예측 파이프라인이 성공적으로 로드되었습니다.")

    def predict(self, input_data: dict) -> float:
        """
        단일 화물차 진입 정보 딕셔너리를 받아 예측 대기 시간을 분 단위로 반환합니다.
        """
        df_input = pd.DataFrame([input_data])
        prediction = self.pipeline.predict(df_input)
        return float(prediction[0])

# 단독 실행 시 테스트 코드
if __name__ == "__main__":
    try:
        predictor = WaitTimePredictor()
        
        # 새로운 차량 진입 시나리오 (예: 금요일 오후, 혼잡한 교통량)
        scenario = {
            'cargo_volume': 2500,
            'temperature': 28.5,
            'precipitation': 0,
            'traffic_volume': 550, 
            'terminal_code': 'PNC',
            'day_of_week': 'FRI',
            'time_block': '12-18'
        }
        
        estimated_time = predictor.predict(scenario)
        print(f"\n[PREDICT] 입력 시나리오에 따른 예상 대기 시간: {estimated_time:.1f} 분")
        
    except Exception as e:
        print(f"[ERROR] 추론 실패: {e}")
