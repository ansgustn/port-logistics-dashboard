import Foundation
import CoreLocation
import CoreMotion

class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    private let motionManager = CMMotionManager()
    
    @Published var currentLocation: CLLocation?
    @Published var currentIMU: IMUData?
    
    override init() {
        super.init()
        setupLocation()
        setupMotion()
    }
    
    private func setupLocation() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        locationManager.distanceFilter = 2.0 // 2미터 이동 시 업데이트
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }
    
    private func setupMotion() {
        if motionManager.isDeviceMotionAvailable {
            motionManager.deviceMotionUpdateInterval = 0.2 // 5Hz
            motionManager.startDeviceMotionUpdates(to: .main) { [weak self] (data, error) in
                guard let data = data, error == nil else { return }
                
                self?.currentIMU = IMUData(
                    accel_x: data.userAcceleration.x,
                    accel_y: data.userAcceleration.y,
                    accel_z: data.userAcceleration.z,
                    gyro_x: data.rotationRate.x,
                    gyro_y: data.rotationRate.y,
                    gyro_z: data.rotationRate.z
                )
            }
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        self.currentLocation = location
    }
}
