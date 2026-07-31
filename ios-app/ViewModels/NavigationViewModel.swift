import Foundation
import Combine

@MainActor
class NavigationViewModel: ObservableObject {
    @Published var locationManager = LocationManager()
    private let apiService = APIService()
    
    // UI 표시용 상태
    @Published var isInsideTerminal: Bool = false
    @Published var terminalMessage: String = "터미널 밖 대기 중"
    
    // 임시 부여된 차량 ID (실제로는 로그인 세션에서 가져옴)
    private let truckId = "TRUCK-1004"
    
    private var cancellables = Set<AnyCancellable>()
    private var timer: Timer?
    
    init() {
        startSendingDataPeriodic()
    }
    
    // 5초에 한 번씩 데이터 전송
    private func startSendingDataPeriodic() {
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task {
                await self?.sendDataToServer()
            }
        }
    }
    
    private func sendDataToServer() async {
        guard let location = locationManager.currentLocation else { return }
        let imu = locationManager.currentIMU ?? IMUData(accel_x: 0, accel_y: 0, accel_z: 0, gyro_x: 0, gyro_y: 0, gyro_z: 0)
        
        let isoFormatter = ISO8601DateFormatter()
        let timestamp = isoFormatter.string(from: Date())
        
        // 1. 센서 데이터 MongoDB 전송
        let sensorPayload = SensorPayload(
            truck_id: truckId,
            timestamp: timestamp,
            raw_gps: GPSCoordinates(coordinates: [location.coordinate.longitude, location.coordinate.latitude]),
            corrected_gps: nil, // 추후 맵매칭된 좌표가 있으면 세팅
            imu: imu
        )
        await apiService.sendSensorData(payload: sensorPayload)
        
        // 2. 지오펜싱(터미널 진입 여부) PostGIS 확인
        let geofencePayload = GeofencePayload(
            truck_id: truckId,
            longitude: location.coordinate.longitude,
            latitude: location.coordinate.latitude
        )
        
        if let response = await apiService.checkGeofence(payload: geofencePayload) {
            self.isInsideTerminal = response.is_inside
            self.terminalMessage = response.message
        }
    }
    
    deinit {
        timer?.invalidate()
    }
}
