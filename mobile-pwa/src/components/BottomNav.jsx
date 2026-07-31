import { Home, Map, Calendar, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: '대시보드' },
    { id: 'map', icon: Map, label: '주행모드' },
    { id: 'reservation', icon: Calendar, label: '게이트예약' },
    { id: 'settings', icon: Settings, label: '설정' }
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-safe pt-2 px-6 flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            activeTab === tab.id ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'
          }`}
        >
          <tab.icon size={22} className={activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : ''} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
