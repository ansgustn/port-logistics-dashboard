import SensorLog from '../models/SensorLog.js';
import { updateRealTruck } from '../services/socketService.js';
import { snapToRoad } from '../utils/mapMatcher.js';
import axios from 'axios';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000/api/predict/wait-time';

export const saveSensorLog = async (req, res) => {
    try {
        const { truck_id, timestamp, raw_gps, imu } = req.body;

        // 필수 값 검증
        if (!truck_id || !raw_gps || !raw_gps.coordinates) {
            return res.status(400).json({ 
                message: 'Missing required fields: truck_id or raw_gps.coordinates' 
            });
        }

        // 1. 맵 매칭 (Snapping)
        // 모바일 앱에서 OSRM 실도로 경로를 기반으로 전송하므로, 
        // 기존의 임의 직선 구간(ROUTES)으로 강제 매칭하는 로직을 해제합니다.
        const rawLng = raw_gps.coordinates[0];
        const rawLat = raw_gps.coordinates[1];
        // 육상 도로망 위로 맵 매칭 (Snap to Road)
        const [snappedLng, snappedLat] = snapToRoad(rawLng, rawLat);

        // 2. AI 서버 대기시간/탄소배출 예측 호출
        let predictionResult = null;
        try {
            const aiResponse = await axios.post(FASTAPI_URL, {
                cargo_volume: 2500, // 더미 데이터로 전송
                temperature: 28.5,
                precipitation: 0,
                traffic_volume: 550,
                terminal_code: 'PNC', 
                day_of_week: 'FRI',
                time_block: '12-18'
            });
            predictionResult = aiResponse.data;
        } catch (e) {
            console.error("AI 서버 호출 실패:", e.message);
        }

        // 3. MongoDB 저장
        const logData = {
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            truck_id: truck_id,
            raw_gps: raw_gps,
            corrected_gps: { type: 'Point', coordinates: [snappedLng, snappedLat] },
            imu: imu,
            prediction: predictionResult ? {
                predicted_wait_time_minutes: predictionResult.predicted_wait_time_minutes,
                status: predictionResult.status,
                co2_emissions_kg: predictionResult.co2_emissions_kg
            } : undefined
        };
        const newLog = new SensorLog(logData);
        await newLog.save();

        // 4. WebSocket 업데이트를 위해 메모리 갱신
        const truckData = {
            ...req.body,
            truck_id: req.body.truck_id || req.body.truck_number,
            driver_name: req.body.driver_name || req.body.driverName || '김항만',
            truck_number: req.body.truck_number || req.body.truckNumber || req.body.truck_id,
            company: req.body.company || '스마트 해운물류',
            corrected_gps: [snappedLng, snappedLat],
            prediction: predictionResult,
            status: req.body.status || 'MOVING'
        };
        updateRealTruck(truckData);

        res.status(200).json({ 
            message: 'Sensor log processed and broadcasted successfully',
            truck_id: truck_id
        });
    } catch (error) {
        console.error('Failed to save sensor log:', error);
        res.status(500).json({ 
            message: 'Internal Server Error', 
            error: error.message 
        });
    }
};
