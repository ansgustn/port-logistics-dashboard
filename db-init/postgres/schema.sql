-- PostGIS 익스텐션 활성화
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. 기사 정보
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'DRIVER'
);

-- 2. 차량 정보
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    max_capacity_tons DECIMAL(5,2)
);

-- 3. 선박 및 스케줄 (Port-MIS 연동)
CREATE TABLE ships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mmsi VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
    expected_arrival TIMESTAMP WITH TIME ZONE,
    expected_departure TIMESTAMP WITH TIME ZONE,
    terminal_code VARCHAR(20)
);

-- 4. 방문 예약 및 실시간 상태 (교차 엔티티)
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id UUID REFERENCES trucks(id),
    schedule_id UUID REFERENCES schedules(id),
    status VARCHAR(20) DEFAULT 'PENDING',
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 지오펜싱 영역 관리 (PostGIS 활용)
CREATE TABLE terminal_geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_code VARCHAR(20) UNIQUE NOT NULL,
    geom GEOMETRY(Polygon, 4326) -- WGS 84 기준
);

-- 공간 인덱스(GiST) 생성
CREATE INDEX idx_terminal_geofences_geom ON terminal_geofences USING GIST (geom);
