import { useState, useEffect } from 'react';
import { MapPin, Navigation, Volume2, VolumeX, Gauge, Clock, AlertTriangle } from 'lucide-react';
import gpsService from '../services/gpsService';
import voiceService from '../services/voiceService';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';

import { io } from 'socket.io-client';

const MAP_STYLES = {
  DARK: { name: '🌙 다크', url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  LIGHT: { name: '☀️ 라이트', url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  COLOR: { name: '🗺️ 내비컬러', url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' }
};

const TERMINALS = {
  'PNIT': { lng: 128.805, lat: 35.090 },
  'PNC': { lng: 128.820, lat: 35.082 },
  'HJNC': { lng: 128.810, lat: 35.070 },
  'HPNT': { lng: 128.825, lat: 35.088 },
};

// Haversine 공식 기반 두 좌표 간의 실제 구면 거리(km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 꺾여 들어가는 우회로, 커브, U턴 등 전체 도로 노선(Polyline)의 실제 주행 거리 합산 (km)
function calculatePolylineDistance(coords) {
  if (!coords || coords.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    totalKm += haversineDistance(lat1, lon1, lat2, lon2);
  }
  return totalKm;
}

export default function NavigationMap({ selectedTerminal }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [truckId] = useState(() => {
    try {
      const saved = localStorage.getItem('port_pwa_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.truckNumber) return parsed.truckNumber;
      }
    } catch {
      // 기본값
    }
    return '부산 88바 1234';
  });

  const [currentPos, setCurrentPos] = useState({ lat: gpsService.currentLat, lng: gpsService.currentLng });
  const [bestTerminal, setBestTerminal] = useState(null);
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [rerouteMessage, setRerouteMessage] = useState(null);
  const [currentMapStyleKey, setCurrentMapStyleKey] = useState('DARK');

  // 관제 센터 우회 명령 수신 연동
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('dispatch_reroute', (data) => {
      setRerouteMessage(data.message);
      voiceService.speakReroute(data.terminal_code || 'PNIT');
      setTimeout(() => setRerouteMessage(null), 7000);
    });

    return () => socket.disconnect();
  }, []);

  // 1. 목적지 선정 (사용자 선택 우선, 없으면 AI 최적 추천)
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const terminals = Object.keys(TERMINALS);
        const results = await Promise.all(terminals.map(async (code) => {
          const payload = {
            cargo_volume: 2500, temperature: 28.5, precipitation: 0,
            traffic_volume: 550, terminal_code: code, day_of_week: "FRI", time_block: "12-18"
          };
          const response = await axios.post('http://localhost:3000/api/predict/wait-time', payload);
          return response.data;
        }));
        
        if (selectedTerminal) {
          const target = results.find(r => r.terminal_code === selectedTerminal);
          if (target) {
            setBestTerminal({ ...target, coords: TERMINALS[target.terminal_code] });
            return;
          }
        }
        
        results.sort((a, b) => a.predicted_wait_time_minutes - b.predicted_wait_time_minutes);
        setBestTerminal({ ...results[0], coords: TERMINALS[results[0].terminal_code] });
      } catch (error) {
        console.error("AI 예측 실패", error);
      }
    };
    fetchPredictions();
  }, [selectedTerminal]);

  // 2. 경로 초기화
  useEffect(() => {
    if (!bestTerminal) return;

    const fetchInitialRoute = async () => {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${gpsService.currentLng},${gpsService.currentLat};${bestTerminal.coords.lng},${bestTerminal.coords.lat}?overview=full&geometries=geojson`;
        const osrmRes = await axios.get(osrmUrl);
        
        if (osrmRes.data.routes && osrmRes.data.routes.length > 0) {
          const route = osrmRes.data.routes[0];
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.ceil(route.duration / 60)
          });
          
          gpsService.setRouteToFollow(bestTerminal.terminal_code, route.geometry.coordinates);
        }
      } catch (error) {
        console.error("경로 초기 획득 실패", error);
      }
    };

    fetchInitialRoute();
  }, [bestTerminal]);

  // 3. 주행 위치 업데이트 및 음성 안내 트리거
  useEffect(() => {
    gpsService.setListener((data) => {
      setCurrentPos({ lat: data.lat, lng: data.lng });

      if (isSimulating) {
        setSpeed(Math.floor(45 + Math.random() * 10)); // 주행 중 속도 생성
      } else {
        setSpeed(0);
      }

      if (data.isArrived) {
        setIsSimulating(false);
        setRouteGeojson(null);
        setRouteInfo(null);
        setSpeed(0);
        if (bestTerminal) {
          voiceService.speakArrival(bestTerminal.terminal_code);
        }
        return;
      }

      if (data.remainingCoords && data.remainingCoords.length > 1) {
        setRouteGeojson(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            geometry: {
              ...prev.geometry,
              coordinates: data.remainingCoords
            }
          };
        });
        
        // 꺾여 들어가는 실 주행 노선의 전체 누적 거리(km) 정밀 계산
        const actualRoadDistKm = calculatePolylineDistance(data.remainingCoords);
        const actualDurationMin = Math.max(1, Math.ceil((actualRoadDistKm / 45) * 60)); // 평균 45km/h 기준 주행시간

        // 게이트 접근 300m 이내 음성 안내
        if (actualRoadDistKm < 0.3 && bestTerminal) {
          voiceService.speakGateApproach(bestTerminal.terminal_code);
        }

        setRouteInfo({
          distance: actualRoadDistKm.toFixed(1),
          duration: actualDurationMin
        });
      }
    });

    return () => {
      if (isSimulating) gpsService.stopSimulation();
      gpsService.setListener(null);
    };
  }, [isSimulating, bestTerminal]);

  const toggleSimulation = () => {
    if (isSimulating) {
      gpsService.stopSimulation();
      setIsSimulating(false);
      setSpeed(0);
      voiceService.stop();
    } else {
      gpsService.startSimulation(truckId);
      setIsSimulating(true);
      if (bestTerminal) {
        voiceService.speak(`목적지 ${bestTerminal.terminal_code} 터미널로 경로 안내를 시작합니다.`);
      }
    }
  };

  const toggleMute = () => {
    if (isVoiceMuted) {
      setIsVoiceMuted(false);
      voiceService.speak("음성 가이던스가 켜졌습니다.");
    } else {
      setIsVoiceMuted(true);
      voiceService.stop();
    }
  };

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      {/* AI 관제 센터 우회 수신 팝업 */}
      {rerouteMessage && (
        <div className="absolute top-4 left-4 right-4 z-40 bg-purple-600/90 backdrop-blur-md text-white font-bold px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-400/40 flex items-center gap-3 animate-bounce">
          <AlertTriangle size={22} className="text-amber-300 shrink-0" />
          <span className="text-xs">{rerouteMessage}</span>
        </div>
      )}

      {/* 백그라운드 지도 */}
      <Map
        initialViewState={{
          longitude: 128.815,
          latitude: 35.080,
          zoom: 13.5,
          pitch: 45
        }}
        mapStyle={MAP_STYLES[currentMapStyleKey].url}
        style={{ width: '100%', height: '100%' }}
      >
        {/* 지도 스킨 변경 플로팅 스위처 */}
        <div className="absolute top-4 right-4 z-30 flex gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 shadow-lg">
          {Object.keys(MAP_STYLES).map(key => (
            <button
              key={key}
              onClick={() => setCurrentMapStyleKey(key)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                currentMapStyleKey === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {MAP_STYLES[key].name}
            </button>
          ))}
        </div>
        {/* 내 위치 마커 */}
        <Marker longitude={currentPos.lng} latitude={currentPos.lat} anchor="center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-8 bg-indigo-500 rounded-full opacity-30 animate-ping"></div>
            <div className="w-4 h-4 bg-indigo-500 border-2 border-white rounded-full relative z-10 shadow-lg"></div>
          </div>
        </Marker>

        {/* 목적지 터미널 마커 */}
        {bestTerminal && (
          <Marker longitude={bestTerminal.coords.lng} latitude={bestTerminal.coords.lat} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg mb-1 whitespace-nowrap">
                {bestTerminal.terminal_code}
              </div>
              <MapPin size={28} className="text-emerald-500 drop-shadow-md" fill="#10b981" color="white" />
            </div>
          </Marker>
        )}

        {/* 최적 경로 선 렌더링 */}
        {routeGeojson && (
          <Source id="route" type="geojson" data={routeGeojson}>
            <Layer 
              id="route-line" 
              type="line" 
              paint={{
                'line-color': '#6366f1', // indigo-500
                'line-width': 6,
                'line-opacity': 0.85,
                'line-dasharray': [2, 1]
              }} 
            />
          </Source>
        )}
      </Map>

      {/* ----------------- 상단 내비게이션 HUD 오버레이 ----------------- */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-3 pointer-events-none">
        {bestTerminal && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 p-4 rounded-3xl shadow-2xl pointer-events-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Navigation size={14} className="animate-spin" /> AI SMART PORT GUIDANCE
              </div>
              
              {/* 음성 토글 버튼 */}
              <button 
                onClick={toggleMute}
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl text-slate-300 transition-all active:scale-95"
              >
                {isVoiceMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-indigo-400" />}
              </button>
            </div>

            <div className="flex justify-between items-end border-b border-slate-800/80 pb-3">
              <div>
                <div className="text-xs text-slate-400 font-medium">목적지 터미널</div>
                <div className="text-2xl font-black text-white">{bestTerminal.terminal_code}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                  bestTerminal.status === '심각' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  <AlertTriangle size={12} /> {bestTerminal.status} ({bestTerminal.predicted_wait_time_minutes}분)
                </div>
              </div>
            </div>

            {/* 실시간 주행 HUD 메트릭 */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col items-center">
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Gauge size={12} className="text-indigo-400" /> 속도
                </div>
                <div className="text-lg font-black text-indigo-400">{speed} <span className="text-[10px] font-normal text-slate-400">km/h</span></div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col items-center">
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Navigation size={12} className="text-emerald-400" /> 잔여 거리
                </div>
                <div className="text-lg font-black text-emerald-400">{routeInfo ? routeInfo.distance : '0.0'} <span className="text-[10px] font-normal text-slate-400">km</span></div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/60 p-2 rounded-2xl flex flex-col items-center">
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Clock size={12} className="text-amber-400" /> 주행 시간
                </div>
                <div className="text-lg font-black text-amber-400">{routeInfo ? routeInfo.duration : '0'} <span className="text-[10px] font-normal text-slate-400">분</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ----------------- 하단 주행 컨트롤 ----------------- */}
      <div className="absolute bottom-20 left-0 w-full px-5 z-10">
        <button 
          onClick={toggleSimulation}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(99,102,241,0.3)] active:scale-98 ${
            isSimulating 
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
          }`}
        >
          {isSimulating ? (
            <>주행 중지 (Stop Simulation)</>
          ) : (
            <><Navigation size={20} /> 실시간 주행 가이던스 시작</>
          )}
        </button>
      </div>
    </div>
  );
}
