import axios from 'axios';

// FastAPI 서버 주소 (실서비스 배포 시 환경 변수에서 가져오는 것을 권장)
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000/api/predict/wait-time';

export const getTerminalWaitTime = async (req, res) => {
    try {
        // 클라이언트(React 또는 iOS)에서 보낸 데이터
        const { 
            cargo_volume, 
            temperature, 
            precipitation, 
            traffic_volume, 
            terminal_code, 
            day_of_week, 
            time_block 
        } = req.body;

        // FastAPI AI 서버로 예측 요청 전송 (Axios)
        const response = await axios.post(FASTAPI_URL, {
            cargo_volume: cargo_volume || 2500,        // 기본 더미값(Fallback) 맵핑
            temperature: temperature || 28.5,
            precipitation: precipitation || 0,
            traffic_volume: traffic_volume || 550,
            terminal_code: terminal_code || 'PNC',
            day_of_week: day_of_week || 'FRI',
            time_block: time_block || '12-18'
        });

        // AI 서버가 내려준 응답 결과
        const aiData = response.data;
        
        console.log(`[${aiData.terminal_code} 터미널] 예상 대기 시간: ${aiData.predicted_wait_time_minutes}분 (${aiData.status})`);
        
        // 최종적으로 클라이언트에게 JSON 응답 반환
        return res.status(200).json(aiData);

    } catch (error) {
        console.error("❌ AI 예측 서버 호출 실패:", error.message);
        return res.status(500).json({ 
            message: "AI 서버와의 통신 중 오류가 발생했습니다.", 
            error: error.message 
        });
    }
};
