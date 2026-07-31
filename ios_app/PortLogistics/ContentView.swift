import SwiftUI

struct ContentView: View {
    @StateObject private var locationManager = LocationManager()
    
    var body: some View {
        VStack(spacing: 30) {
            Text("항만 물류 기사용 관제 앱")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(spacing: 10) {
                Text("현재 GPS 수신 상태")
                    .foregroundColor(.gray)
                Text("위도: \(locationManager.latitude)")
                Text("경도: \(locationManager.longitude)")
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)
            
            HStack {
                Text("현재 상태:")
                Picker("상태", selection: $locationManager.status) {
                    Text("이동 중 (MOVING)").tag("MOVING")
                    Text("대기 중 (WAITING)").tag("WAITING")
                }
                .pickerStyle(SegmentedPickerStyle())
            }
            .padding()
            
            Text("앱을 켜두시면 5초마다 대시보드 서버로 위치를 전송합니다.")
                .font(.footnote)
                .foregroundColor(.green)
                .multilineTextAlignment(.center)
                .padding()
        }
        .padding()
    }
}
