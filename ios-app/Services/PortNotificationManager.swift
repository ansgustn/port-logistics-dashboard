import Foundation
import UserNotifications

class PortNotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PortNotificationManager()
    
    override private init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    func requestAuthorization() {
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        UNUserNotificationCenter.current().requestAuthorization(options: options) { granted, error in
            if let error = error {
                print("❌ Notification Auth Error: \(error.localizedDescription)")
            } else {
                print("✅ Notification Granted: \(granted)")
            }
        }
    }
    
    func sendGeofenceAlert(terminalName: String) {
        let content = UNMutableNotificationContent()
        content.title = "⚓ 항만 게이트 진입 감지"
        content.body = "\(terminalName) 터미널 게이트에 접근했습니다. RFID 패스트트랙 라인으로 진입하세요."
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    func sendWaitTimeAlert(terminalName: String, waitMinutes: Int) {
        let content = UNMutableNotificationContent()
        content.title = "⚠️ \(terminalName) 대기시간 정체 경고"
        content.body = "현재 예상 대기시간이 \(waitMinutes)분입니다. 우회 경로를 이용하거나 우회 터미널 이용을 권장합니다."
        content.sound = .defaultCritical
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request)
    }
    
    // 포그라운드 알림 처리
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound, .badge])
    }
}
