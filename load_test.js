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

const NUM_TRUCKS = 50;
const COMPANIES = ['스마트 해운물류', '부산신항로지스', '한진특수수송', '현대글로벌물류'];

// 부산신항 주변 실제 100% 육지 도로망 좌표 포인트
const REAL_LAND_ROADS = [
    { lat: 35.0910, lng: 128.8020 }, // PNIT 남컨테이너 게이트 육상 진입로
    { lat: 35.0950, lng: 128.8250 }, // PNC 북측 배후도로 (신항북로)
    { lat: 35.0820, lng: 128.8350 }, // HJNC 동측 육상도로
    { lat: 35.1000, lng: 128.8150 }  // 웅동 배후단지 육상도로 (계발로)
];

// 50대 트럭을 육상 도로 선상에 배치
const trucks = Array.from({ length: NUM_TRUCKS }).map((_, i) => {
    const road = REAL_LAND_ROADS[i % REAL_LAND_ROADS.length];
    return {
        id: `부산 ${80 + (i % 10)}바 ${1000 + i}`,
        driver_name: `기사_${i + 1}`,
        truck_number: `부산 ${80 + (i % 10)}바 ${1000 + i}`,
        company: COMPANIES[i % COMPANIES.length],
        lat: road.lat + (Math.random() - 0.5) * 0.003,
        lng: road.lng + (Math.random() - 0.5) * 0.004,
    };
});

const sendPayload = (truck) => {
    // 도로를 따라 미세 주행
    truck.lat += (Math.random() - 0.5) * 0.0001;
    truck.lng += (Math.random() - 0.5) * 0.0001;

    const payload = JSON.stringify({
        truck_id: truck.id,
        driver_name: truck.driver_name,
        truck_number: truck.truck_number,
        company: truck.company,
        timestamp: new Date().toISOString(),
        raw_gps: {
            type: "Point",
            coordinates: [truck.lng, truck.lat]
        },
        status: Math.random() > 0.85 ? "WAITING" : "MOVING",
        imu: { accelX: Math.random(), accelY: Math.random(), yaw: Math.random() }
    });

    const req = http.request(SERVER_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.error(`[${truck.id}] 에러 응답: ${res.statusCode} - ${data}`);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`[${truck.id}] 서버 접속 에러: ${e.message}`);
    });

    req.write(payload);
    req.end();
};

let sendCount = 0;

const runTest = () => {
    sendCount++;
    trucks.forEach(truck => sendPayload(truck));
    console.log(`[Load Test] 50대 트럭 육상 도로 전송 중... (누적: ${sendCount * NUM_TRUCKS}건)`);
};

console.log(`🚀 50대 트럭 실 육상 도로 부하 테스트 시작!`);
runTest();
setInterval(runTest, 1000);
