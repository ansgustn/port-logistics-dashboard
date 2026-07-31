import Foundation

class APIService {
    // 로컬 환경의 Node.js 서버 (실제 기기 배포 시 로컬 IP나 도메인으로 변경)
    private let baseURL = "http://localhost:3000/api"
    
    func sendSensorData(payload: SensorPayload) async {
        guard let url = URL(string: "\(baseURL)/sensor") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(payload)
            let (_, response) = try await URLSession.shared.data(for: request)
            
            if let httpResp = response as? HTTPURLResponse, httpResp.statusCode == 201 {
                print("✅ 센서 데이터 전송 성공")
            }
        } catch {
            print("❌ 센서 데이터 전송 실패: \(error)")
        }
    }
    
    func checkGeofence(payload: GeofencePayload) async -> GeofenceResponse? {
        guard let url = URL(string: "\(baseURL)/location/check-entry") else { return nil }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            request.httpBody = try JSONEncoder().encode(payload)
            let (data, _) = try await URLSession.shared.data(for: request)
            return try JSONDecoder().decode(GeofenceResponse.self, from: data)
        } catch {
            print("❌ 지오펜싱 체크 실패: \(error)")
            return nil
        }
    }
}
