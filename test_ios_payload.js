const http = require('http');

const SERVER_URL = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sensor',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

// PNIT 남컨테이너 게이트 진입 육상 도로 좌표 (35.0910, 128.8020)
let currentLat = 35.0910;
let currentLng = 128.8020;

const sendDummyIosPayload = () => {
    // 실제 도로를 따라 주행 이동
    currentLat += (Math.random() - 0.5) * 0.0002;
    currentLng += (Math.random() - 0.5) * 0.0002;

    const payload = JSON.stringify({
        truck_id: "부산 88바 1234",
        driver_name: "김항만",
        truck_number: "부산 88바 1234",
        company: "스마트 해운물류",
        timestamp: new Date().toISOString(),
        raw_gps: {
            type: "Point",
            coordinates: [currentLng, currentLat]
        },
        status: "MOVING",
        imu: { accelX: 0, accelY: 0, yaw: 0 }
    });

    const req = http.request(SERVER_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => console.log(`[iOS 시뮬레이터] 백엔드 응답: ${res.statusCode} - ${data}`));
    });

    req.on('error', (e) => {
        console.error(`[iOS 시뮬레이터] 서버 접속 에러: ${e.message}`);
    });

    req.write(payload);
    req.end();
};

console.log("📱 iOS 앱 시뮬레이터 시작! 부산신항 육상 도로 상에서 1초마다 좌표를 쏩니다...");
sendDummyIosPayload();
setInterval(sendDummyIosPayload, 1000);
