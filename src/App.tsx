import React, { useState, useEffect } from "react";
import { Participant, GameMode, TrashScanResult, VSPlayer, STICKER_LIST } from "./types";
import { sounds } from "./utils/audio";
import ClassroomExplorer from "./components/ClassroomExplorer";
import MonsterHunt from "./components/MonsterHunt";
import TeacherDashboard from "./components/TeacherDashboard";
import StickerBook from "./components/StickerBook";
import GreenTrashTruck from "./components/GreenTrashTruck";
import { 
  Trophy, Award, Users, Trash2, Camera, ShieldAlert, Sparkles, 
  Trash, Heart, Play, RefreshCw, Zap, Volume2, User
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-populate empty array so the user can add custom children in the app!
const DEFAULT_STUDENTS: Participant[] = [];

export default function App() {
  // Game control states
  const [gameMode, setGameMode] = useState<GameMode>("INTRO");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string>("");
  const [truckEnergy, setTruckEnergy] = useState<number>(10); // Standard single-player battery level range 0-100
  const [scannedTrash, setScannedTrash] = useState<TrashScanResult | null>(null);

  // Sound and music toggle helper
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 2-Player Versus Mode specific states
  const [vsPhase, setVsPhase] = useState<"INTRO" | "P1_GO" | "P2_INTRO" | "P2_GO" | "FINAL_RESULTS" | null>(null);
  const [p1State, setP1State] = useState<VSPlayer>({ name: "플레이어 1", score: 0, scanCount: 0, captureCount: 0 });
  const [p2State, setP2State] = useState<VSPlayer>({ name: "플레이어 2", score: 0, scanCount: 0, captureCount: 0 });
  const [vsTimer, setVsTimer] = useState<number>(30);
  const [vsActiveMonsters, setVsActiveMonsters] = useState<{ id: string; x: number; y: number; type: string; speedX: number; speedY: number }[]>([]);

  // Load from local Cache at start ("브라우저 캐시에 남아서 사라지지 않게 해줘")
  useEffect(() => {
    // Participants
    const savedParticipants = localStorage.getItem("earth_star_recycling_participants");
    if (savedParticipants) {
      try {
        const parsed = JSON.parse(savedParticipants);
        setParticipants(parsed);
        if (parsed.length > 0) {
          setActiveStudentId(parsed[0].id);
        } else {
          setActiveStudentId("");
        }
      } catch (e) {
        setParticipants(DEFAULT_STUDENTS);
        setActiveStudentId(DEFAULT_STUDENTS.length > 0 ? DEFAULT_STUDENTS[0].id : "");
      }
    } else {
      // Empty, load pre-populate
      setParticipants(DEFAULT_STUDENTS);
      setActiveStudentId(DEFAULT_STUDENTS.length > 0 ? DEFAULT_STUDENTS[0].id : "");
      localStorage.setItem("earth_star_recycling_participants", JSON.stringify(DEFAULT_STUDENTS));
    }

    // Truck energy level
    const savedEnergy = localStorage.getItem("earth_star_recycling_truck_energy");
    if (savedEnergy) {
      setTruckEnergy(parseInt(savedEnergy, 10));
    } else {
      setTruckEnergy(10);
      localStorage.setItem("earth_star_recycling_truck_energy", "10");
    }
  }, []);

  // Save participants helper
  const saveParticipantsToCache = (updatedList: Participant[]) => {
    setParticipants(updatedList);
    localStorage.setItem("earth_star_recycling_participants", JSON.stringify(updatedList));
  };

  // Switch truck energy and sync cache
  const updateTruckEnergy = (newVal: number) => {
    const capped = Math.min(100, Math.max(0, newVal));
    setTruckEnergy(capped);
    localStorage.setItem("earth_star_recycling_truck_energy", capped.toString());
  };

  // Active student playing
  const currentStudent = participants.find(p => p.id === activeStudentId) || null;

  // Add a new child
  const handleAddParticipant = (name: string) => {
    const newKid: Participant = {
      id: `stud-${Date.now()}`,
      name: `${name} 🌟`,
      scanCount: 0,
      captureCount: 0,
      totalScore: 0,
      unlockedStickers: [],
      createdAt: new Date().toISOString()
    };
    const updated = [...participants, newKid];
    saveParticipantsToCache(updated);
    setActiveStudentId(newKid.id);
  };

  // Clear overall scores database cache
  const handleClearDatabase = () => {
    localStorage.removeItem("earth_star_recycling_participants");
    localStorage.removeItem("earth_star_recycling_truck_energy");
    setParticipants([]);
    setActiveStudentId("");
    setTruckEnergy(0);
    sounds.playFail();
  };

  // STEP 3: Complete scan -> receive energy -> launch AR Monster Mode
  const handleClassomScanSuccess = (result: TrashScanResult) => {
    sounds.playPop();
    setScannedTrash(result);
    
    // Scale the scanned trash points to a balanced contribution for 13 kids (e.g. +3% max per scan)
    const rawPoints = result.recyclable ? result.points : 0;
    const addedProgress = result.recyclable ? 3 : 0; // +3% energy progress
    updateTruckEnergy(truckEnergy + addedProgress);

    // Update active student scan count
    if (currentStudent) {
      const updated = participants.map((p) => {
        if (p.id === activeStudentId) {
          const updatedStickers = [...(p.unlockedStickers || [])];
          if (!updatedStickers.includes("moon_sticker")) {
            updatedStickers.push("moon_sticker"); // Unlock Moon Sticker on first sweep!
          }
          return {
            ...p,
            scanCount: p.scanCount + 1,
            totalScore: p.totalScore + rawPoints,
            unlockedStickers: updatedStickers
          };
        }
        return p;
      });
      saveParticipantsToCache(updated);
    }

    // Move to next step: AR monster hunt!
    setGameMode("AR_MONSTER");
  };

  // STEP 5: Capture garbage creature -> update score -> back to HUD
  const handleMonsterCaptured = (pointsEarned: number) => {
    sounds.playChime();
    // Scale monster hunter points to a balanced contribution for 13 kids (e.g. +5% max progress per hunt)
    const addedProgress = Math.min(5, Math.max(1, Math.round(pointsEarned / 10))); // max +5% energy progress
    updateTruckEnergy(truckEnergy + addedProgress);

    // Update student's capture stats
    if (currentStudent) {
      const updated = participants.map((p) => {
        if (p.id === activeStudentId) {
          // Achievements unlocks based on scores
          const updatedStickers = [...(p.unlockedStickers || [])];
          if (pointsEarned >= 30 && !updatedStickers.includes("recycling_king")) {
            updatedStickers.push("recycling_king");
          }

          const newScore = p.totalScore + pointsEarned;
          if (newScore >= 100 && !updatedStickers.includes("victory_hero")) {
            updatedStickers.push("victory_hero");
          }

          return {
            ...p,
            captureCount: p.captureCount + 1,
            totalScore: newScore,
            unlockedStickers: updatedStickers
          };
        }
        return p;
      });

      // Special sticker unlock if truck reached 100%
      if (truckEnergy + addedProgress >= 100) {
        updated.forEach(u => {
          if (u.id === activeStudentId && !u.unlockedStickers.includes("truck_sticker")) {
            u.unlockedStickers.push("truck_sticker");
          }
        });
      }

      saveParticipantsToCache(updated);
    }

    // Go back to dashboard!
    setScannedTrash(null);
    setGameMode("MAIN");
  };

  // ==========================================
  //          2-PLAYER VERSUS STATE MACHINE
  // ==========================================
  const startVersusChallenge = (p1Name: string, p2Name: string) => {
    sounds.playPop();
    setP1State({ name: p1Name || "플레이어 1", score: 0, scanCount: 0, captureCount: 0 });
    setP2State({ name: p2Name || "플레이어 2", score: 0, scanCount: 0, captureCount: 0 });
    setVsPhase("INTRO");
    setGameMode("VS_MODE");
    sounds.speak("2인 대결 모드를 시작합니다! 30초 동안 번갈아가며 더 많은 쓰레기 괴물을 물리치는 친구가 우승해서 환경 영웅 스티커를 받게 됩니다!");
  };

  // Start round timer
  const launchVsRound = (playerNum: 1 | 2) => {
    sounds.playPop();
    setVsTimer(30);
    setVsPhase(playerNum === 1 ? "P1_GO" : "P2_GO");

    // Generate drift monsters for active versus screen
    const items = [];
    const types = ["plastic", "paper", "can", "milk_carton", "vinyl"];
    for (let i = 0; i < 9; i++) {
      items.push({
        id: `vs-mon-${i}-${Date.now()}`,
        type: types[i % types.length],
        x: 10 + Math.random() * 80,
        y: 15 + Math.random() * 70,
        speedX: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2),
        speedY: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2),
      });
    }
    setVsActiveMonsters(items);
  };

  // Ticking countdown limit
  useEffect(() => {
    if (gameMode !== "VS_MODE") return;
    if (vsPhase !== "P1_GO" && vsPhase !== "P2_GO") return;

    const interval = setInterval(() => {
      setVsTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          sounds.playFail();
          // Advance turn phase
          if (vsPhase === "P1_GO") {
            sounds.speak("플레이어 1 시간 종료! 다음은 플레이어 2 차례입니다. 준비해주세요.");
            setVsPhase("P2_INTRO");
          } else {
            sounds.speak("대결 종료! 결과를 발표하겠습니다!");
            setVsPhase("FINAL_RESULTS");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameMode, vsPhase]);

  // Versus game mechanics: float monsters around screen
  useEffect(() => {
    if (gameMode !== "VS_MODE") return;
    if (vsPhase !== "P1_GO" && vsPhase !== "P2_GO") return;

    let animId: number;
    const loop = () => {
      setVsActiveMonsters((prev) =>
        prev.map((m) => {
          let nx = m.x + m.speedX * 0.45;
          let ny = m.y + m.speedY * 0.45;
          let sx = m.speedX;
          let sy = m.speedY;
          if (nx <= 5 || nx >= 95) sx = -sx;
          if (ny <= 10 || ny >= 90) sy = -sy;
          return { ...m, x: nx, y: ny, speedX: sx, speedY: sy };
        })
      );
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameMode, vsPhase]);

  // Click monster inside VS mode
  const handleVsMonsterClick = (monsterId: string) => {
    sounds.playCatch();
    // Award 10 points to current player
    if (vsPhase === "P1_GO") {
      setP1State(prev => ({ ...prev, score: prev.score + 10, captureCount: prev.captureCount + 1 }));
    } else if (vsPhase === "P2_GO") {
      setP2State(prev => ({ ...prev, score: prev.score + 10, captureCount: prev.captureCount + 1 }));
    }

    // Delete caught monster
    setVsActiveMonsters(prev => prev.filter(m => m.id !== monsterId));

    // Spawn replacement so stage is never empty
    const types = ["plastic", "paper", "can", "milk_carton", "vinyl"];
    const newItem = {
      id: `vs-mon-repl-${Date.now()}`,
      type: types[Math.floor(Math.random() * types.length)],
      x: 10 + Math.random() * 80,
      y: 15 + Math.random() * 70,
      speedX: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2),
      speedY: (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 2),
    };
    setVsActiveMonsters(prev => [...prev, newItem]);
  };

  // Complete VS mode and add reward points to active student if any
  const closeVsChallenge = () => {
    sounds.playPop();
    // Give winner points (+30) to currently active student profile as bonus!
    const winnerScore = Math.max(p1State.score, p2State.score);
    if (currentStudent && winnerScore > 0) {
      const updated = participants.map((p) => {
        if (p.id === activeStudentId) {
          const updatedStickers = [...(p.unlockedStickers || [])];
          if (!updatedStickers.includes("victory_hero")) {
            updatedStickers.push("victory_hero");
          }
          return {
            ...p,
            totalScore: p.totalScore + 20, // 20 bonus points
            unlockedStickers: updatedStickers
          };
        }
        return p;
      });
      saveParticipantsToCache(updated);
    }

    setGameMode("MAIN");
    setVsPhase(null);
  };


  // ==========================================
  //          GARBAGE TRUCK STATE EMOTIONS
  // ==========================================
  // Render cartoon avatar graphic representing charging parameters
  const renderGarbageTruckAnimation = () => {
    if (truckEnergy < 30) {
      // 0% ~ 29% - Broken, emitting grey smoke puffs, crying sad look
      return (
        <div className="relative flex flex-col items-center">
          
          {/* Grey smoke emojis rising */}
          <div className="absolute top-0 right-1/4 text-4xl animate-puff-1 select-none pointer-events-none">💨</div>
          <div className="absolute top-4 right-1/3 text-3xl animate-puff-2 select-none pointer-events-none">💨</div>
          
          {/* Side-by-side truck and emoji */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-[140px] h-[112px] filter saturate-50 brightness-75 translate-y-1 select-none animate-pulse duration-1000">
              <GreenTrashTruck size="100%" />
            </div>
            <span className="text-5xl animate-bounce select-none">😭</span>
          </div>
          
          <span className="mt-2 text-xs bg-[#FEE2E2] text-[#EF4444] px-4 py-1 border-2 border-[#FCA5A5] rounded-full font-black shadow-sm">
            고장난 상태... 연기가 올라와요 💔
          </span>
        </div>
      );
    } else if (truckEnergy < 60) {
      // 30% ~ 59% - Moves slightly, smoke cleared a bit, humble smile
      return (
        <div className="relative flex flex-col items-center">
          
          {/* Tiny wind puffs */}
          <div className="absolute top-2 right-1/4 text-xl opacity-60 select-none pointer-events-none">💨</div>
          
          {/* Side-by-side truck and emoji */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-[140px] h-[112px] transition duration-500 animate-float select-none">
              <GreenTrashTruck size="100%" className="filter saturate-75" />
            </div>
            <span className="text-5xl select-none">🥺</span>
          </div>
          
          <span className="mt-2 text-xs bg-[#FEF3C7] text-[#D97706] px-4 py-1 border-2 border-[#FCD34D] rounded-full font-black shadow-sm">
            조금씩 움직이기 시작했어요! ⚙️
          </span>
        </div>
      );
    } else if (truckEnergy < 80) {
      // 60% ~ 79% - Headlights turn on with glow pulsate
      return (
        <div className="relative flex flex-col items-center">
          
          {/* Beam effect vectors left and right */}
          <div className="absolute bottom-[40px] left-[15px] w-12 h-12 bg-yellow-300 opacity-65 rounded-full blur-md animate-ping pointer-events-none" />
          <div className="absolute bottom-[40px] right-[15px] w-12 h-12 bg-yellow-300 opacity-65 rounded-full blur-md animate-ping pointer-events-none" />
 
          {/* Side-by-side truck and emoji */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-[140px] h-[112px] scale-103 select-none animate-float">
              <GreenTrashTruck size="100%" />
            </div>
            <span className="text-5xl select-none">😮</span>
          </div>
          <span className="text-3xl absolute bottom-[45px] left-1/3 transform -translate-x-1/2 bg-yellow-400 border border-yellow-300/50 text-slate-900 px-1 py-0.5 rounded text-[9px] font-black pointer-events-none uppercase tracking-widest leading-none">
            LIGHTS ON
          </span>
 
          <span className="mt-2 text-xs bg-[#E0F2FE] text-[#0369A1] px-4 py-1 border-2 border-[#7DD3FC] rounded-full font-black shadow-sm flex items-center space-x-1">
            <span className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span>반짝반짝 헤드라이트 점등! 💡</span>
          </span>
        </div>
      );
    } else if (truckEnergy < 100) {
      // 80% ~ 99% - Smile friendly happy face
      return (
        <div className="relative flex flex-col items-center">
          
          {/* Sparkling yellow stars */}
          <div className="absolute -top-4 left-1/4 text-2xl animate-pulse">⭐</div>
          <div className="absolute top-2 right-1/4 text-2xl animate-ping">✨</div>
 
          {/* Side-by-side truck and emoji */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-[140px] h-[112px] scale-105 select-none animate-float">
              <GreenTrashTruck size="100%" />
            </div>
            <span className="text-5xl select-none animate-bounce">😀</span>
          </div>
 
          <span className="mt-2 text-xs bg-[#ECFDF5] text-[#059669] px-4 py-1 border-2 border-[#6EE7B7] rounded-full font-black shadow-sm">
            쌩쌩 웃는 얼굴로 달릴 수 있어요! 😊
          </span>
        </div>
      );
    } else {
      // 100% - Fully repaired! Golden crown glowing flashing rainbow
      return (
        <div className="relative flex flex-col items-center">
          
          {/* Floating crown over the truck */}
          <div className="absolute -top-8 text-5xl animate-pulse select-none z-10">👑</div>
          <div className="absolute top-2 left-6 text-2xl animate-ping text-pink-500">❤️</div>
          <div className="absolute top-0 right-6 text-2xl animate-ping text-yellow-300">⭐</div>
 
          {/* Side-by-side truck and emoji */}
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-[140px] h-[112px] scale-110 select-none animate-float filter drop-shadow-2xl">
              <GreenTrashTruck size="100%" />
            </div>
            <span className="text-5xl select-none animate-bounce">🥳</span>
          </div>
 
          <span className="mt-2 text-xs bg-[#FEF3C7] text-[#B45309] font-black px-4 py-1.5 rounded-full animate-pulse shadow-md border-2 border-[#FCD34D]">
            👑 완전 회복! 땅별마을 영웅 쓰레기차 🌟
          </span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex items-center justify-center p-0 overflow-y-auto w-full">
      {/* Landscape Tablet Frame (Borderless design perfectly sized for iPad landscape - expanded width) */}
      <div className="w-full max-w-[1280px] md:min-h-[820px] bg-[#F0F9FF] text-[#1E293B] font-sans flex flex-col justify-between overflow-hidden relative rounded-3xl shadow-2xl border-4 border-[#3B82F6]/10">
      
      {/* Navigation Top Header */}
      <h1 className="sr-only">땅별마을 분리수거 챌린지</h1>
      <header className="bg-white/85 backdrop-blur-md border-b-4 border-[#3B82F6]/20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-[#4ADE80] text-white font-black rounded-2xl flex items-center justify-center text-2xl shadow-md border-2 border-white">
            🌍
          </div>
          <div>
            <h2 onClick={() => sounds.playChime()} className="text-lg md:text-xl font-black tracking-tight text-[#0F172A] cursor-pointer hover:scale-[1.01] transition-transform flex items-center gap-1.5">
              땅별마을 분리수거 챌린지 <GreenTrashTruck size={30} className="inline-block" />
            </h2>
            <p className="text-[11px] text-[#64748B] font-bold">지구를 지켜주고 고장 난 쓰레기차의 에너지를 모으자!</p>
          </div>
        </div>

        {/* Global Controls HUD */}
        <div className="flex items-center space-x-3">
          
          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) sounds.playPop();
            }}
            className="p-2.5 bg-white border-2 border-[#CBD5E1] hover:border-[#94A3B8] text-slate-600 hover:text-[#0F172A] rounded-xl transition shadow-sm active:translate-y-0.5"
            title="소리 활성화 토글"
          >
            <Volume2 size={16} className={soundEnabled ? "text-[#3B82F6] animate-pulse" : "text-slate-400 opacity-40"} />
          </button>

          {/* Teacher dashboard quick gateway */}
          <button
            onClick={() => { sounds.playPop(); setGameMode("TEACHER"); }}
            id="btn-nav-teacher"
            className="px-4 py-2 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] border-2 border-[#818CF8]/30 font-black rounded-xl text-xs transition shadow-sm active:translate-y-0.5"
          >
            교사용 모드 👩‍🏫
          </button>

          {/* Back to Intro screen button */}
          {gameMode !== "INTRO" && (
            <button
              onClick={() => {
                sounds.playPop();
                setGameMode("INTRO");
              }}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-250 font-black rounded-xl text-xs transition shadow-sm active:translate-y-0.5"
            >
              🏠 처음 화면
            </button>
          )}
        </div>
      </header>

      {/* Main Switch Router */}
      <main className="flex-1 overflow-y-auto p-3 flex flex-col relative">
        <AnimatePresence mode="wait">
          
          {/* SCENE 1: STORY INTRUDER DIALOGUE */}
          {gameMode === "INTRO" && (
            <motion.div
              key="intro-scene"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto w-full p-8 my-10 bg-white rounded-[2.5rem] border-4 border-[#3B82F6] shadow-2xl relative text-center overflow-hidden bg-gradient-to-b from-[#E0F2FE] via-white to-white"
            >
              <div className="absolute top-2 left-2 text-6xl opacity-10 pointer-events-none">🌕</div>
              
              {/* Moon dialogue speaker avatar - Full Moon with gentle pulse animation instead of bounce */}
              <div className="w-24 h-24 bg-gradient-to-tr from-[#FFF9C4] to-[#FBC02D] text-slate-900 text-4xl font-sans font-black mx-auto rounded-full flex items-center justify-center animate-pulse shadow-xl border-4 border-white ring-4 ring-[#FBC02D] relative">
                🌕
                <span className="absolute -bottom-1 right-0 text-lg">💬</span>
              </div>

              <h3 className="text-xl font-black text-[#1E3A8A] mt-4">"얘들아! 땅별마을을 구해줘!"</h3>
              
              <div className="bg-[#EEF2FF] p-4 rounded-xl border-2 border-[#818CF8]/12 my-3 text-xs text-[#3730A3] font-medium leading-relaxed text-center">
                <p className="mt-1">
                  "분리수거 놀이와 몬스터 잡기 놀이로 에너지를 충전해 주세요! <br />
                  지구를 지키는 멋진 어린이 특공대, 출동해 볼까요? 🚛"
                </p>
              </div>

              {/* Broken down dirty sad truck visual - expanded to wide rectangle with crying emoji */}
              <div className="flex items-center justify-center space-x-4 my-4 p-4 bg-[#FEE2E2] border-2 border-[#FCA5A5] rounded-2xl max-w-md mx-auto shadow-sm">
                <div className="w-16 h-12 shrink-0 animate-pulse">
                  <GreenTrashTruck size="100%" className="filter saturate-50 brightness-75" />
                </div>
                <span className="text-4xl select-none animate-bounce">😭</span>
                <div className="text-left">
                  <span className="text-xs text-[#EF4444] font-black block leading-none">고장난 쓰레기차</span>
                  <span className="text-[11px] text-[#991B1B] font-bold mt-1 block">현재 엔진 축전력: 10% 미만</span>
                </div>
              </div>

              {/* Enter simple name or lookup selection */}
              <div className="mt-5 border-t-2 border-[#E2E8F0] pt-4 text-left">
                <label className="block text-xs text-[#1E3A8A] font-black mb-2.5 text-center bg-blue-100/50 py-1.5 rounded-lg">
                  👇 아래 명단에서 내 이름을 찾아서 콕! 터치해 주세요 👇
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[300px] min-h-[160px] overflow-y-auto p-3 bg-[#F8FAFC] rounded-2xl border-2 border-slate-200 shadow-inner custom-scrollbar touch-pan-y">
                  {participants.length === 0 ? (
                    <div className="col-span-full text-center py-10 px-4 text-xs text-slate-500 font-bold">
                      등록된 어린이 이름이 없어요! 아래에서 이름을 입력하고 추가해 주세요! 👇
                    </div>
                  ) : (
                    participants.map(p => {
                      const isActive = p.id === activeStudentId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            sounds.playChime();
                            setActiveStudentId(p.id);
                            sounds.speak(`${p.name.replace(/[🧒👧🌟]/g, "").trim()} 친구 반가워요! 대작전 시작!`);
                            setGameMode("MAIN");
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer h-20 ${
                            isActive
                              ? "bg-[#3B82F6] text-white border-[#2563EB] scale-105 shadow-md font-extrabold"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                          }`}
                        >
                          <span className="text-2xl mb-1">
                            {p.name.includes("👧") ? "👧" : "🧒"}
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full">
                            {p.name.replace(/[🧒👧🌟]/g, "").trim()}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Quick Add Name on Intro Page */}
                <div className="mt-3 p-3 bg-blue-50 rounded-2xl border-2 border-blue-200/50">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const input = form.elements.namedItem("quickName") as HTMLInputElement;
                      const gender = form.elements.namedItem("genderSelect") as HTMLSelectElement;
                      if (input && input.value.trim()) {
                        const nameText = input.value.trim() + (gender.value === "girl" ? " 👧" : " 🧒");
                        handleAddParticipant(nameText);
                        input.value = "";
                        sounds.playPop();
                      }
                    }}
                    className="flex flex-col sm:flex-row items-center gap-2"
                  >
                    <span className="text-xs font-black text-[#1E3A8A] shrink-0">➕ 빠른 이름 추가:</span>
                    <div className="flex flex-1 w-full gap-2">
                      <input
                        name="quickName"
                        type="text"
                        placeholder="이름 입력 (예: 민수, 민지)"
                        maxLength={8}
                        className="flex-1 px-3 py-1.5 text-xs border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold bg-white"
                      />
                      <select
                        name="genderSelect"
                        className="px-2 py-1.5 text-xs border-2 border-blue-200 rounded-xl font-bold bg-white focus:outline-none"
                      >
                        <option value="boy">🧒 남자아이</option>
                        <option value="girl">👧 여자아이</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black rounded-xl transition shadow-md active:translate-y-0.5 shrink-0"
                    >
                      어린이 등록
                    </button>
                  </form>
                </div>
                
                <div className="mt-2.5 flex justify-end">
                  <button
                    onClick={() => { sounds.playPop(); setGameMode("TEACHER"); }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 text-[10px] rounded-lg font-bold transition shadow-sm"
                  >
                    ⚙️ 전체 관리 및 인쇄 (선생님)
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (participants.length === 0) {
                    sounds.playFail();
                    sounds.speak("먼저 어린이를 등록해 주세요!");
                    alert("먼저 어린이를 등록해 주세요!");
                    return;
                  }
                  sounds.playChime();
                  sounds.speak("대작전 시작! 뚝딱뚝딱 고치러 가보자!");
                  setGameMode("MAIN");
                }}
                id="btn-start-action"
                className="w-full mt-6 py-4 bg-[#2563EB] border-4 border-[#1E3A8A] text-white hover:bg-[#1D4ED8] hover:scale-[1.01] rounded-3xl font-black text-base shadow-[0_6px_0_#1E3A8A] active:shadow-none active:translate-y-1 transition-all tracking-wider flex items-center justify-center space-x-2"
              >
                <Play size={16} fill="currentColor" />
                <span>땅별지킵이 특공대 출동하기!</span>
              </button>
            </motion.div>
          )}

          {/* SCENE 2: CORE DASHBOARD HUB */}
          {gameMode === "MAIN" && (
            <motion.div
              key="main-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto w-full p-4 lg:p-6 space-y-6 animate-fade-in"
            >
              
              {/* Active User Card & Title badges */}
              <div className="bg-white p-6 rounded-[2.5rem] border-4 border-[#E2E8F0] shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 bg-[#4ADE80] text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white">
                    👶
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] text-[#64748B] font-extrabold uppercase tracking-widest block leading-none">현재 도전중인 대장</span>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <strong className="text-xl font-black text-[#0F172A]">{currentStudent?.name || "체험단 어린이"}</strong>
                      <span className="px-2.5 py-0.5 bg-[#FEF3C7] text-[#D97706] text-[10px] font-black rounded-full border-2 border-[#FCD34D]">
                        {currentStudent ? STICKER_LIST.map((s, idx) => currentStudent.totalScore >= 30 ? "🎓" : "🌱")[0] : "🌱"} 새싹
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score stats pill */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { sounds.playPop(); setGameMode("STICKERS"); }}
                    id="btn-open-stickers"
                    className="px-5 py-3 bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#F97316] border-4 border-[#F97316] text-xs font-black rounded-2xl flex items-center space-x-1.5 shadow-sm transition active:translate-y-0.5"
                  >
                    <span>🏆</span>
                    <span>상장 & 스티커 보관함</span>
                  </button>

                  <div className="px-5 py-3 bg-white border-4 border-[#10B981] rounded-2xl text-center flex items-center space-x-2 justify-center shadow-sm">
                    <div>
                      <span className="text-[9px] text-[#059669] block leading-none font-extrabold tracking-wider font-mono">MY SCORE</span>
                      <strong className="text-base text-[#10B981] font-black tracking-tight">{currentStudent?.totalScore || 0}⚡</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated physical layout representing the Garbage Truck loading stats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* 1. Animation frame showcasing garbage truck with crying/sad state */}
                <div className="md:col-span-8 bg-white rounded-[2.5rem] border-4 border-[#3B82F6] p-6 shadow-xl relative overflow-hidden group flex flex-col justify-between min-h-[360px]">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#DBEAFE] via-white to-white pointer-events-none opacity-50 rounded-[2.2rem]" />
                  
                  <div className="relative z-10 animate-fade-in-slow">
                    <h3 className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider block mb-1">
                      🛠️ 실시간 쓰레기차 조립 진도판
                    </h3>
                    <div className="flex justify-between text-xs text-[#1E293B] font-bold mb-1.5">
                      <span>에너지 적재량</span>
                      <strong className="text-[#2563EB]">{truckEnergy}% / 100% 충전</strong>
                    </div>

                    {/* Highly stylized batteries charger fuel meters */}
                    <div className="relative h-6 w-full bg-[#F1F5F9] rounded-full border-4 border-[#3B82F6] overflow-hidden flex items-center pl-3 shadow-inner">
                      <div
                        style={{ width: `${truckEnergy}%` }}
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                          truckEnergy < 30 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                          truckEnergy < 60 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                          truckEnergy < 80 ? "bg-gradient-to-r from-yellow-500 to-emerald-500" :
                          "bg-gradient-to-r from-[#10B981] via-teal-500 to-indigo-500 animate-pulse"
                        }`}
                      />
                      <span className="relative z-10 font-sans text-[11px] font-black text-[#1E3A8A] drop-shadow-sm">
                        {truckEnergy >= 100 ? "⚡ 충전 완료! 땅별마을은 우리가 지켰어요!" : `번개 전기에너지 +${truckEnergy}% 충전`}
                      </span>
                    </div>
                  </div>

                  {/* Character visual engine */}
                  <div className="my-6 relative z-10">
                    {renderGarbageTruckAnimation()}
                  </div>

                  {/* Manual helper to test levels if desired */}
                  <div className="relative z-10 flex items-center justify-between border-t-2 border-[#CBD5E1]/35 pt-3">
                    <span className="text-[10px] text-[#64748B] font-extrabold leading-none">디버그 테스트용 수동 충전:</span>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => { sounds.playPop(); updateTruckEnergy(Math.max(0, truckEnergy - 15)); }}
                        className="px-2 py-1 bg-white border border-[#CBD5E1] text-[10px] rounded hover:bg-slate-50 text-slate-500 font-mono font-bold shadow-sm transition"
                      >
                        -15%
                      </button>
                      <button
                        onClick={() => { sounds.playChime(); updateTruckEnergy(Math.min(100, truckEnergy + 15)); }}
                        className="px-2 py-1 bg-[#FEF3C7] border border-[#FCD34D] text-[10px] rounded hover:bg-[#FDE68A] text-[#D97706] font-mono font-bold shadow-sm transition"
                      >
                        +15%
                      </button>
                      <button
                        onClick={() => { sounds.playPop(); updateTruckEnergy(0); }}
                        className="px-2 py-1 bg-[#FEE2E2] border border-[#FCA5A5] text-[10px] rounded hover:bg-[#FCA5A5] text-red-650 font-bold shadow-sm transition"
                        title="에너지 초기화"
                      >
                        비우기
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Target Mode quick portals (styled as a beautiful Orange Bento grid block) */}
                <div className="md:col-span-4 bg-[#FFF7ED] rounded-[2.5rem] border-4 border-[#F97316] p-6 shadow-lg flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-[#9A3412] uppercase tracking-wider block">
                      🎮 분리수거 놀이 선택방
                    </h3>
                    
                    <button
                      onClick={() => { sounds.playPop(); setGameMode("SCAN"); }}
                      id="btn-play-scan"
                      className="w-full text-left bg-[#3B82F6] border-4 border-[#1D4ED8] hover:bg-[#2563EB] text-white rounded-3xl font-black text-xs p-3 shadow-[0_5px_0_#1D4ED8] active:shadow-none active:translate-y-1 transition-all flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold opacity-85 text-blue-50 leading-none mb-1">단계 1 & 2</span>
                        <strong className="text-xs sm:text-sm block font-sans whitespace-nowrap truncate">📸 교실 쓰레기 찾기</strong>
                      </div>
                      <span className="text-2xl shrink-0 ml-1">🔍</span>
                    </button>

                    <button
                      onClick={() => {
                        sounds.playPop();
                        if (truckEnergy < 15) {
                          sounds.playFail();
                          alert("먼저 카메라 단계에서 쓰레기를 발견해 15% 이상 발전 에너지를 모으거나, 디버그 연료 버튼을 이용해 에너지를 채워 쓰레기 몬스터를 자극시켜주세요!");
                        } else {
                          setGameMode("AR_MONSTER");
                        }
                      }}
                      id="btn-play-monster"
                      className={`w-full text-left p-3 rounded-3xl font-black text-xs transition-all flex items-center justify-between shadow-lg ${
                        truckEnergy >= 15
                          ? "bg-[#6366F1] border-4 border-[#4338CA] hover:bg-[#4F46E5] text-white shadow-[0_5px_0_#4338CA] active:shadow-none active:translate-y-1 cursor-pointer"
                          : "bg-[#FFF7ED] text-slate-400 border-4 border-dashed border-[#FED7AA] opacity-55 cursor-not-allowed shadow-none"
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="block text-[9px] font-bold opacity-85 leading-none mb-1">단계 3 & 4</span>
                        <strong className="text-xs sm:text-sm block font-sans whitespace-nowrap truncate">🏹 AR 쓰레기 괴물 사냥</strong>
                      </div>
                      <span className="text-2xl shrink-0 ml-1">👾</span>
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* SCENE 3: SCANNING SCREEN */}
          {gameMode === "SCAN" && (
            <motion.div
              key="scan-scene-explorer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <ClassroomExplorer
                onScanSuccess={handleClassomScanSuccess}
                onClose={() => { sounds.playPop(); setGameMode("MAIN"); }}
              />
            </motion.div>
          )}

          {/* SCENE 4: AR MONSTER HOUND CHASE SCREEN */}
          {gameMode === "AR_MONSTER" && (
            <motion.div
              key="monster-hunt-radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <MonsterHunt
                detectedCategory={scannedTrash?.category || "plastic"}
                monsterName={scannedTrash?.monsterName || "플라스틱 괴물"}
                onMonsterCaptured={handleMonsterCaptured}
                onClose={() => { sounds.playPop(); setGameMode("MAIN"); }}
              />
            </motion.div>
          )}

          {/* SCENE 5: 2-PLAYER VERSUS MODE PANEL */}
          {gameMode === "VS_MODE" && vsPhase && (
            <motion.div
              key="versus-arena"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-55 bg-slate-950 flex flex-col items-center justify-center text-white"
            >
              
              {/* VS Header */}
              <div className="text-center py-4 bg-slate-900 border-b border-rose-500/10 w-full relative z-10">
                <span className="text-xs uppercase font-black text-rose-500 tracking-widest animate-pulse">2-PLAYER ENVIRONMENT HERO VERSUS ARENA</span>
                <h3 className="text-xl font-bold font-display text-white mt-0.5">30초 타임어택: 꼬마들의 분리수거 대결! ⚔️</h3>
              </div>

              {/* STAGES CHANGER */}
              {vsPhase === "INTRO" && (
                <div className="max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 text-center shadow-2xl relative z-10">
                  <span className="text-5xl block animate-pulse mb-3">🎮</span>
                  <h4 className="text-xl font-extrabold text-yellow-350">게임 규칙 설명</h4>
                  
                  <div className="my-4 bg-slate-950 p-4 rounded-xl text-xs text-slate-300 leading-relaxed text-left">
                    <p className="font-bold text-white mb-1">🔥 30초 대전 룰:</p>
                    <p>1. 먼저 <strong className="text-white">{p1State.name}</strong> 선수가 30초 동안 날아다니는 쓰레기 괴물들을 마구 터치해서 에너지를 사냥합니다.</p>
                    <p className="mt-2">2. 이어서 <strong className="text-white">{p2State.name}</strong> 선수가 30초 동안 동일하게 사냥을 진행합니다.</p>
                    <p className="mt-2">3. 합산 점수가 더 높은 어린이가 최종 영광의 <strong className="text-yellow-450">[땅별마을 수호 환경 영웅]</strong> 타이틀과 트로피를 차지합니다!</p>
                  </div>

                  <button
                    onClick={() => launchVsRound(1)}
                    id="btn-start-vs-p1"
                    className="w-full py-3.5 bg-rose-500 hover:bg-rose-400 font-extrabold rounded-2xl text-xs transition"
                  >
                    확인! {p1State.name} 선수 30초 타이머 시작!
                  </button>
                </div>
              )}

              {vsPhase === "P2_INTRO" && (
                <div className="max-w-md bg-slate-900 rounded-3xl border border-slate-700 p-6 text-center shadow-2xl relative z-10">
                  <span className="text-5xl block animate-pulse mb-3">🔄</span>
                  <h4 className="text-xl font-extrabold text-yellow-350">공수 교대!</h4>
                  <p className="text-xs text-slate-350 my-3">
                    {p1State.name} 선수가 무려 <strong className="text-yellow-300">{p1State.score} 에너지 점수</strong>를 획득하는 발군의 성적을 거두었습니다! 아주 잘했어요!
                  </p>
                  <p className="text-xs text-pink-400 font-bold mb-4">
                    자! 다음 선수인 {p2State.name} 어린이는 긴장하지 말고 뛰어볼까요?
                  </p>

                  <button
                    onClick={() => launchVsRound(2)}
                    id="btn-start-vs-p2"
                    className="w-full py-3.5 bg-yellow-450 hover:bg-yellow-400 text-slate-900 font-black rounded-2xl text-xs transition"
                  >
                    {p2State.name} 선수 30초 카운트 개막!
                  </button>
                </div>
              )}

              {/* ACTIVE GAME PLAYING */}
              {(vsPhase === "P1_GO" || vsPhase === "P2_GO") && (
                <div className="relative flex-1 w-full max-w-4xl p-4 flex flex-col justify-between items-center h-full">
                  
                  {/* Current Active User Panel */}
                  <div className="w-full bg-slate-900/60 p-3 rounded-xl border border-white/5 flex justify-between items-center z-10">
                    <div>
                      <span className="text-[10px] text-pink-400 font-bold uppercase">ACTIVE PLAYER</span>
                      <strong className="text-base text-white block">
                        {vsPhase === "P1_GO" ? p1State.name : p2State.name} 어린이 차례
                      </strong>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Timer block */}
                      <div className="px-3 py-1 bg-red-950 border border-red-500/20 text-red-300 font-mono text-sm rounded font-bold animate-pulse">
                        ⌛ {vsTimer}초 남음!
                      </div>
                      
                      {/* Live score */}
                      <div className="px-3 py-1 bg-yellow-440 text-slate-950 font-bold text-sm rounded">
                        현재 점수: {vsPhase === "P1_GO" ? p1State.score : p2State.score}⚡
                      </div>
                    </div>
                  </div>

                  {/* Active Arena Radar Sandbox field */}
                  <div className="relative w-full h-[400px] border border-slate-800 rounded-2xl bg-black/50 my-4 overflow-hidden">
                    {vsActiveMonsters.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleVsMonsterClick(m.id)}
                        style={{ left: `${m.x}%`, top: `${m.y}%` }}
                        id={`vs-monster-btn-${m.id}`}
                        className="absolute p-2 transform -translate-x-1/2 -translate-y-1/2 hover:scale-115 transition"
                      >
                        <span className="text-4xl block animate-pulse">
                          {m.type === "plastic" ? "🥤" : m.type === "paper" ? "📦" : m.type === "can" ? "🥫" : m.type === "milk_carton" ? "🥛" : "🛍️"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-500 max-w-md text-center leading-normal mb-2 block">
                    팁: 공중을 통통 튕기며 도망치려는 쓰레기 괴물 이모티콘들을 재빠르게 손가락이나 마우스로 사정없이 쾅 터치해주시면 10점을 얻습니다!
                  </span>

                </div>
              )}

              {/* FINAL RESULTS GRAPH */}
              {vsPhase === "FINAL_RESULTS" && (
                <div className="max-w-lg bg-slate-900 rounded-3xl border-2 border-yellow-450 p-6 text-center shadow-2xl relative z-10 my-6">
                  
                  {/* Winner designator */}
                  <div className="text-5xl mb-2">⭐ 🏆 ⭐</div>
                  
                  <h4 className="text-2xl font-black text-yellow-350">최종 대결 판정 결과 발표!</h4>
                  <p className="text-xs text-slate-400 mt-0.5 mb-5">고장 난 지구를 청소해준 대전 결과입니다.</p>

                  <div className="space-y-4 my-6">
                    {/* Player 1 summary */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="text-left">
                        <strong className="text-sm text-slate-300">{p1State.name}</strong>
                        <span className="text-[10px] text-slate-500 block">괴물 {p1State.captureCount}마리 사냥</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-300">{p1State.score}⚡</span>
                    </div>

                    {/* Player 2 summary */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div className="text-left">
                        <strong className="text-sm text-slate-300">{p2State.name}</strong>
                        <span className="text-[10px] text-slate-500 block">괴물 {p2State.captureCount}마리 사냥</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-300">{p2State.score}⚡</span>
                    </div>
                  </div>

                  {/* Decision rendering */}
                  <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 mb-6 text-xs text-indigo-300">
                    {p1State.score === p2State.score ? (
                      <p className="font-extrabold text-sm">
                        🤝 무승부! 두 어린이 선수 모두 지구 환경보호 영웅입니다! 🤝
                      </p>
                    ) : (
                      <p className="font-extrabold text-sm">
                        👑 우승자: <strong className="text-yellow-400 text-base">{p1State.score > p2State.score ? p1State.name : p2State.name} 어린이</strong> 👑
                      </p>
                    )}
                    <p className="mt-1 opacity-80 text-[10px]">
                      챌린지에 참여해 준 우승 특권 보너스 포인트를 마스터 선수 저장소에 선물해드릴게요!
                    </p>
                  </div>

                  <button
                    onClick={closeVsChallenge}
                    id="btn-complete-vs"
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs transition"
                  >
                    마을 메인화면으로 복장하기
                  </button>

                </div>
              )}

            </motion.div>
          )}

          {/* SCENE 6: TEACHER BOARD */}
          {gameMode === "TEACHER" && (
            <motion.div
              key="teacher-board"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <TeacherDashboard
                participants={participants}
                onAddParticipant={handleAddParticipant}
                onClearData={handleClearDatabase}
                onClose={() => { sounds.playPop(); setGameMode("MAIN"); }}
              />
            </motion.div>
          )}

          {/* SCENE 7: STICKER BOOK GALLERY */}
          {gameMode === "STICKERS" && (
            <motion.div
              key="sticker-book"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <StickerBook
                activeStudent={currentStudent}
                onClose={() => { sounds.playPop(); setGameMode("MAIN"); }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer credits */}
      <footer className="bg-[#E0F2FE]/40 py-3 border-t-2 border-[#CBD5E1]/30 shrink-0 text-center text-[10px] font-semibold text-[#64748B] select-none">
        <p>ⓒ 2026 땅별마을 저탄소 녹색지대 협의회. (iPad Landscape 최적화)</p>
      </footer>
      </div>
    </div>
  );
}
