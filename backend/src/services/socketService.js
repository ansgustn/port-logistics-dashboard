import { Server } from 'socket.io';
import { ROUTES, snapToRoad } from '../utils/mapMatcher.js';

let io;
let trucks = []; // 전체 트럭의 최신 상태 메모리

// 트럭들을 특정 도로 위에 배치하고 각자의 속도를 부여
// 더미 데이터 생성을 중지하고 실제 iOS 좌표만 표시하도록 빈 배열 유지
const initializeMockTrucks = () => {
    trucks = [];
};

// 지정된 선분(도로)을 따라서만 이동하도록 시뮬레이션
const simulateMovement = () => {
    trucks = trucks.map(truck => {
        // 실제 기기는 서버 시뮬레이션에서 제외합니다 (외부 API로 들어온 실제 좌표 유지)
        if (truck.isReal) return truck;

        if (truck.status === 'MOVING') {
            truck.progress += truck.speed; // 앞으로 이동
            
            // 도로 끝(터미널 게이트 등)에 도달하면 방향을 뒤집고 잠시 대기
            if (truck.progress >= 1.0 || truck.progress <= 0.0) {
                truck.speed *= -1; // 후진(왕복)
                truck.progress = Math.max(0, Math.min(1, truck.progress));
                truck.status = 'WAITING'; // 게이트 진입 시 대기 상태로 전환
            }
            
            const route = ROUTES[truck.routeIdx];
            truck.longitude = route.start[0] + (route.end[0] - route.start[0]) * truck.progress;
            truck.latitude = route.start[1] + (route.end[1] - route.start[1]) * truck.progress;
            
            // 쌩쌩 달리다가 가끔 병목 현상으로 정체
            if (Math.random() > 0.97) truck.status = 'WAITING';
        } else {
            // 대기(정체) 중이던 트럭이 다시 도로로 합류하여 출발
            if (Math.random() > 0.6) truck.status = 'MOVING';
        }
        return truck;
    });
};

// 외부(iOS/PWA 앱 등)에서 들어온 실제 트럭 데이터를 메모리에 주입
export const updateRealTruck = (data) => {
    const truckId = data.truck_id || data.truck_number || 'UNKNOWN_TRUCK';
    const existingIndex = trucks.findIndex(t => t.id === truckId || t.truck_number === data.truck_number);
    const [snappedLng, snappedLat] = data.corrected_gps || data.raw_gps.coordinates;

    let rawStatus = data.status || 'MOVING';
    let stoppedSince = existingIndex >= 0 ? (trucks[existingIndex].stoppedSince || null) : null;
    let calculatedStatus = rawStatus;

    if (rawStatus === 'WAITING' || rawStatus === 'STOPPED' || rawStatus === 'STOPPED_SIGNAL' || rawStatus === 'BOTTLENECK') {
        if (!stoppedSince) {
            stoppedSince = Date.now();
        }
        const dwellSeconds = (Date.now() - stoppedSince) / 1000;
        
        // 30초 미만 일시 정차는 단순 신호 대기(STOPPED_SIGNAL), 30초 이상 연속 정차는 항만 병목(BOTTLENECK)
        if (dwellSeconds < 30) {
            calculatedStatus = 'STOPPED_SIGNAL';
        } else {
            calculatedStatus = 'BOTTLENECK';
        }
    } else {
        stoppedSince = null;
        calculatedStatus = 'MOVING';
    }

    const realTruck = {
        id: truckId,
        driver_name: data.driver_name || data.driverName || '김항만',
        truck_number: data.truck_number || data.truckNumber || truckId,
        company: data.company || '스마트 해운물류',
        longitude: snappedLng,
        latitude: snappedLat,
        status: calculatedStatus,
        stoppedSince,
        isReal: true,
        lastUpdated: Date.now(),
        prediction: data.prediction
    };

    if (existingIndex >= 0) {
        trucks[existingIndex] = { ...trucks[existingIndex], ...realTruck };
    } else {
        trucks.push(realTruck);
    }
    
    // 즉시 브로드캐스트하여 실시간성 극대화
    if (io) {
        io.emit('truck_locations', trucks);
    }
};

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // 프론트엔드에서의 접근 허용
            methods: ["GET", "POST"]
        }
    });

    initializeMockTrucks();

    io.on('connection', (socket) => {
        console.log(`📡 Dashboard Client Connected: ${socket.id}`);
        
        // 처음 접속 시 현재 전체 상태 전송
        socket.emit('truck_locations', trucks);

        // 관제 센터 우회/배차 승인 명령 처리
        socket.on('dispatch_action', (data) => {
            console.log(`📢 관제 센터 우회 명령 수신:`, data);
            io.emit('dispatch_reroute', {
                terminal_code: data?.terminal_code || 'PNIT',
                message: `[AI 관제 센터] ${data?.terminal_code || 'PNIT'} B게이트 우회 패스트트랙 경로가 지정되었습니다.`,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client Disconnected: ${socket.id}`);
        });
    });

    // 1초마다 시뮬레이션 및 만료된 실시간 기사 수거(Stale Pruning) 후 브로드캐스트
    setInterval(() => {
        simulateMovement();
        
        // 20초 동안 신호가 끊긴 실제 기사는 맵에서 수거하여 고스트 병목 현상 방지
        const now = Date.now();
        trucks = trucks.filter(t => !t.isReal || (now - t.lastUpdated < 20000));
        
        io.emit('truck_locations', trucks);
    }, 1000);
};

export const getIo = () => io;
