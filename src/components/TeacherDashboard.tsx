import React, { useState, useEffect, useRef } from "react";
import { Participant, STICKER_LIST } from "../types";
import { sounds } from "../utils/audio";
import { Trash2, UserPlus, Award, Zap, Printer, Compass, Sparkles, Volume2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GreenTrashTruck from "./GreenTrashTruck";

interface TeacherDashboardProps {
  participants: Participant[];
  onAddParticipant: (name: string) => void;
  onClearData: () => void;
  onClose: () => void;
}

export default function TeacherDashboard({ participants, onAddParticipant, onClearData, onClose }: TeacherDashboardProps) {
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Participant | null>(null);
  const [classGoal, setClassGoal] = useState(() => {
    const saved = localStorage.getItem("class_goal_target");
    return saved ? parseInt(saved, 10) : 500;
  });
  
  // Interactive festival/celebration screens
  const [activeFesta, setActiveFesta] = useState<null | "fireworks" | "dance" | "festival">(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute stats
  const totalStudents = participants.length;
  const totalScans = participants.reduce((acc, p) => acc + (p.scanCount || 0), 0);
  const totalCaptures = participants.reduce((acc, p) => acc + (p.captureCount || 0), 0);
  const totalClassScore = participants.reduce((acc, p) => acc + (p.totalScore || 0), 0);
  const goalProgressPercent = Math.min(100, Math.round((totalClassScore / classGoal) * 100));

  // Handle adding student
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    onAddParticipant(newStudentName.trim());
    setNewStudentName("");
    sounds.playPop();
  };

  // Adjust goal trigger
  const updateClassGoal = (val: number) => {
    setClassGoal(val);
    localStorage.setItem("class_goal_target", val.toString());
  };

  // Printing Certificate Routine
  const triggerPrint = (student: Participant) => {
    sounds.playChime();
    
    // Create temporary hidden div formatted for print
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("팝업이 차단되었습니다! 브라우저 팝업 허용을 활성화 해주세요.");
      return;
    }

    const titleMilestone = student.totalScore < 30 ? "우수 리사이클 새싹" :
                           student.totalScore < 70 ? "천재 리사이클 박사" : "땅별 지구 환경 영웅";

    const htmlContent = `
      <html>
        <head>
          <title>${student.name} - 환경 영웅 인증서</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Gothic+A1:wght@450;700;900&display=swap');
            body { 
              font-family: 'Gothic A1', sans-serif; 
              margin: 0; 
              padding: 40px; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              background-color: #f8fafc;
            }
            .certificate-border {
              border: 12px double #eab308;
              padding: 50px;
              width: 800px;
              background-color: #ffffff;
              box-shadow: 0 4px 15px rgba(0,0,0,0.06);
              border-radius: 4px;
              position: relative;
              text-align: center;
              box-sizing: border-box;
            }
            .certificate-border::before {
              content: "";
              position: absolute;
              top: 10px; bottom: 10px; left: 10px; right: 10px;
              border: 2px solid #eab308;
              pointer-events: none;
            }
            .stamp {
              position: absolute;
              bottom: 40px;
              right: 60px;
              width: 100px;
              height: 100px;
              border: 3px dashed #ef4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(-12deg);
              color: #ef4444;
              font-weight: 900;
              font-size: 15px;
            }
            h1 { font-size: 42px; margin-bottom: 5px; color: #1e293b; font-weight: 900; }
            h2 { font-size: 20px; color: #ca8a04; margin-top: 0; letter-spacing: 2px; }
            .details { margin: 40px 0; font-size: 18px; line-height: 1.8; color: #334155; }
            .badge { font-size: 24px; color: #1e3a8a; font-weight: bold; margin-bottom: 25px; }
            .date { margin-top: 50px; font-size: 14px; color: #64748b; }
            .star-decoration { font-size: 32px; color: #facc15; }
          </style>
        </head>
        <body>
          <div class="certificate-border">
            <div class="star-decoration">✨ ⭐ ✨</div>
            <h1>환 경 영 웅 인 증 서</h1>
            <h2>ECO HERO CERTIFICATE</h2>
            <div class="badge">제 ${student.id.substring(0, 5).toUpperCase()} 호</div>
            
            <div class="details">
              이름: <strong>${student.name}</strong><br>
              획득 에너지 점수: <strong>${student.totalScore} ⚡ 에너지고</strong><br><br>
              위 어린이는 <strong>땅별마을 분리수거 챌린지</strong>에 성실히 참여하여<br>
              교실 속 버려진 페트병과 우유갑을 올바르게 구별하고 촬영하였으며,<br>
              AR 쓰레기 괴물을 용감히 포획하여 마을의 쓰레기차를 충전시켰기에<br>
              이 아름다운 <strong>'${titleMilestone}'</strong> 칭호와 함께 인증서를 수여합니다.
            </div>

            <div class="date">
              수여 일자: ${new Date().toLocaleDateString('ko-KR')}<br><br>
              <span style="font-size: 16px; font-weight: bold; color: #0284c7;">🌍 땅별마을 달님 및 지킴이 대장 일동 복창</span>
            </div>

            <div class="stamp">
              달님<br>참잘했어요!
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </scrip>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Firework canvas animation routine
  useEffect(() => {
    if (activeFesta !== "fireworks") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; color: string; alpha: number; life: number }[] = [];
    const colors = ["#facc15", "#f43f5e", "#3b82f6", "#10b981", "#a855f7", "#ec4899"];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const setupFireworks = () => {
      // Create random explosion nodes
      if (Math.random() < 0.05) {
        sounds.playPop();
        const originX = Math.random() * canvas.width;
        const originY = Math.random() * (canvas.height * 0.6);
        const col = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1 + Math.random() * 5;
          particles.push({
            x: originX,
            y: originY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: col,
            alpha: 1,
            life: 40 + Math.random() * 30
          });
        }
      }
    };

    const draw = () => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setupFireworks();

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity
        p.life -= 1;
        p.alpha = Math.max(0, p.life / 60);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      particles = particles.filter(p => p.life > 0);
      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeFesta]);

  // Upbeat sounds for dance
  useEffect(() => {
    let playTimer: any;
    if (activeFesta === "dance" || activeFesta === "festival") {
      playTimer = setInterval(() => {
        sounds.playChime();
      }, 1500);
    }
    return () => clearInterval(playTimer);
  }, [activeFesta]);

  return (
    <div id="teacher-dashboard" className="fixed inset-0 z-50 bg-slate-900/98 backdrop-blur-md flex flex-col overflow-y-auto text-white">
      
      {/* Header */}
      <div className="bg-slate-850 px-6 py-5 border-b border-indigo-500/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Award className="text-yellow-450" size={32} />
          <div>
            <h2 className="text-2xl font-black text-white font-sans tracking-tight">교사용 학급 지휘본부 🏫</h2>
            <p className="text-xs text-slate-400">우리반 아이들의 환경 보호 교육 데이터 저장 상태 및 축제 기획소</p>
          </div>
        </div>
        <button
          onClick={onClose}
          id="btn-close-teacher"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:text-yellow-455 rounded-full text-xs font-extrabold transition"
        >
          챌린지 메인화면으로
        </button>
      </div>

      <div className="max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Statistics and Goals Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Class cumulative highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">우리반 참여 아동</span>
              <p className="text-3xl font-black text-yellow-350 mt-1">{totalStudents}명</p>
            </div>
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">사진 촬영 성공</span>
              <p className="text-3xl font-black text-emerald-350 mt-1">{totalScans}회</p>
            </div>
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">괴물 포획 퇴장</span>
              <p className="text-3xl font-black text-cyan-350 mt-1">{totalCaptures}회</p>
            </div>
            <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/10 text-center">
              <span className="text-indigo-400 text-[10px] uppercase font-bold tracking-wider">학급 총합 에너지</span>
              <p className="text-3xl font-black text-indigo-300 mt-1 animate-pulse">{totalClassScore}⚡</p>
            </div>
          </div>

          {/* School collective meters */}
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-200 inline-flex items-center space-x-1.5 Siegfried">
                  <span>🎯 학급 공동 에너지 목표 게이지</span>
                </h3>
                <p className="text-xs text-slate-400">학급 총합이 {classGoal}⚡에 도달하면 어린이 보상 대축제가 해금돼요!</p>
              </div>

              {/* Toggle goals goals selection */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 px-1 font-semibold">목표 변경:</span>
                {[200, 500, 1000].map((goalVal) => (
                  <button
                    key={goalVal}
                    onClick={() => { sounds.playPop(); updateClassGoal(goalVal); }}
                    className={`px-2.5 py-1 rounded font-bold ${
                      classGoal === goalVal ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {goalVal}⚡
                  </button>
                ))}
              </div>
            </div>

            {/* Custom high-fidelity collective goal bar */}
            <div className="relative h-10 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex items-center px-4">
              <div
                style={{ width: `${goalProgressPercent}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
              />
              <div className="relative z-10 flex items-center justify-between w-full font-bold font-mono text-sm leading-none">
                <span className="text-white drop-shadow">학급 누적: {totalClassScore} / {classGoal} 에너지고</span>
                <span className="text-yellow-300 drop-shadow">{goalProgressPercent}% 충전 완료!</span>
              </div>
            </div>

            {/* Locked Rewards Alert */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  sounds.playPop();
                  if (goalProgressPercent < 100) {
                    sounds.playFail();
                    alert("공동 목표 100% 충전 시에만 시작할 수 있어요! 분리수거 점수를 더 쌓아주세요.");
                  } else {
                    setActiveFesta("festival");
                  }
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition ${
                  goalProgressPercent >= 100 
                    ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-500 hover:scale-103 text-yellow-300"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed"
                }`}
              >
                <div>
                  <span className="font-extrabold block text-xs">🎉 땅별마을 대축제</span>
                  <span className="text-[10px] opacity-80">어린이집 우렁찬 축하 음원</span>
                </div>
                <span className="text-xl">{goalProgressPercent >= 100 ? "🔓" : "🔒"}</span>
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  if (goalProgressPercent < 100) {
                    sounds.playFail();
                    alert("공동 목표 100% 충전 시에만 시작할 수 있어요! 분리수거 점수를 더 쌓아주세요.");
                  } else {
                    setActiveFesta("fireworks");
                  }
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition ${
                  goalProgressPercent >= 100 
                    ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-cyan-500 hover:scale-103 text-cyan-350"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed"
                }`}
              >
                <div>
                  <span className="font-extrabold block text-xs font-sans">🎆 달님 불꽃놀이 쇼</span>
                  <span className="text-[10px] opacity-80">가상 밤하늘 폭죽 클리커</span>
                </div>
                <span className="text-xl">{goalProgressPercent >= 100 ? "🔓" : "🔒"}</span>
              </button>

              <button
                onClick={() => {
                  sounds.playPop();
                  if (goalProgressPercent < 100) {
                    sounds.playFail();
                    alert("공동 목표 100% 충전 시에만 시작할 수 있어요! 분리수거 점수를 더 쌓아주세요.");
                  } else {
                    setActiveFesta("dance");
                  }
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl text-left border transition ${
                  goalProgressPercent >= 100 
                    ? "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border-fuchsia-500 hover:scale-103 text-fuchsia-300"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed"
                }`}
              >
                <div>
                  <span className="font-extrabold flex items-center gap-1 text-xs">
                    <GreenTrashTruck size={16} /> 쓰레기차 댄스 타임
                  </span>
                  <span className="text-[10px] opacity-80">춤추는 로봇 쓰레기차</span>
                </div>
                <span className="text-xl">{goalProgressPercent >= 100 ? "🔓" : "🔒"}</span>
              </button>
            </div>
          </div>

          {/* Student scores management lists */}
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-200 mb-4 block">👩‍🏫 우리반 어린이상 상세 일람표</h3>
            
            {participants.length === 0 ? (
              <div className="text-center py-10 bg-slate-900 rounded-xl text-slate-500 text-xs">
                아직 등록된 어린이가 없어요! 우측 간편 등록기로 첫 아동을 추가해보세요.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5">어린이 이름</th>
                      <th>성공 촬영 횟수</th>
                      <th>괴물 방출 사냥</th>
                      <th>누적 에너지</th>
                      <th>지급 스티커 수</th>
                      <th className="text-right">환경 영웅 상장</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((student) => (
                      <tr key={student.id} className="border-b border-slate-800/55 hover:bg-slate-800 transition">
                        <td className="py-3 font-bold text-white text-sm">{student.name}</td>
                        <td className="text-slate-350">{student.scanCount || 0}회</td>
                        <td className="text-slate-350">{student.captureCount || 0}마리</td>
                        <td>
                          <span className="px-2 py-0.5 bg-yellow-450/15 text-yellow-350 font-bold rounded-full font-mono">
                            {student.totalScore}⚡
                          </span>
                        </td>
                        <td className="text-slate-400">{student.unlockedStickers?.length || 0}개/4개</td>
                        <td className="text-right">
                          <button
                            onClick={() => triggerPrint(student)}
                            id={`btn-print-certificate-${student.id}`}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg font-bold transition text-[11px]"
                          >
                            <Printer size={12} />
                            <span>인증서 출력</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          
          {/* Quick Registration Form */}
          <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-slate-200 mb-3 block flex items-center space-x-1">
              <UserPlus size={16} className="text-indigo-400" />
              <span>새로운 어린이 추가하기</span>
            </h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <input
                type="text"
                placeholder="예: 민우, 서연, 지효"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                maxLength={8}
                className="w-full bg-slate-900 border border-slate-750 p-3 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-bold"
              />
              <button
                type="submit"
                id="btn-add-student"
                className="w-full py-2.5 bg-yellow-450 hover:bg-yellow-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                반 아동 목록에 추가
              </button>
            </form>
          </div>

          {/* Reset database options */}
          <div className="bg-slate-855 p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider block flex items-center space-x-1">
              <ShieldAlert size={14} />
              <span>초기화 설정</span>
            </h3>
            <p className="text-[11px] text-slate-400 mb-3 leading-normal">
              이전 수업에서 쌓인 아동 점수판이나 기록을 한 번에 깨끗이 청소하고 리셋하려면 아래 버튼을 누르세요.
            </p>
            <button
              onClick={() => {
                if (confirm("정말 모든 학생 정보와 분리수거 점수 등 전체 캐시 데이터를 처음부터 완전히 영구 삭제하시겠습니까?")) {
                  sounds.playFail();
                  onClearData();
                }
              }}
              id="btn-clear-db"
              className="w-full py-2 bg-red-950/40 text-red-400 border border-red-900/30 font-semibold hover:bg-red-900 hover:text-white rounded-lg text-xs transition text-center block"
            >
              학급 모든 데이터 영구 초기화
            </button>
          </div>

        </div>

      </div>

      {/* Full-Screen Festa celebration modal */}
      <AnimatePresence>
        {activeFesta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-55 bg-slate-950 flex flex-col items-center justify-center text-white"
          >
            {activeFesta === "fireworks" && (
              <>
                <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full cursor-pointer" />
                
                {/* Visual HUD */}
                <div className="relative z-20 text-center pointer-events-none select-none px-6">
                  <span className="text-6xl animate-bounce block">🎆</span>
                  <h4 className="text-3xl font-black text-yellow-300 mt-2 font-sans">달님 불꽃놀이 대축제 밤하늘 🌟</h4>
                  <p className="text-slate-350 text-xs mt-1 mb-8 max-w-sm mx-auto">
                    밤하늘을 빈틈없이 채워가며 소리 내는 화려한 불꽃놀이 퐁퐁퐁! 화면의 빈 곳을 마우스나 클릭 등으로 탭하면 그 자리에 우렁찬 탄성이 쏘아 올라갑니다!
                  </p>
                  
                  <button
                    onClick={() => { sounds.playPop(); setActiveFesta(null); }}
                    className="pointer-events-auto px-6 py-2.5 bg-white text-slate-900 font-bold rounded-full text-xs shadow-xl active:scale-95 transition"
                  >
                    축제 축소하여 돌아가기
                  </button>
                </div>
              </>
            )}

            {activeFesta === "dance" && (
              <div className="text-center relative max-w-lg px-6">
                {/* Dancing truck layout */}
                <div className="relative w-48 h-48 mx-auto flex items-center justify-center mb-6">
                  <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full scale-125 animate-pulse" />
                  
                  {/* Visual mechanical cute truck rotating and swinging gently without bouncing */}
                  <div className="w-32 h-28 animate-pulse filter drop-shadow-xl select-none duration-130 transform rotate-6 scale-110">
                    <GreenTrashTruck size="100%" />
                  </div>
                  <div className="absolute top-0 right-0 text-3xl animate-ping text-yellow-450 font-black">⚡</div>
                  <div className="absolute bottom-2 left-0 text-3xl animate-pulse text-pink-500">❤️</div>
                </div>

                <h4 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">
                  신나는 쓰레기차 댄싱 타임! 🕺
                </h4>
                <p className="text-xs text-slate-300 mt-2 mb-8 leading-relaxed">
                  "부릉부릉! 삐뽀삐뽀! 에너지가 100% 꽉 차 부풀어 오른 쓰레기차가 고맙다고 엉덩이를 씰룩쌜룩 흔들며 춤을 추고 있어요! 야호!"
                </p>

                <button
                  onClick={() => { sounds.playPop(); setActiveFesta(null); }}
                  className="px-6 py-2.5 bg-slate-800 text-yellow-400 hover:bg-slate-705 border border-slate-750 font-bold rounded-full text-xs transition"
                >
                  댄스 종료하기
                </button>
              </div>
            )}

            {activeFesta === "festival" && (
              <div className="text-center max-w-lg px-6 relative">
                {/* Interactive colorful banner */}
                <div className="text-7xl mb-4 animate-spin duration-1000">🎪</div>
                <h4 className="text-3xl font-black text-yellow-300">🎉 땅별마을 영웅 대축제 어클락!</h4>
                
                <div className="my-6 space-y-2 py-4 px-6 bg-slate-900 rounded-xl border border-slate-800 max-h-[160px] overflow-y-auto">
                  <p className="text-xs font-semibold text-emerald-400">🏅 명예의 전당 점수 순위판:</p>
                  {participants.slice(0, 5).map((p, index) => (
                    <div key={p.id} className="flex justify-between text-xs text-slate-300">
                      <span>{index + 1}등. {p.name} 어린이</span>
                      <span className="font-bold font-mono">{p.totalScore} ⚡</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-350 leading-relaxed mb-8">
                  땅별마을에 쌓여있던 우는 까까 비닐지들과 불만 가득 괴물들이 모두 소멸되고 온 마을이 깨끗한 초록 동산으로 회복되었습니다! 모두 축하의 박수짝짝짝! 👏👏
                </p>

                <button
                  onClick={() => { sounds.playPop(); setActiveFesta(null); }}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-full text-xs transition shadow-lg"
                >
                  명예의 축제 마감하기
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
