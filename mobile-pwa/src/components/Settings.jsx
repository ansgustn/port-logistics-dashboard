import { useState } from 'react';
import { 
  User, 
  Truck, 
  Bell, 
  MapPin, 
  Wifi, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  Volume2, 
  Check, 
  Smartphone,
  Server,
  Layers
} from 'lucide-react';

export default function Settings() {
  // 기본 설정값 (localStorage 연동)
  const defaultSettings = {
    driverName: '김항만',
    truckNumber: '부산 88바 1234',
    company: '스마트 해운물류',
    preferredTerminal: 'PNIT',
    notifyGeofence: true,
    notifyWaitTime: true,
    notifySound: true,
    autoRoute: true,
    darkMode: true,
  };

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('port_pwa_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('port_pwa_settings', JSON.stringify(settings));
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.setItem('port_pwa_settings', JSON.stringify(defaultSettings));
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const terminals = ['PNIT', 'PNC', 'HJNC', 'HPNT'];

  return (
    <div className="p-5 flex flex-col gap-6 pb-28 min-h-full bg-slate-950 text-slate-100">
      {/* 토스트 알림 */}
      {isSavedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 text-sm animate-bounce">
          <Check size={18} /> 설정이 저장되었습니다!
        </div>
      )}

      {/* 타이틀 헤더 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/20 p-2.5 rounded-2xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Smartphone className="text-indigo-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              환경 설정
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">PWA DRIVER PREFERENCES</p>
          </div>
        </div>

        <button 
          onClick={handleReset}
          className="p-2 text-slate-500 hover:text-slate-300 active:scale-95 transition-all"
          title="설정 초기화"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* 1. 기사 및 차량 정보 */}
      <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold border-b border-slate-800/80 pb-3">
          <User size={18} />
          <span>기사 및 차량 프로필</span>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">기사 성명</label>
            <div className="relative">
              <input 
                type="text" 
                value={settings.driverName} 
                onChange={(e) => handleChange('driverName', e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors pl-9"
              />
              <User size={16} className="absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">차량 번호</label>
            <div className="relative">
              <input 
                type="text" 
                value={settings.truckNumber} 
                onChange={(e) => handleChange('truckNumber', e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors pl-9"
              />
              <Truck size={16} className="absolute left-3 top-3 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">소속 운송사</label>
            <input 
              type="text" 
              value={settings.company} 
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* 2. 주 운행 터미널 설정 */}
      <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold border-b border-slate-800/80 pb-3">
          <MapPin size={18} />
          <span>선호 터미널 지정</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {terminals.map((t) => (
            <button
              key={t}
              onClick={() => handleChange('preferredTerminal', t)}
              className={`p-3 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${
                settings.preferredTerminal === t
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span>{t} 터미널</span>
              {settings.preferredTerminal === t && <Check size={16} className="text-indigo-400" />}
            </button>
          ))}
        </div>
      </section>

      {/* 3. 알림 설정 */}
      <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold border-b border-slate-800/80 pb-3">
          <Bell size={18} />
          <span>실시간 알림 옵션</span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">지오펜싱 진입 자동 알림</span>
              <span className="text-xs text-slate-500">항만 게이트 진입 시 자동으로 통과 안내</span>
            </div>
            <button
              onClick={() => handleChange('notifyGeofence', !settings.notifyGeofence)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.notifyGeofence ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyGeofence ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-200">대기시간 정체 알림</span>
              <span className="text-xs text-slate-500">예측 대기시간이 30분 이상 시 팝업 경고</span>
            </div>
            <button
              onClick={() => handleChange('notifyWaitTime', !settings.notifyWaitTime)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.notifyWaitTime ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifyWaitTime ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/50 pt-3">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-slate-400" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-200">음성 & 진동 안내</span>
                <span className="text-xs text-slate-500">경로 및 게이트 안내 시 음성 출력</span>
              </div>
            </div>
            <button
              onClick={() => handleChange('notifySound', !settings.notifySound)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.notifySound ? 'bg-indigo-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.notifySound ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. 시스템 네트워크 및 연동 상태 */}
      <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-bold border-b border-slate-800/80 pb-3">
          <Server size={18} />
          <span>시스템 서버 연결 현황</span>
        </div>

        <div className="flex flex-col gap-2.5 text-xs">
          <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <Wifi size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">Node.js Express Backend</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
              연결됨 (3000)
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">FastAPI ML Prediction Engine</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
              연결됨 (8000)
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="font-semibold text-slate-300">MongoDB & PostGIS Geofencing</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
              정상 (27017)
            </span>
          </div>
        </div>
      </section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 transition-all active:scale-98 text-base"
      >
        <Save size={20} /> 설정 사항 저장하기
      </button>
    </div>
  );
}
