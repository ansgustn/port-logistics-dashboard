import pandas as pd
import numpy as np
import os

def generate_mock_data(num_samples=5000, output_path='port_data.csv'):
    """터미널 진입 상황을 모방한 가상 데이터를 생성합니다."""
    np.random.seed(42)
    
    data = {
        'cargo_volume': np.random.randint(500, 3500, num_samples), # 하역 물동량 (TEU)
        'temperature': np.random.uniform(-10, 35, num_samples),    # 기온
        'precipitation': np.random.choice([0, 0, 0, 5, 20, 50], num_samples), # 강수량
        'traffic_volume': np.random.randint(50, 600, num_samples), # 주변 도로 교통량
        'terminal_code': np.random.choice(['PNIT', 'PNC', 'HJNC', 'HPNT'], num_samples),
        'day_of_week': np.random.choice(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], num_samples),
        'time_block': np.random.choice(['00-06', '06-12', '12-18', '18-24'], num_samples)
    }
    
    df = pd.DataFrame(data)
    
    # 가상의 타겟 변수 (wait_time_mins) 생성 로직
    # 교통량이 많거나, 강수량이 많거나, 특정 요일(금요일)일 때 대기 시간이 증가하도록 유도
    wait_times = (
        (df['cargo_volume'] * 0.02) + 
        (df['traffic_volume'] * 0.1) +
        (df['precipitation'] * 1.5) +
        np.where(df['day_of_week'] == 'FRI', 30, 0) +
        np.where(df['time_block'] == '12-18', 20, 0) +
        np.random.normal(10, 15, num_samples) # 노이즈 추가
    )
    
    df['wait_time_mins'] = np.clip(wait_times, 0, 300).astype(int) # 최소 0분, 최대 300분
    
    # 누락된 데이터(NaN) 임의 주입 (Robust 전처리 테스트용)
    df.loc[df.sample(frac=0.05).index, 'temperature'] = np.nan
    df.loc[df.sample(frac=0.02).index, 'cargo_volume'] = np.nan
    
    df.to_csv(output_path, index=False)
    print("[SUCCESS] 가상 데이터 {num_samples}건 생성 완료: {output_path}")

if __name__ == "__main__":
    # 스크립트 실행 위치를 기준으로 경로 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_dir, 'port_data.csv')
    generate_mock_data(output_path=file_path)
