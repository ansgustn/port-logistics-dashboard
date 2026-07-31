import Foundation
import CoreLocation

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    
    @Published var latitude: Double = 0.0
    @Published var longitude: Double = 0.0
    @Published var status: String = "MOVING"
    
    private var lastSendTime = Date()
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        DispatchQueue.main.async {
            self.latitude = location.coordinate.latitude
            self.longitude = location.coordinate.longitude
            
            // 5초에 한 번씩만 서버로 전송 (네트워크 트래픽 최적화)
            let now = Date()
            if now.timeIntervalSince(self.lastSendTime) >= 5.0 {
                APIService.shared.sendSensorData(
                    latitude: self.latitude,
                    longitude: self.longitude,
                    status: self.status
                )
                self.lastSendTime = now
            }
        }
    }
}
