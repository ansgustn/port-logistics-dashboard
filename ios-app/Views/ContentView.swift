import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = NavigationViewModel()
    @State private var selectedTab = 0
    @State private var isLiveActivityActive = true
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Tab 1: 기사 내비게이션 & 메인 대시보드
            NavigationView {
                ZStack {
                    Color.black.ignoresSafeArea()
                    
                    ScrollView {
                        VStack(spacing: 20) {
                            // 헤더
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("부산신항 물류 내비게이션")
                                        .font(.title2)
                                        .bold()
                                        .foregroundColor(.white)
                                    Text("SMART PORT DRIVER NAVI")
                                        .font(.caption)
                                        .fontWeight(.semibold)
                                        .foregroundColor(.gray)
                                }
                                Spacer()
                                Image(systemName: "antenna.radiowaves.left.and.right")
                                    .font(.title2)
                                    .foregroundColor(.green)
                            }
                            .padding(.horizontal)
                            .padding(.top, 10)

                            // iOS Live Activity 잠금화면 위젯 미리보기 카드
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Label("Live Activity 위젯 (잠금화면)", systemImage: "clock.badge.checkmark.fill")
                                        .font(.caption)
                                        .bold()
                                        .foregroundColor(.indigo)
                                    Spacer()
                                    Toggle("", isOn: $isLiveActivityActive)
                                        .labelsHidden()
                                        .scaleEffect(0.8)
                                }
                                
                                HStack(spacing: 16) {
                                    VStack(alignment: .leading) {
                                        Text("목적지")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("PNIT 터미널")
                                            .font(.headline)
                                            .foregroundColor(.white)
                                    }
                                    Spacer()
                                    VStack(alignment: .trailing) {
                                        Text("예측 대기시간")
                                            .font(.caption2)
                                            .foregroundColor(.gray)
                                        Text("12분 (원활)")
                                            .font(.headline)
                                            .bold()
                                            .foregroundColor(.green)
                                    }
                                }
                                
                                ProgressView(value: 0.25)
                                    .accentColor(.indigo)
                            }
                            .padding()
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(20)
                            .overlay(
                                RoundedRectangle(cornerRadius: 20)
                                    .stroke(Color.indigo.opacity(0.3), lineWidth: 1)
                            )
                            .padding(.horizontal)

                            // 상태 표시 카드
                            VStack(spacing: 15) {
                                HStack {
                                    Circle()
                                        .fill(viewModel.isInsideTerminal ? Color.green : Color.orange)
                                        .frame(width: 12, height: 12)
                                    
                                    Text(viewModel.isInsideTerminal ? "터미널 진입 완료" : "게이트 접근 중")
                                        .font(.headline)
                                        .foregroundColor(viewModel.isInsideTerminal ? .green : .orange)
                                    
                                    Spacer()
                                }
                                
                                Text(viewModel.terminalMessage)
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .cornerRadius(16)
                            .padding(.horizontal)

                            // 터미널 현황 리스트
                            VStack(alignment: .leading, spacing: 12) {
                                Text("주요 터미널 대기 현황")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                
                                ForEach(["PNIT", "PNC", "HJNC", "HPNT"], id: \.self) { code in
                                    HStack {
                                        Text(code)
                                            .font(.headline)
                                            .foregroundColor(.white)
                                        Spacer()
                                        Text("예측 14분")
                                            .font(.subheadline)
                                            .fontWeight(.bold)
                                            .foregroundColor(.green)
                                    }
                                    .padding()
                                    .background(Color.white.opacity(0.05))
                                    .cornerRadius(12)
                                }
                            }
                            .padding(.horizontal)
                        }
                        .padding(.bottom, 30)
                    }
                }
                .navigationBarHidden(true)
            }
            .tabItem {
                Label("주행내비", systemImage: "location.fill")
            }
            .tag(0)

            // Tab 2: 실시간 센서 디버그 뷰
            NavigationView {
                ZStack {
                    Color.black.ignoresSafeArea()
                    
                    VStack(alignment: .leading, spacing: 15) {
                        Text("iOS 센서 텔레메트리 디버그")
                            .font(.title3)
                            .bold()
                            .foregroundColor(.white)
                            .padding(.top, 20)

                        VStack(alignment: .leading, spacing: 10) {
                            if let loc = viewModel.locationManager.currentLocation {
                                Text("GPS 위도 (LAT): \(loc.coordinate.latitude)")
                                Text("GPS 경도 (LNG): \(loc.coordinate.longitude)")
                                Text("고도 (ALT): \(loc.altitude) m")
                            } else {
                                Text("GPS 수신 대기 중...")
                            }
                            
                            Divider().background(Color.gray)
                            
                            if let imu = viewModel.locationManager.currentIMU {
                                Text("가속도 X: \(String(format: "%.3f", imu.accel_x))")
                                Text("가속도 Y: \(String(format: "%.3f", imu.accel_y))")
                                Text("가속도 Z: \(String(format: "%.3f", imu.accel_z))")
                            } else {
                                Text("IMU 센서 로딩 중...")
                            }
                        }
                        .font(.system(.body, design: .monospaced))
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.green.opacity(0.15))
                        .foregroundColor(.green)
                        .cornerRadius(16)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.green.opacity(0.3), lineWidth: 1)
                        )

                        Spacer()
                    }
                    .padding(.horizontal)
                }
                .navigationBarHidden(true)
            }
            .tabItem {
                Label("센서디버그", systemImage: "cpu")
            }
            .tag(1)
        }
        .accentColor(.indigo)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
