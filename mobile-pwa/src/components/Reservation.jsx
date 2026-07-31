import { useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, QrCode, ChevronRight } from 'lucide-react';

export default function Reservation() {
  const [selectedTerminal, setSelectedTerminal] = useState('PNIT');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('14:00 - 15:00');
  const [reservation, setReservation] = useState(() => {
    try {
      const saved = localStorage.getItem('port_pwa_reservation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isConfirmedToast, setIsConfirmedToast] = useState(false);

  const terminals = ['PNIT', 'PNC', 'HJNC', 'HPNT'];
  const timeSlots = [
    { slot: '10:00 - 11:00', status: '원활', capacity: 85 },
    { slot: '11:00 - 12:00', status: '원활', capacity: 70 },
    { slot: '13:00 - 14:00', status: '혼잡', capacity: 40 },
    { slot: '14:00 - 15:00', status: '원활', capacity: 90 },
    { slot: '15:00 - 16:00', status: '혼잡', capacity: 30 },
    { slot: '16:00 - 17:00', status: '원활', capacity: 80 },
  ];

  const handleCreateReservation = () => {
    const newRes = {
      id: `RES-${Math.floor(100000 + Math.random() * 900000)}`,
      terminal: selectedTerminal,
      timeSlot: selectedTimeSlot,
      createdAt: new Date().toLocaleDateString('ko-KR'),
      fastTrackLane: 'GATE_A_FASTTRACK'
    };

    setReservation(newRes);
    localStorage.setItem('port_pwa_reservation', JSON.stringify(newRes));
    setIsConfirmedToast(true);
    setTimeout(() => setIsConfirmedToast(false), 3000);
  };

  const handleCancelReservation = () => {
    setReservation(null);
    localStorage.removeItem('port_pwa_reservation');
  };

  return (
    <div className="p-5 flex flex-col gap-6 pb-28 min-h-full bg-slate-950 text-slate-100">
      {/* 토스트 알림 */}
      {isConfirmedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 text-sm animate-bounce">
          <CheckCircle2 size={18} /> 터미널 패스트트랙 예약이 확정되었습니다!
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mt-4">
        <div className="bg-purple-500/20 p-2.5 rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
          <Calendar className="text-purple-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            게이트 방문 사전 예약
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-wide">GATE RESERVATION SYSTEM</p>
        </div>
      </div>

      {/* 이미 예약이 존재하는 경우 확정 티켓 표시 */}
      {reservation ? (
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-purple-500/30 p-6 rounded-3xl flex flex-col gap-5 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">RESERVATION TICKET</span>
              <h2 className="text-2xl font-black text-white mt-1">{reservation.terminal} 터미널</h2>
              <p className="text-xs text-slate-400 mt-0.5">예약번호: {reservation.id}</p>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1">
              <CheckCircle2 size={14} /> 예약 승인됨
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-slate-500 block mb-1">예약 시간대</span>
              <strong className="text-slate-200 text-sm">{reservation.timeSlot}</strong>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-slate-500 block mb-1">배정 차선</span>
              <strong className="text-indigo-400 text-sm">{reservation.fastTrackLane}</strong>
            </div>
          </div>

          {/* QR 코드 시뮬레이션 */}
          <div className="bg-slate-950/90 p-4 rounded-2xl border border-slate-800 flex flex-col items-center gap-2">
            <QrCode size={96} className="text-white" />
            <span className="text-[10px] text-slate-500 font-mono">게이트 무인 진입 시 QR 자동 스캔</span>
          </div>

          <button
            onClick={handleCancelReservation}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs"
          >
            예약 취소하기
          </button>
        </div>
      ) : (
        /* 신규 예약 신청 폼 */
        <div className="flex flex-col gap-5">
          {/* 1. 터미널 선택 */}
          <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold border-b border-slate-800/80 pb-3">
              <MapPin size={18} />
              <span>방문 터미널 선택</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {terminals.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTerminal(t)}
                  className={`p-3 rounded-2xl border text-sm font-bold transition-all flex items-center justify-between ${
                    selectedTerminal === t
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{t} 터미널</span>
                  {selectedTerminal === t && <CheckCircle2 size={16} className="text-purple-400" />}
                </button>
              ))}
            </div>
          </section>

          {/* 2. 시간대 선택 */}
          <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold border-b border-slate-800/80 pb-3">
              <Clock size={18} />
              <span>방문 희망 시간대 슬롯</span>
            </div>

            <div className="flex flex-col gap-2">
              {timeSlots.map((ts) => (
                <button
                  key={ts.slot}
                  onClick={() => setSelectedTimeSlot(ts.slot)}
                  className={`p-3.5 rounded-2xl border text-xs font-semibold transition-all flex justify-between items-center ${
                    selectedTimeSlot === ts.slot
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-sm">{ts.slot}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      ts.status === '원활' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {ts.status} (잔여 {ts.capacity}%)
                    </span>
                    <ChevronRight size={14} className="opacity-50" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 예약 버튼 */}
          <button
            onClick={handleCreateReservation}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 transition-all active:scale-98 text-base"
          >
            <Calendar size={20} /> 패스트트랙 예약 신청하기
          </button>
        </div>
      )}
    </div>
  );
}
