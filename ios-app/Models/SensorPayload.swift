import Foundation

// MongoDB /api/sensor 로 보낼 페이로드
struct SensorPayload: Codable {
    let truck_id: String
    let timestamp: String
    let raw_gps: GPSCoordinates
    let corrected_gps: GPSCoordinates?
    let imu: IMUData
}

// PostgreSQL /api/location/check-entry 로 보낼 페이로드
struct GeofencePayload: Codable {
    let truck_id: String
    let longitude: Double
    let latitude: Double
}

struct GPSCoordinates: Codable {
    let coordinates: [Double] // [경도, 위도]
}

struct IMUData: Codable {
    let accel_x: Double
    let accel_y: Double
    let accel_z: Double
    let gyro_x: Double
    let gyro_y: Double
    let gyro_z: Double
}

struct GeofenceResponse: Codable {
    let is_inside: Bool
    let terminal_code: String?
    let message: String
}
