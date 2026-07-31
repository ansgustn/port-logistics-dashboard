// MongoDB 초기화 스크립트 (init.js)
// 포트 물류 데이터베이스 선택
db = db.getSiblingDB('port_logistics');

// 1. Time-Series Collection 생성
db.createCollection("SensorLogs", {
    timeseries: {
        timeField: "timestamp",
        metaField: "truck_id",
        granularity: "seconds"
    }
});

// 2. 2dsphere 인덱스 생성 (공간 검색용)
// corrected_gps 필드에 인덱스 적용
db.SensorLogs.createIndex({ "corrected_gps": "2dsphere" });

print("✅ MongoDB Initialization: SensorLogs Time-Series collection and 2dsphere index created successfully.");
