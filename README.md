# 🚢 스마트 항만 물류 관제 & 디지털 트윈 AI 플랫폼 (Port Logistics Dashboard)

> 실시간 차량 텔레메트리 데이터 수집, PostGIS 지오펜싱 기반 입항 제어, AI 대기시간/ESG 탄소 배출 예측, 그리고 Unity 3D 디지털 트윈 시뮬레이션을 결합한 **엔드투엔드(End-to-End) 스마트 항만 물류 통합 관제 시스템**입니다.

## 1. 프로젝트 개요 (Overview)
**항만 터미널 진입 대기시간 증가로 인한 물류 정체 및 공회전 탄소 배출 문제**를 해결하기 위해 기획되었습니다. 실시간 텔레메트리 수집부터 AI 대기시간 예측, 공간 지오펜싱, 실시간 관제 및 3D 디지털 트윈을 마이크로서비스 아키텍처(MSA)로 통합하여, 물류 대기 정체를 완화하고 ESG 기반 실시간 탄소 배출량 모니터링 환경을 구축했습니다.

## 2. 시스템 아키텍처 (System Architecture)
다양한 클라이언트 환경과 분산된 마이크로서비스 백엔드를 연동하여 데이터 수집부터 분석, 모니터링까지 실시간으로 처리합니다.

```mermaid
flowchart TD
    subgraph Clients ["1. 클라이언트 및 수집 단말 (Client Layer)"]
        PWA["트럭 운전자 PWA (React / ServiceWorker)"]
        iOSApp["iOS 네이티브 앱 (Swift / Combine)"]
        UnitySim["Unity 3D 트래픽 시뮬레이터"]
    end

    subgraph API Gateway & Service ["2. 마이크로서비스 백엔드 (Docker Environment)"]
        NodeServer["Node.js / Express API Server"]
        FastAPI["Python FastAPI ML Server"]
        SocketServer["Socket.io WebSocket Server"]
    end

    subgraph Storage & Analytics ["3. 데이터 및 AI 분석 레이어"]
        MongoDB[("MongoDB (시계열 센서 로그)")]
        PostGIS[("PostgreSQL + PostGIS (공간 연산)")]
        MLModel["XGBoost ML Pipeline (.joblib)"]
    end

    subgraph Presentation ["4. 실시간 모니터링 레이어"]
        WebDashboard["항만 웹 관제 대시보드 (React + Tailwind + Nginx)"]
    end

    Clients -->|GPS/센서 Telemetry REST API| NodeServer
    Clients -->|실시간 소켓 연결| SocketServer
    NodeServer -->|비동기 저널링| MongoDB
    NodeServer -->|ST_Contains 지오펜싱| PostGIS
    NodeServer -->|대기시간/CO2 예측 요청| FastAPI
    FastAPI -->|특성 추출 및 추론| MLModel
    FastAPI -->|예측치 & ESG 연산 반환| NodeServer
    SocketServer -->|실시간 상태 브로드캐스팅| WebDashboard
