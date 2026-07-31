// 부산신항 내 100% 실 육상 도로망 (Line Segments)
const ROUTES = [
    { start: [128.8000, 35.0910], end: [128.8120, 35.0910] }, // PNIT 남측 육상 게이트 진입로
    { start: [128.8150, 35.0950], end: [128.8300, 35.0950] }, // PNC 북측 배후 육상도로 (신항북로)
    { start: [128.8000, 35.1000], end: [128.8250, 35.1000] }, // 웅동 배후단지 육상도로 (계발로)
    { start: [128.8300, 35.0820], end: [128.8400, 35.0850] }  // HJNC 동측 육상도로
];

/**
 * 점 P에서 선분 AB로의 최단 수선의 발(Projected Point)을 구하는 로직
 */
function projectPointOnLineSegment(P, A, B) {
    const AP = [P[0] - A[0], P[1] - A[1]];
    const AB = [B[0] - A[0], B[1] - A[1]];
    
    const abSquared = AB[0] * AB[0] + AB[1] * AB[1];
    if (abSquared === 0) return { projectedPoint: A, distance: calculateDistance(P, A) };

    let t = (AP[0] * AB[0] + AP[1] * AB[1]) / abSquared;
    t = Math.max(0, Math.min(1, t));
    
    const projectedPoint = [A[0] + t * AB[0], A[1] + t * AB[1]];
    const distance = calculateDistance(P, projectedPoint);
    
    return { projectedPoint, distance };
}

function calculateDistance(p1, p2) {
    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

/**
 * 원시 GPS 위경도를 받아 가장 가까운 육상 도로망(ROUTES) 선분 위로 강제로 보정(Snapping)
 */
function snapToRoad(lng, lat) {
    const P = [lng, lat];
    let minDistance = Infinity;
    let bestPoint = [...P];

    for (const route of ROUTES) {
        const { projectedPoint, distance } = projectPointOnLineSegment(P, route.start, route.end);
        if (distance < minDistance) {
            minDistance = distance;
            bestPoint = projectedPoint;
        }
    }
    
    return bestPoint;
}

export {
    ROUTES,
    snapToRoad
};
