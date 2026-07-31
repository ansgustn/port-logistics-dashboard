import { useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { io } from 'socket.io-client';
import { 
  Activity, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Map as MapIcon, 
  Cpu, 
  Leaf, 
  X, 
  Bell, 
  Navigation,
  Video,
  FileText,
  Sparkles,
  Camera,
  Check,
  Download,
  Server,
  HardDrive,
  Zap,
  Wifi,
  Volume2,
  VolumeX
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PORT_PRESETS = {
  OVERVIEW: { longitude: 128.8105, latitude: 35.0815, zoom: 14, pitch: 45, bearing: 0 },
  PNIT: { longitude: 128.8010, latitude: 35.0780, zoom: 15.5, pitch: 50, bearing: 20 },
  PNC: { longitude: 128.8180, latitude: 35.0840, zoom: 15.5, pitch: 50, bearing: -10 },
  HJNC: { longitude: 128.8250, latitude: 35.0890, zoom: 15.5, pitch: 50, bearing: 15 },
  HPNT: { longitude: 128.7950, latitude: 35.0720, zoom: 15.5, pitch: 50, bearing: -25 },
};

const MAP_STYLES = {
  DARK: { name: '🌙 Dark', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  LIGHT: { name: '☀️ Light', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  COLOR: { name: '🗺️ Color', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
  OUTDOOR: { name: '🌲 Terrain', url: 'https://demotiles.maplibre.org/style.json' }
};

export default function PortDashboard() {
  const [trucks, setTrucks] = useState([]);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [viewState, setViewState] = useState(PORT_PRESETS.OVERVIEW);
  const [currentMapStyleKey, setCurrentMapStyleKey] = useState('DARK');
  const [selectedTerminalModal, setSelectedTerminalModal] = useState(null);
  const [cctvModalTerminal, setCctvModalTerminal] = useState(null);
  const [aiReportModalTerminal, setAiReportModalTerminal] = useState(null);
  const [isSystemHealthModalOpen, setIsSystemHealthModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState('CAM_GATE_A');
  const [eventLogs, setEventLogs] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showScatter, setShowScatter] = useState(true);
  const [isDispatchedToast, setIsDispatchedToast] = useState(false);

  const socketRef = useRef(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const playAlertChime = () => {
    if (!isAudioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio context policy ignored
    }
  };

  useEffect(() => {
    const socketUrl = import.meta.env.PROD ? undefined : 'http://localhost:3000';
    const socket = io(socketUrl);
    socketRef.current = socket;
    
    socket.on('truck_locations', (data) => {
      setTrucks(data);
      
      setHistoryData(prev => {
        const waitingCount = data.filter(t => t.status === 'WAITING').length;
        const movingCount = data.filter(t => t.status === 'MOVING').length;
        const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const newRecord = { time: timeStr, waiting: waitingCount, moving: movingCount };
        const newArray = [...prev, newRecord];
        return newArray.length > 20 ? newArray.slice(1) : newArray;
      });
    });

    const fetchAiPredictions = async () => {
      const terminals = ['PNIT', 'PNC', 'HJNC', 'HPNT'];
      try {
        const results = await Promise.all(terminals.map(async (code) => {
          const payload = {
            cargo_volume: Math.floor(1500 + Math.random() * 1500),
            temperature: 20.0,
            precipitation: 0,
            traffic_volume: Math.floor(100 + Math.random() * 600),
            terminal_code: code,
            day_of_week: "WED",
            time_block: "12-18"
          };
          const response = await fetch('/api/predict/wait-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          return await response.json();
        }));
        setAiPredictions(results);

        const severeItems = results.filter(r => r.status === '심각' || r.status === '혼잡');
        if (severeItems.length > 0) {
          const newEvents = severeItems.map(item => ({
            id: Date.now() + Math.random(),
            terminal: item.terminal_code,
            status: item.status,
            time: new Date().toLocaleTimeString(),
            message: `${item.terminal_code} 터미널 예상 대기시간 ${item.predicted_wait_time_minutes}분 (${item.status})`
          }));
          setEventLogs(prev => [...newEvents, ...prev].slice(0, 5));
        }
      } catch (error) {
        console.error("❌ AI Error:", error);
      }
    };

    fetchAiPredictions();
    const interval = setInterval(fetchAiPredictions, 10000); 

    return () => { 
      socket.disconnect(); 
      clearInterval(interval); 
    };
  }, []);

  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF터미널코드,예측대기시간(분),상태,예상탄소배출량(kg),활성차량수,생성시간\n';
    aiPredictions.forEach(ai => {
      csvContent += `${ai.terminal_code},${ai.predicted_wait_time_minutes},${ai.status},${ai.co2_emissions_kg || 0},${trucks.length},"${new Date().toLocaleString()}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `port_logistics_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const layers = [
    showHeatmap && new HeatmapLayer({
      id: 'heatmap-layer',
      data: trucks,
      getPosition: d => [d.longitude, d.latitude],
      getWeight: d => d.status === 'WAITING' ? 3 : 1,
      radiusPixels: 50,
      colorRange: [
        [25, 25, 112], [0, 0, 255], [0, 255, 255], [0, 255, 0], [255, 255, 0], [255, 0, 0]
      ]
    }),
    showScatter && new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: trucks,
      getPosition: d => [d.longitude, d.latitude],
      getFillColor: d => {
        if (d.status === 'BOTTLENECK' || d.status === 'WAITING') return [255, 50, 50, 230]; // 🔴 항만 게이트 병목 정체
        if (d.status === 'STOPPED_SIGNAL') return [255, 165, 0, 220]; // 🟠 단순 신호 대기
        return [50, 255, 50, 200]; // 🟢 정상 주행
      },
      getRadius: d => d.isReal ? 25 : 10,
      radiusMinPixels: 5,
      pickable: true
    })
  ].filter(Boolean);

  const glassStyle = {
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    color: '#f8fafc',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
  };

  const getTooltip = ({object}) => {
    if (!object) return null;
    let statusText = '🟢 정상 주행 중';
    if (object.status === 'STOPPED_SIGNAL') statusText = '🟠 단순 신호 대기 중 (30초 미만)';
    if (object.status === 'BOTTLENECK' || object.status === 'WAITING') statusText = '🔴 항만 게이트 병목 정체 중 (30초 이상)';

    let html = `<strong>🚚 차량 번호:</strong> ${object.truck_number || object.id}<br/>`;
    html += `<strong>👤 기사 성명:</strong> ${object.driver_name || '김항만'}<br/>`;
    html += `<strong>🏢 소속 운송사:</strong> ${object.company || '스마트 해운물류'}<br/>`;
    html += `<strong>📍 관제 상태:</strong> ${statusText}`;
    if (object.prediction) {
      html += `<br/><strong>예측 대기시간:</strong> ${object.prediction.predicted_wait_time_minutes}분`;
      html += `<br/><strong>탄소 배출량:</strong> ${object.prediction.co2_emissions_kg}kg`;
    }
    return { 
      html, 
      style: { 
        backgroundColor: '#0f172a', 
        color: '#f8fafc', 
        fontSize: '0.85rem', 
        padding: '12px 14px', 
        borderRadius: '12px', 
        border: '1px solid rgba(56, 189, 248, 0.4)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
      } 
    };
  };

  const handleApplyDispatch = () => {
    setIsDispatchedToast(true);
    playAlertChime();
    if (socketRef.current) {
      socketRef.current.emit('dispatch_action', {
        terminal_code: aiReportModalTerminal?.terminal_code || 'PNIT'
      });
    }
    setTimeout(() => setIsDispatchedToast(false), 4000);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#020617' }}>
      {/* 알림 토스트 */}
      {isDispatchedToast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          background: '#10b981', color: '#020617', fontWeight: 'bold', padding: '12px 24px',
          borderRadius: '16px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={20} /> AI 추천 조치 완료: 야드 트랙터 3대 패스트트랙 재배치 명령 전송!
        </div>
      )}
      
      {/* 맵 백그라운드 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <DeckGL 
          viewState={viewState} 
          onViewStateChange={({viewState}) => setViewState(viewState)} 
          controller={true} 
          layers={layers} 
          getTooltip={getTooltip}
        >
          <Map mapStyle={MAP_STYLES[currentMapStyleKey].url} />
        </DeckGL>
      </div>

      {/* ----------------- 상단 시점 컨트롤 & 레이어 필터 ----------------- */}
      <div style={{
        ...glassStyle,
        position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px' }}>
          <Navigation size={14} className="text-indigo-400" />
          <span>시점 프리셋:</span>
        </div>
        {Object.keys(PORT_PRESETS).map(key => (
          <button
            key={key}
            onClick={() => setViewState(PORT_PRESETS[key])}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#e2e8f0',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {key}
          </button>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px', paddingRight: '12px' }}>
          <MapIcon size={14} className="text-emerald-400" />
          <span>지도 스킨:</span>
        </div>
        {Object.keys(MAP_STYLES).map(key => (
          <button
            key={key}
            onClick={() => setCurrentMapStyleKey(key)}
            style={{
              background: currentMapStyleKey === key ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)',
              border: currentMapStyleKey === key ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: currentMapStyleKey === key ? '#6ee7b7' : '#e2e8f0',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {MAP_STYLES[key].name}
          </button>
        ))}

        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            style={{
              background: showHeatmap ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: showHeatmap ? '#a5b4fc' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            히트맵 {showHeatmap ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowScatter(!showScatter)}
            style={{
              background: showScatter ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: showScatter ? '#a5b4fc' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            차량 마커 {showScatter ? 'ON' : 'OFF'}
          </button>

          {/* 최종 3가지 기능: CSV 다운로드 & 시스템 헬스 */}
          <button
            onClick={handleDownloadCsv}
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#34d399',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Download size={13} /> 리포트 CSV
          </button>

          <button
            onClick={() => setIsSystemHealthModalOpen(true)}
            style={{
              background: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: '#c084fc',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Server size={13} /> 시스템 헬스
          </button>

          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            style={{
              background: isAudioEnabled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
              border: isAudioEnabled ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              color: isAudioEnabled ? '#f87171' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isAudioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            경보 음향 {isAudioEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* ----------------- 좌측 메인 사이드바 ----------------- */}
      <div className="left-panel" style={{
        ...glassStyle,
        position: 'absolute', top: 24, left: 24, bottom: 24, width: '360px',
        display: 'flex', flexDirection: 'column', padding: '24px', zIndex: 10,
        overflowY: 'auto', overflowX: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div style={{ padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '14px', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
            <Activity color="white" size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>스마트 항만 관제</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>PORT CONTROL CENTER</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', marginBottom: '6px' }}>
              <Truck size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>총 차량</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8' }}>{trucks.length}</div>
          </div>
          <div style={{ background: 'rgba(255,165,0,0.08)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,165,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', marginBottom: '6px' }}>
              <Clock size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>신호 대기</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24' }}>
              {trucks.filter(t => t.status === 'STOPPED_SIGNAL').length}
            </div>
          </div>
          <div style={{ background: 'rgba(255,50,50,0.08)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,50,50,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fb7185', marginBottom: '6px' }}>
              <AlertTriangle size={14} /> <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>게이트 병목</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fb7185' }}>
              {trucks.filter(t => t.status === 'BOTTLENECK' || t.status === 'WAITING').length}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <Activity size={16} className="text-indigo-400" /> 실시간 트래픽 추이
          </h3>
          <div style={{ height: '180px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', padding: '14px 14px 14px 0', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="colorWaiting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMoving" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} minTickGap={20} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc' }} />
                <Area type="monotone" dataKey="moving" stroke="#4ade80" fillOpacity={1} fill="url(#colorMoving)" name="이동 중" />
                <Area type="monotone" dataKey="waiting" stroke="#fb7185" fillOpacity={1} fill="url(#colorWaiting)" name="대기 중" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <h3 style={{ fontSize: '0.95rem', color: '#e2e8f0', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <MapIcon size={16} className="text-indigo-400" /> 모바일(PWA/iOS) 좌표 연동
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trucks.filter(t => t.isReal).length === 0 ? (
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                연결된 모바일 GPS 기기 수신 대기 중...
              </div>
            ) : (
              trucks.filter(t => t.isReal).map(truck => (
                <div key={truck.id} style={{ padding: '14px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{truck.truck_number || truck.id}</strong>
                    <span style={{ fontSize: '0.7rem', background: '#38bdf8', color: '#0f172a', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold' }}>LIVE</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 'bold', marginBottom: '4px' }}>
                    👤 {truck.driver_name || '김항만'} 기사
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal', marginLeft: '6px' }}>
                      ({truck.company || '스마트 해운물류'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                    <span>LAT: {truck.latitude.toFixed(5)}</span>
                    <span>LNG: {truck.longitude.toFixed(5)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ----------------- 우측 AI 예측 패널 ----------------- */}
      <div style={{
        ...glassStyle,
        position: 'absolute', top: 24, right: 24, width: '350px', padding: '24px', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu color="#a78bfa" size={22} />
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#e2e8f0', fontWeight: '700' }}>AI 터미널 예측</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {aiPredictions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>AI 예측 모델 로딩 중...</div>
          ) : (
            aiPredictions.map((ai, idx) => {
              const isSevere = ai.status === '심각';
              const isBusy = ai.status === '혼잡';
              const statusColor = isSevere ? '#fb7185' : (isBusy ? '#fbbf24' : '#4ade80');
              const StatusIcon = isSevere ? AlertTriangle : (isBusy ? Clock : CheckCircle);
              const barWidth = `${Math.min(100, (ai.predicted_wait_time_minutes / 60) * 100)}%`;

              return (
                <div 
                  key={idx} 
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.06)',
                    padding: '14px', 
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong 
                      onClick={() => setSelectedTerminalModal(ai)}
                      style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '800', cursor: 'pointer' }}
                    >
                      {ai.terminal_code}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: statusColor, fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <StatusIcon size={16} /> {ai.predicted_wait_time_minutes}분
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Leaf size={14} color="#4ade80" /> 탄소 배출량
                    </span>
                    <strong style={{ color: '#4ade80' }}>{ai.co2_emissions_kg ? ai.co2_emissions_kg.toLocaleString() : 0} kg</strong>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: barWidth, height: '100%', background: statusColor, transition: 'width 1s ease-in-out' }}></div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '4px' }}>
                    <button
                      onClick={() => setCctvModalTerminal(ai.terminal_code)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '8px', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 'bold',
                        padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Video size={13} /> CCTV 현장 뷰
                    </button>
                    <button
                      onClick={() => setAiReportModalTerminal(ai)}
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '8px', color: '#c084fc', fontSize: '0.75rem', fontWeight: 'bold',
                        padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <Sparkles size={13} /> AI 정체 분석
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ----------------- 하단 실시간 이벤트 알림 바 ----------------- */}
      {eventLogs.length > 0 && (
        <div style={{
          ...glassStyle,
          position: 'absolute', bottom: 24, right: 24, width: '380px', padding: '14px 18px', zIndex: 15,
          borderLeft: '4px solid #fb7185'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fb7185', fontWeight: 'bold', fontSize: '0.85rem' }}>
              <Bell size={16} className="animate-pulse" /> 실시간 터미널 정체 경고
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{eventLogs[0]?.time}</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: '600' }}>
            {eventLogs[0]?.message}
          </p>
        </div>
      )}

      {/* ----------------- 시스템 헬스 모니터링 모달 ----------------- */}
      {isSystemHealthModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            ...glassStyle,
            width: '100%', maxWidth: '540px', padding: '28px', position: 'relative'
          }}>
            <button
              onClick={() => setIsSystemHealthModalOpen(false)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(168,85,247,0.2)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Server size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>시스템 헬스 & 인프라 관제</h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>SYSTEM HEALTH & METRICS MONITORING</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={15} color="#4ade80" /> FastAPI ML Server Latency
                  </span>
                  <strong style={{ color: '#4ade80' }}>14 ms (정상)</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '15%', height: '100%', background: '#4ade80' }}></div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wifi size={15} color="#38bdf8" /> Socket.IO Active Truck Streams
                  </span>
                  <strong style={{ color: '#38bdf8' }}>{trucks.length} 대 (부하 테스트 연결 중)</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '85%', height: '100%', background: '#38bdf8' }}></div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HardDrive size={15} color="#a78bfa" /> MongoDB Connection & Buffer
                  </span>
                  <strong style={{ color: '#a78bfa' }}>PORT_LOGISTICS (CONNECTED)</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '32%', height: '100%', background: '#a78bfa' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- CCTV / 드론 3D 현장 스트리밍 모달 ----------------- */}
      {cctvModalTerminal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            ...glassStyle,
            width: '100%', maxWidth: '640px', padding: '24px', position: 'relative'
          }}>
            <button
              onClick={() => setCctvModalTerminal(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Camera size={22} className="text-indigo-400" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{cctvModalTerminal} 터미널 현장 실시간 모니터링</h2>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span> REC LIVE
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[
                { id: 'CAM_GATE_A', name: '게이트 A 진입로' },
                { id: 'CAM_YARD_CRANE', name: '야드 크레인 상차 구역' },
                { id: 'CAM_DRONE_TOP', name: '드론 상공 뷰' }
              ].map(cam => (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCamera(cam.id)}
                  style={{
                    background: selectedCamera === cam.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                    border: selectedCamera === cam.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', color: selectedCamera === cam.id ? '#a5b4fc' : '#94a3b8',
                    padding: '6px 12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  {cam.name}
                </button>
              ))}
            </div>

            <div style={{
              width: '100%', height: '300px', background: '#090d16', borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}></div>

              <div style={{ zIndex: 10, textAlign: 'center' }}>
                <Video size={48} className="text-indigo-400 animate-pulse" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 'bold' }}>
                  {cctvModalTerminal} - {selectedCamera} Stream Active
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                  FPS: 60.0 | Bitrate: 4.2 Mbps | Resolution: 1080p AI Vision Enabled
                </div>
              </div>

              <div style={{
                position: 'absolute', bottom: 12, left: 16, right: 16, zIndex: 10,
                display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace'
              }}>
                <span>CAM_ID: {selectedCamera}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- AI 정체 분석 & 배차 최적화 리포트 모달 ----------------- */}
      {aiReportModalTerminal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            ...glassStyle,
            width: '100%', maxWidth: '520px', padding: '28px', position: 'relative'
          }}>
            <button
              onClick={() => setAiReportModalTerminal(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(168,85,247,0.2)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.3)' }}>
                <Sparkles size={24} className="text-purple-400" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{aiReportModalTerminal.terminal_code} AI 정체 진단 리포트</h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>XGBOOST ANOMALY & DISPATCH OPTIMIZATION</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> 정체 주원인 분석 (Bottleneck Root Cause)
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  오후시간대 공컨테이너 반출 물량 급증(전일 대비 +82%) 및 B게이트 검수 지연으로 인해 터미널 진입 대기 트럭이 18대 이상 정체되었습니다.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>예상 정체 지속시간</span>
                  <strong style={{ fontSize: '1.4rem', color: '#fb7185' }}>
                    약 {aiReportModalTerminal.predicted_wait_time_minutes}분
                  </strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>탄소 절감 잠재량</span>
                  <strong style={{ fontSize: '1.4rem', color: '#4ade80' }}>
                    {aiReportModalTerminal.co2_emissions_kg} kg
                  </strong>
                </div>
              </div>

              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> AI 추천 최적 조치 (Action Plan)
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
                  야드 트랙터 3대를 A게이트 패스트트랙으로 즉시 분산 배치하여 대기시간을 65% 단축시킵니다.
                </p>

                <button
                  onClick={() => {
                    handleApplyDispatch();
                    setAiReportModalTerminal(null);
                  }}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none', color: '#fff', padding: '12px', borderRadius: '10px',
                    fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  [적용] 야드 트랙터 3대 추가 배차 승인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- 기존 터미널 상세 모달 ----------------- */}
      {selectedTerminalModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            ...glassStyle,
            width: '100%', maxWidth: '480px', padding: '28px', position: 'relative'
          }}>
            <button
              onClick={() => setSelectedTerminalModal(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                color: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(99,102,241,0.2)', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)' }}>
                <Cpu size={24} className="text-indigo-400" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{selectedTerminalModal.terminal_code} 터미널 상세 분석</h2>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>AI PREDICTION & GATE METRICS</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>예측 대기시간</span>
                  <strong style={{ fontSize: '1.5rem', color: selectedTerminalModal.status === '심각' ? '#fb7185' : '#4ade80' }}>
                    {selectedTerminalModal.predicted_wait_time_minutes}분
                  </strong>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>탄소 배출 절감 지표</span>
                  <strong style={{ fontSize: '1.5rem', color: '#4ade80' }}>
                    {selectedTerminalModal.co2_emissions_kg} kg
                  </strong>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#e2e8f0' }}>게이트별 대기 현황 (Gate Queue)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>GATE A (컨테이너 진입):</span>
                    <strong style={{ color: '#38bdf8' }}>원활 (대기 3대)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>GATE B (공컨테이너 반출):</span>
                    <strong style={{ color: '#fb7185' }}>혼잡 (대기 18대)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>GATE C (패스트트랙):</span>
                    <strong style={{ color: '#4ade80' }}>정상 (대기 1대)</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (PORT_PRESETS[selectedTerminalModal.terminal_code]) {
                    setViewState(PORT_PRESETS[selectedTerminalModal.terminal_code]);
                  }
                  setSelectedTerminalModal(null);
                }}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  border: 'none', color: '#fff', padding: '14px', borderRadius: '12px',
                  fontWeight: 'bold', cursor: 'pointer', marginTop: '10px'
                }}
              >
                해당 터미널로 카메라 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
