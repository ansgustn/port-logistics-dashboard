import pool from '../config/postgres.js';

// 항만 터미널 경계 GeoJSON 다각형(Polygon) 맵
const TERMINAL_POLYGONS = [
  {
    code: 'PNIT',
    name: 'PNIT 신항 컨테이너 터미널',
    fastTrackLane: 'GATE_A_FASTTRACK',
    polygon: [
      [128.800, 35.085],
      [128.812, 35.085],
      [128.812, 35.095],
      [128.800, 35.095],
      [128.800, 35.085]
    ]
  },
  {
    code: 'PNC',
    name: 'PNC 신항 터미널',
    fastTrackLane: 'GATE_B_FASTTRACK',
    polygon: [
      [128.815, 35.078],
      [128.826, 35.078],
      [128.826, 35.086],
      [128.815, 35.086],
      [128.815, 35.078]
    ]
  },
  {
    code: 'HJNC',
    name: 'HJNC 한진신항 터미널',
    fastTrackLane: 'GATE_C_FASTTRACK',
    polygon: [
      [128.805, 35.065],
      [128.815, 35.065],
      [128.815, 35.075],
      [128.805, 35.075],
      [128.805, 35.065]
    ]
  },
  {
    code: 'HPNT',
    name: 'HPNT 현대부산신항 터미널',
    fastTrackLane: 'GATE_D_FASTTRACK',
    polygon: [
      [128.820, 35.084],
      [128.832, 35.084],
      [128.832, 35.092],
      [128.820, 35.092],
      [128.820, 35.084]
    ]
  }
];

// GeoJSON Point-in-Polygon 공간 검사 알고리즘 (Ray-casting)
function isPointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const checkGeofenceEntry = async (req, res) => {
    try {
        const { truck_id, longitude, latitude } = req.body;

        if (!truck_id || longitude === undefined || latitude === undefined) {
            return res.status(400).json({ 
                message: 'Missing required fields: truck_id, longitude, or latitude' 
            });
        }

        // 1. 1차 공간 연산: GeoJSON Point-in-Polygon 검사
        const userPoint = [parseFloat(longitude), parseFloat(latitude)];
        const matchedTerminal = TERMINAL_POLYGONS.find(t => isPointInPolygon(userPoint, t.polygon));

        if (matchedTerminal) {
            return res.status(200).json({ 
                is_inside: true, 
                terminal_code: matchedTerminal.code,
                terminal_name: matchedTerminal.name,
                fast_track_lane: matchedTerminal.fastTrackLane,
                message: `[${matchedTerminal.name}] 게이트 지오펜싱 진입 감지! RFID 패스트트랙 라인(${matchedTerminal.fastTrackLane})으로 진입하세요.`
            });
        }

        // 2. 2차 DB 공간 연산 폴백 (PostGIS 연결되어 있을 경우)
        try {
            if (pool && typeof pool.query === 'function') {
                const queryText = `
                    SELECT terminal_code 
                    FROM terminal_geofences 
                    WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326));
                `;
                const result = await pool.query(queryText, [longitude, latitude]);

                if (result && result.rows && result.rows.length > 0) {
                    const terminalCode = result.rows[0].terminal_code;
                    return res.status(200).json({ 
                        is_inside: true, 
                        terminal_code: terminalCode,
                        message: `차량이 [${terminalCode}] 터미널 지오펜스 영역에 진입했습니다.`
                    });
                }
            }
        } catch (dbErr) {
            // PostGIS 미가동 시 무시하고 진행
        }

        return res.status(200).json({ 
            is_inside: false, 
            message: '차량이 현재 어떤 터미널 지오펜스 영역에도 속해 있지 않습니다.'
        });

    } catch (error) {
        console.error('Geofencing check error:', error);
        res.status(500).json({ 
            message: 'Internal Server Error', 
            error: error.message 
        });
    }
};
