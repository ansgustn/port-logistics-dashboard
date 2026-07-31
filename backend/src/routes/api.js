import express from 'express';
import { getHealthStatus } from '../controllers/healthController.js';
import { saveSensorLog } from '../controllers/sensorController.js';
import { checkGeofenceEntry } from '../controllers/geofenceController.js';
import { getTerminalWaitTime } from '../controllers/aiController.js';

const router = express.Router();

// 헬스 체크 엔드포인트
router.get('/health', getHealthStatus);

// 센서 데이터 수집 API 라우트
router.post('/sensor', saveSensorLog);

// 지오펜싱(PostGIS) API 라우트
router.post('/location/check-entry', checkGeofenceEntry);

// AI 대기시간 예측 (FastAPI 연동) 라우트
router.post('/predict/wait-time', getTerminalWaitTime);

export default router;
