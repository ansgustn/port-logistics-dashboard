import { useState, useEffect } from 'react';
import { Clock, Navigation, AlertTriangle, Leaf, ChevronRight, Activity } from 'lucide-react';
import axios from 'axios';

export default function MobileDashboard({ setActiveTab, setSelectedTerminal }) {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleRouteClick = (terminalCode) => {
    setSelectedTerminal(terminalCode);
    setActiveTab('map');
  };

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const terminals = ['PNIT', 'PNC', 'HJNC', 'HPNT'];
        const results = await Promise.all(terminals.map(async (code) => {
          const payload = {
            cargo_volume: 2500,
            temperature: 28.5,
            precipitation: 0,
            traffic_volume: 550,
            terminal_code: code,
            day_of_week: "FRI",
            time_block: "12-18"
          };
          const response = await axios.post('http://localhost:3000/api/predict/wait-time', payload);
          return response.data;
        }));
        setPredictions(results);
        setIsLoading(false);
      } catch (error) {
        console.error("AI 데이터 페치 실패", error);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5 flex flex-col gap-5 pb-24 min-h-full bg-slate-950">
      <div className="flex items-center gap-3 mb-2 mt-4">
        <div className="bg-indigo-500/20 p-2.5 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Activity className="text-indigo-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            실시간 혼잡도
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">SMART PORT AI PREDICTION</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="text-sm text-slate-400 font-medium">AI 서버에서 예측 데이터를 분석 중입니다...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {predictions.map((ai, idx) => {
            const isSevere = ai.status === '심각';
            const isBusy = ai.status === '혼잡';
            
            // 프리미엄 테마 색상 설정
            const themeColor = isSevere ? 'rose' : (isBusy ? 'amber' : 'emerald');
            const shadowClass = isSevere ? 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' : (isBusy ? 'shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'shadow-[0_0_20px_rgba(16,185,129,0.1)]');
            const borderClass = isSevere ? 'border-rose-500/30' : (isBusy ? 'border-amber-500/30' : 'border-emerald-500/30');
            const bgClass = 'bg-gradient-to-br from-slate-900/90 to-slate-800/90';
            
            // 게이지 바 계산
            const percentage = Math.min(100, (ai.predicted_wait_time_minutes / 60) * 100);

            return (
              <div 
                key={idx} 
                className={`relative overflow-hidden backdrop-blur-xl border ${borderClass} p-5 rounded-3xl ${shadowClass} ${bgClass}`}
              >
                {/* 배경 글로우 효과 */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${themeColor}-500/10 blur-3xl rounded-full`}></div>

                <div className="relative z-10 flex flex-col gap-4">
                  {/* 상단: 타이틀 및 대기시간 */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-black text-white tracking-tight">{ai.terminal_code}</h2>
                      <div className={`flex items-center gap-1.5 text-xs font-bold mt-1 text-${themeColor}-400`}>
                        <AlertTriangle size={14} /> {ai.status} 상태
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`text-3xl font-black text-${themeColor}-400 flex items-baseline gap-1`}>
                        {ai.predicted_wait_time_minutes}
                        <span className="text-sm font-semibold text-slate-400">분</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> 예측 대기시간
                      </div>
                    </div>
                  </div>
                  
                  {/* 중앙: 프로그레스 바 */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <div className="w-full h-2.5 bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full bg-gradient-to-r from-${themeColor}-500 to-${themeColor}-400 rounded-full transition-all duration-1000 ease-out`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* 하단: ESG 뱃지 및 액션 버튼 */}
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">ESG Analysis</span>
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-emerald-400">
                        <Leaf size={14} className="animate-pulse" />
                        <span className="text-xs font-bold">{ai.co2_emissions_kg} kg</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleRouteClick(ai.terminal_code)}
                      className={`flex items-center gap-1.5 bg-${themeColor}-500/20 hover:bg-${themeColor}-500/30 text-${themeColor}-400 border border-${themeColor}-500/30 px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95`}
                    >
                      <Navigation size={16} /> 경로 안내 <ChevronRight size={16} className="opacity-50" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
