import { useState } from 'react';
import MobileDashboard from './components/MobileDashboard';
import NavigationMap from './components/NavigationMap';
import Reservation from './components/Reservation';
import Settings from './components/Settings';
import BottomNav from './components/BottomNav';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTerminal, setSelectedTerminal] = useState(null);

  return (
    <div className="w-full h-[100dvh] relative overflow-hidden bg-slate-950">
      {/* 화면 내용 렌더링 */}
      <div className="w-full h-full pb-[60px] overflow-y-auto">
        {activeTab === 'dashboard' && (
          <MobileDashboard 
            setActiveTab={setActiveTab} 
            setSelectedTerminal={setSelectedTerminal} 
          />
        )}
        {activeTab === 'map' && (
          <NavigationMap 
            selectedTerminal={selectedTerminal} 
          />
        )}
        {activeTab === 'reservation' && (
          <Reservation />
        )}
        {activeTab === 'settings' && (
          <Settings />
        )}
      </div>

      {/* 하단 탭 네비게이션 */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
