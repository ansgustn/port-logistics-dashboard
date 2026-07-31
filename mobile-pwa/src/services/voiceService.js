class VoiceService {
  constructor() {
    this.synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    this.lastSpokenText = '';
    this.lastSpokenTime = 0;
  }

  isSoundEnabled() {
    try {
      const saved = localStorage.getItem('port_pwa_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.notifySound !== false; // 기본값 true
      }
    } catch (e) {
      console.error('설정 읽기 오류', e);
    }
    return true;
  }

  speak(text, priority = false) {
    if (!this.synth || !this.isSoundEnabled()) return;

    // 동일 멘트 5초 이내 중복 출력 방지
    const now = Date.now();
    if (this.lastSpokenText === text && now - this.lastSpokenTime < 5000) {
      return;
    }

    if (priority) {
      this.synth.cancel(); // 진행 중인 음성 중단 후 즉시 재생
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    this.synth.speak(utterance);
  }

  speakGateApproach(terminalName) {
    this.speak(`목적지 ${terminalName} 게이트 300m 앞입니다. 패스트트랙 라인을 이용하세요.`, true);
  }

  speakCongestionDetour(terminalName, waitMinutes) {
    this.speak(`경고. ${terminalName} 터미널 예상 대기시간이 ${waitMinutes}분으로 지연되고 있습니다. 우회 경로를 확인하세요.`, true);
  }

  speakArrival(terminalName) {
    this.speak(`목적지 ${terminalName} 터미널 게이트에 무사히 도착했습니다. 운행을 종료합니다.`, true);
  }

  speakReroute(terminalName) {
    this.speak(`AI 관제 센터로부터 ${terminalName} 터미널 B게이트 우회 경로가 수신되었습니다. 경로를 재탐색합니다.`, true);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export default new VoiceService();
