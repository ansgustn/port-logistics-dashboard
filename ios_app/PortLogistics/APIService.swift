import Foundation

class APIService {
    static let shared = APIService()
    // 현재 실행 환경에 맞게 로컬 IP 주소(Node.js 백엔드)로 변경해야 합니다.
    private let serverURL = "http://localhost:3000/api/sensor"
    
    func sendSensorData(latitude: Double, longitude: Double, status: String) {
        guard let url = URL(string: serverURL) else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let payload: [String: Any] = [
            "truck_id": "iphone-real-1",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "raw_gps": [
                "type": "Point",
                "coordinates": [longitude, latitude] // GeoJSON 순서: [경도, 위도]
            ],
            "status": status,
            "imu": [
                "accelX": 0.0,
                "accelY": 0.0,
                "yaw": 0.0
            ]
        ]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
            let task = URLSession.shared.dataTask(with: request) { data, response, error in
                if let error = error {
                    print("❌ 서버 전송 실패: \(error.localizedDescription)")
                    return
                }
                print("✅ 실제 아이폰 위치 데이터 전송 성공!")
            }
            task.resume()
        } catch {
            print("Payload 생성 에러: \(error)")
        }
    }
}
