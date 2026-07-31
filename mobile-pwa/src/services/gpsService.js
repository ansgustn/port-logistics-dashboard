import axios from 'axios';

class GpsService {
  constructor() {
    this.intervalId = null;
    this.currentLat = 35.080;
    this.currentLng = 128.815;
    this.routeCoords = null;
    this.routeIndex = 0;
    this.currentTarget = null;
  }

  setRouteToFollow(targetTerminalCode, coordinates) {
    // 목적지가 변경되었을 때만 주행 경로를 새로운 도로망으로 강제 리셋
    if (this.currentTarget !== targetTerminalCode) {
      console.log(`[GPS] 목적지 변경 감지: ${targetTerminalCode}`);
      this.currentTarget = targetTerminalCode;
      this.routeCoords = coordinates;
      this.routeIndex = 0;
    }
  }

  startSimulation(truckId) {
    if (this.intervalId) return;
    console.log(`[GPS] 시뮬레이션 시작: ${truckId}`);
    
    // 시뮬레이션 속도: 1틱(1초)당 이동할 위경도 거리 (0.0003은 대략 초속 30m, 시속 100km 정도의 속도)
    const SPEED = 0.0003; 

    this.intervalId = setInterval(async () => {
      // OSRM 경로가 주입되어 있다면, 건물이 아닌 실제 도로 좌표를 따라 부드럽게 이동(보간)
      if (this.routeCoords && this.routeIndex < this.routeCoords.length) {
        const targetLng = this.routeCoords[this.routeIndex][0];
        const targetLat = this.routeCoords[this.routeIndex][1];

        const dx = targetLng - this.currentLng;
        const dy = targetLat - this.currentLat;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= SPEED) {
          // 목표 지점에 도달했거나 매우 가까우면 바로 점프하고 다음 포인트 지목
          this.currentLng = targetLng;
          this.currentLat = targetLat;
          this.routeIndex++;
        } else {
          // 목표 지점이 멀면 SPEED 만큼만 잘라서 이동 (Interpolation)
          const ratio = SPEED / dist;
          this.currentLng += dx * ratio;
          this.currentLat += dy * ratio;
        }
      }

      const isArrived = this.routeCoords && this.routeIndex >= this.routeCoords.length;

      let remainingCoords = null;
      if (!isArrived) {
        // 지나온 경로는 버리고 남은 경로를 가져온 뒤, 내 현재 위치를 맨 앞에 삽입(unshift)하여 선을 연결
        remainingCoords = this.routeCoords.slice(this.routeIndex);
        remainingCoords.unshift([this.currentLng, this.currentLat]);
      }

      if (this.onLocationUpdate) {
        this.onLocationUpdate({ 
          lat: this.currentLat, 
          lng: this.currentLng,
          remainingCoords,
          isArrived
        });
      }

      // localStorage에 저장된 기사 프로필 정보 불러오기
      let driverInfo = {
        driverName: '김항만',
        truckNumber: '부산 88바 1234',
        company: '스마트 해운물류'
      };
      try {
        const saved = localStorage.getItem('port_pwa_settings');
        if (saved) {
          driverInfo = { ...driverInfo, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error('설정 정보 로드 실패', e);
      }

      const persistentTruckId = driverInfo.truckNumber || truckId || '부산 88바 1234';

      const payload = {
        truck_id: persistentTruckId,
        driver_name: driverInfo.driverName,
        truck_number: driverInfo.truckNumber,
        company: driverInfo.company,
        timestamp: new Date().toISOString(),
        raw_gps: {
          type: "Point",
          coordinates: [this.currentLng, this.currentLat]
        },
        status: isArrived ? "WAITING" : "MOVING",
        imu: { accelX: 0, accelY: 0, yaw: 0 }
      };

      try {
        await axios.post('http://localhost:3000/api/sensor', payload);
      } catch (err) {
        console.error('[GPS] 전송 실패', err.message);
      }

      // 목적지 도착 시 자동 종료
      if (isArrived) {
        this.stopSimulation();
      }
    }, 1000);
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[GPS] 시뮬레이션 종료`);
    }
  }

  setListener(callback) {
    this.onLocationUpdate = callback;
  }
}

export default new GpsService();
