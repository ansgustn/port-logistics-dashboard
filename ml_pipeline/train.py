import pandas as pd
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

def build_pipeline():
    # 1. 컬럼 정의
    num_features = ['cargo_volume', 'temperature', 'precipitation', 'traffic_volume']
    cat_features = ['terminal_code', 'day_of_week', 'time_block']
    
    # 2. 수치형 전처리기 (결측치는 중앙값으로, 스케일링 적용)
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    # 3. 범주형 전처리기 (결측치는 최빈값으로, 원핫인코딩 적용)
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))
    ])
    
    # 4. ColumnTransformer 조립
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, num_features),
            ('cat', categorical_transformer, cat_features)
        ])
    
    # 5. 최종 파이프라인 (전처리기 + XGBoost 회귀 모델)
    model = xgb.XGBRegressor(
        n_estimators=200, 
        learning_rate=0.05, 
        max_depth=6, 
        random_state=42
    )
    
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', model)
    ])
    
    return pipeline

def train_and_save():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, 'port_data.csv')
    model_path = os.path.join(current_dir, 'wait_time_model.joblib')

    if not os.path.exists(data_path):
        print("[ERROR] port_data.csv 파일을 찾을 수 없습니다. data_generator.py를 먼저 실행해주세요.")
        return

    print("[INFO] 데이터 로드 및 전처리 시작...")
    df = pd.read_csv(data_path)
    
    X = df.drop(columns=['wait_time_mins'])
    y = df['wait_time_mins']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    pipeline = build_pipeline()
    
    print("[INFO] XGBoost 앙상블 파이프라인 학습 시작 (진행 시간이 소요될 수 있습니다)...")
    pipeline.fit(X_train, y_train)
    
    # 모델 평가
    y_pred = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    
    print("\n[SUCCESS] 모델 학습 완료!")
    print(f"-> 평균 절대 오차 (MAE): {mae:.2f} 분")
    print(f"-> 평균 제곱근 오차 (RMSE): {rmse:.2f} 분")
    
    # 모델 저장 (직렬화)
    joblib.dump(pipeline, model_path)
    print(f"[SAVE] 모델 파이프라인이 저장되었습니다: {model_path}")

if __name__ == "__main__":
    train_and_save()
