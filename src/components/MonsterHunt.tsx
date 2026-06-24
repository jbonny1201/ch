import React, { useEffect, useState, useRef } from "react";
import { Monster, CategoryType } from "../types";
import { sounds } from "../utils/audio";
import { ShieldCheck, Crosshair, AlertTriangle, Zap, Trophy, Timer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MonsterHuntProps {
  detectedCategory: CategoryType;
  monsterName: string;
  onMonsterCaptured: (points: number) => void;
  onClose: () => void;
}

// Definition of trash monster designs using SVG so we can make them incredibly cute and vector-stylized!
const MONSTER_PROFILES: Record<CategoryType, { name: string; color: string; emoji: string; desc: string; svg: React.ReactNode }> = {
  plastic: {
    name: "플라스틱 괴물",
    color: "from-blue-400 to-indigo-500",
    emoji: "🥤",
    desc: "라벨비닐을 꼭꼭 삼키는 단단한 페트 기괴!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
        <ellipse cx="50" cy="50" rx="35" ry="45" fill="#3b82f6" opacity="0.85" />
        <ellipse cx="50" cy="40" rx="28" ry="32" fill="#1e40af" />
        <circle cx="38" cy="35" r="8" fill="white" />
        <circle cx="38" cy="35" r="4" fill="black" />
        <circle cx="62" cy="35" r="8" fill="white" />
        <circle cx="62" cy="35" r="4" fill="black" />
        <path d="M 35,65 Q 50,80 65,65" stroke="white" strokeWidth="4" fill="none" />
        {/* Antennas resembling pet bottle cap */}
        <rect x="42" y="2" width="16" height="10" rx="2" fill="#f43f5e" />
      </svg>
    )
  },
  paper: {
    name: "종이 괴물",
    color: "from-yellow-600 to-amber-750",
    emoji: "📦",
    desc: "테이프 자국이 가득 묻어 우는 박스 괴물!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="15" y="15" width="70" height="70" rx="8" fill="#d97706" />
        {/* Tape scar */}
        <polygon points="25,10 75,30 70,38 20,18" fill="#eab308" opacity="0.6" />
        {/* Angry eyes */}
        <path d="M 25,32 L 45,38" stroke="black" strokeWidth="5" strokeLinecap="round" />
        <path d="M 75,32 L 55,38" stroke="black" strokeWidth="5" strokeLinecap="round" />
        <circle cx="32" cy="48" r="8" fill="white" />
        <circle cx="32" cy="48" r="4.5" fill="#ca8a04" />
        <circle cx="68" cy="48" r="8" fill="white" />
        <circle cx="68" cy="48" r="4.5" fill="#ca8a04" />
        {/* Teeth */}
        <polygon points="35,65 40,75 45,65 50,75 55,65 60,75 65,65" fill="white" />
      </svg>
    )
  },
  can: {
    name: "캔 괴물",
    color: "from-emerald-400 to-teal-650",
    emoji: "🥫",
    desc: "찌그러지기 싫어서 소리 지르는 알루미늄 깡귀!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect x="25" y="10" width="50" height="80" rx="15" fill="#0d9488" />
        {/* Shiny metal patterns */}
        <line x1="32" y1="18" x2="32" y2="82" stroke="#2dd4bf" strokeWidth="4" opacity="0.5" />
        <line x1="68" y1="18" x2="68" y2="82" stroke="#2dd4bf" strokeWidth="4" opacity="0.5" />
        {/* Big single eye */}
        <circle cx="50" cy="42" r="16" fill="white" />
        <circle cx="50" cy="42" r="9" fill="#ef4444" />
        <circle cx="53" cy="39" r="4" fill="white" />
        {/* Open screaming mouth */}
        <circle cx="50" cy="68" r="10" fill="black" />
        <circle cx="50" cy="68" r="6" fill="#310000" />
      </svg>
    )
  },
  milk_carton: {
    name: "우유갑 괴물",
    color: "from-rose-400 to-pink-500",
    emoji: "🥛",
    desc: "다 마신 뒤 입구가 끈적해서 심퉁난 우유 요괴!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Milk gable top */}
        <polygon points="50,5 20,30 80,30" fill="#f472b6" />
        <rect x="20" y="30" width="60" height="65" rx="5" fill="#f472b6" />
        <rect x="28" y="38" width="44" height="20" rx="3" fill="white" opacity="0.8" />
        <text x="50" y="52" fill="#db2777" fontSize="11" fontWeight="bold" textAnchor="middle">MILK</text>
        {/* Sweet but goofy eyes */}
        <circle cx="35" cy="68" r="6" fill="black" />
        <circle cx="35" cy="68" r="2.5" fill="white" />
        <circle cx="65" cy="68" r="6" fill="black" />
        <circle cx="65" cy="68" r="2.5" fill="white" />
        {/* Wavy mouth */}
        <path d="M 40,79 Q 50,70 60,79" stroke="#9d174d" strokeWidth="4" fill="none" />
      </svg>
    )
  },
  vinyl: {
    name: "비닐 괴물",
    color: "from-purple-500 to-fuchsia-600",
    emoji: "🛍️",
    desc: "바스락바스락 골목바람에 떠돌아다니는 가벼운 비닐 구신!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full animate-bounce">
        {/* Crinkle ears and body */}
        <path d="M 15,15 Q 30,35 50,20 Q 70,35 85,15 L 75,75 Q 50,95 25,75 Z" fill="#c084fc" />
        {/* Goofy spiraled eyes */}
        <line x1="30" y1="38" x2="42" y2="50" stroke="#4a044e" strokeWidth="4" />
        <line x1="42" y1="38" x2="30" y2="50" stroke="#4a044e" strokeWidth="4" />
        
        <line x1="58" y1="38" x2="70" y2="50" stroke="#4a044e" strokeWidth="4" />
        <line x1="70" y1="38" x2="58" y2="50" stroke="#4a044e" strokeWidth="4" />
        {/* Tongue sticking out */}
        <path d="M 45,62 Q 50,75 55,62 Z" fill="#f43f5e" />
      </svg>
    )
  },
  other: {
    name: "음식물 먼지 괴물",
    color: "from-red-500 to-amber-900",
    emoji: "🍎",
    desc: "일반 쓰레기통에서 슬그머니 도망쳐온 정체불명 세균 악마!",
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="#78350f" />
        {/* Dirt spikes */}
        <polygon points="50,5 45,20 55,20" fill="#78350f" />
        <polygon points="50,95 45,80 55,80" fill="#78350f" />
        <polygon points="5,50 20,45 20,55" fill="#78350f" />
        <polygon points="95,50 80,45 80,55" fill="#78350f" />
        {/* Mean green eyes */}
        <circle cx="34" cy="45" r="8" fill="#84cc16" />
        <circle cx="34" cy="45" r="3" fill="black" />
        <circle cx="66" cy="45" r="8" fill="#84cc16" />
        <circle cx="66" cy="45" r="3" fill="black" />
        {/* Jagged sharp mouth */}
        <path d="M 30,68 L 38,62 L 44,68 L 50,62 L 56,68 L 62,62 L 70,68" stroke="#451a03" strokeWidth="4" fill="none" />
      </svg>
    )
  }
};

export default function MonsterHunt({ detectedCategory, monsterName, onMonsterCaptured, onClose }: MonsterHuntProps) {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [timeLeft, setTimeLeft] = useState(25); // Increased to 25 seconds for kid-friendly interaction
  const [scoreEarned, setScoreEarned] = useState(0);
  const [capturePopups, setCapturePopups] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const requestRef = useRef<number | null>(null);
  const isPlaying = useRef(true);

  // AR Video Camera & Hand Tracking motion state hooks
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameRef = useRef<Uint8ClampedArray | null>(null);
  
  const [arStream, setArStream] = useState<MediaStream | null>(null);
  const [activeSortingMonster, setActiveSortingMonster] = useState<Monster | null>(null);
  const [activeSortingCoords, setActiveSortingCoords] = useState<{ x: number; y: number }>({ x: 100, y: 100 });
  
  // Real-time hand coordinate trackers (% based)
  const [handPos, setHandPos] = useState<{ x: number; y: number } | null>(null);
  const [motionActiveCells, setMotionActiveCells] = useState<{ x: number; y: number }[]>([]);
  
  const isSortingRef = useRef(false);

  // Synchronize state value to mutable ref for async callback closure safety
  useEffect(() => {
    isSortingRef.current = !!activeSortingMonster;
  }, [activeSortingMonster]);

  // Request live camera input as the interactive AR backdrop
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const startArBackground = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        activeStream = stream;
        setArStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn(err));
        }
      } catch (e) {
        console.warn("AR Camera access blocked or unready - displaying fallback simulation backdrop", e);
      }
    };
    startArBackground();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Initialize monsters
  useEffect(() => {
    // Generate 5 active falling monsters.
    const list: Monster[] = [];
    const categories: CategoryType[] = ["plastic", "paper", "can", "milk_carton", "vinyl", "other"];
    
    for (let i = 0; i < 5; i++) {
      const matchType = i < 3 ? detectedCategory : categories[Math.floor(Math.random() * categories.length)];
      const profile = MONSTER_PROFILES[matchType];
      
      list.push({
        id: `monster-${i}-${Date.now()}`,
        type: matchType,
        name: profile.name,
        x: 10 + Math.random() * 80, // initial percentage x (10-90)
        y: -10 - (Math.random() * 50), // staggered top start positions
        scale: 1.0 + Math.random() * 0.3,
        isCaptured: false,
        points: matchType === detectedCategory ? 15 : 10,
        speedX: 0,
        speedY: 0.6 + Math.random() * 0.5, // downward speed
      });
    }
    setMonsters(list);

    // Audio guidance
    sounds.playFail(); // Rumble sound for monster spawn
    setTimeout(() => {
      sounds.speak(`반짝반짝 새로운 쓰레기들이 하늘에서 슬슬 내려옵니다! 카메라 앞에서 손들을 휙휙 흔들어서 쓰레기를 한 번 잡아보세요!`);
    }, 400);

    // Countdown Timer with automatic pause during active educational sorting
    const timer = setInterval(() => {
      if (timeLeft > 0 && isPlaying.current) {
        if (!isSortingRef.current) {
          setTimeLeft((prev) => prev - 1);
        }
      } else if (timeLeft === 0) {
        isPlaying.current = false;
        clearInterval(timer);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      isPlaying.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [detectedCategory]);

  // Combined Web Camera frame motion analyzing and downward items simulation physics
  const processMotionAndPhysics = () => {
    if (!isPlaying.current) return;
    
    if (isSortingRef.current) {
      requestRef.current = requestAnimationFrame(processMotionAndPhysics);
      return;
    }

    // 1. UPDATE FALL PHYSICS OF MONSTERS
    setMonsters((prevMonsters) =>
      prevMonsters.map((m) => {
        if (m.isCaptured) return m;
        
        let newY = m.y + m.speedY * 0.7; // fall down positively
        // Float side to side using simple sine wave to look like realistic paper/leaves falling
        let newX = m.x + Math.sin(m.y / 15) * 0.25;

        // Reset to top if it reaches past the bottom
        if (newY >= 102) {
          newY = -12;
          newX = 10 + Math.random() * 80;
        }

        return {
          ...m,
          x: newX,
          y: newY,
        };
      })
    );

    // 2. REAL-TIME PIXEL DIFFERENCE MOTION DETECTION
    const video = videoRef.current;
    const mCanvas = motionCanvasRef.current;
    if (video && mCanvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = mCanvas.getContext("2d");
      if (ctx) {
        const width = 64;
        const height = 48;
        ctx.drawImage(video, 0, 0, width, height);
        
        try {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;

          if (lastFrameRef.current) {
            const lastData = lastFrameRef.current;
            let totalMotionPixels = 0;
            let sumX = 0;
            let sumY = 0;
            const activeCells: { x: number; y: number }[] = [];

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const rDiff = Math.abs(data[idx] - lastData[idx]);
                const gDiff = Math.abs(data[idx + 1] - lastData[idx + 1]);
                const bDiff = Math.abs(data[idx + 2] - lastData[idx + 2]);
                const totalDiff = rDiff + gDiff + bDiff;

                // Threshold of change
                if (totalDiff > 42) {
                  totalMotionPixels++;
                  sumX += x;
                  sumY += y;

                  if (x % 3 === 0 && y % 3 === 0) {
                    activeCells.push({ x: (x / width) * 100, y: (y / height) * 100 });
                  }
                }
              }
            }

            // If there's enough movement, calculate motion centroid coordinates
            if (totalMotionPixels > 12) {
              const avgX = (sumX / totalMotionPixels / width) * 100;
              const avgY = (sumY / totalMotionPixels / height) * 100;
              
              // Camera streams are typically mirrored. Mirror the X axis to create natural hand pointer feedback!
              const mirroredX = 100 - avgX;

              setHandPos((prev) => {
                if (!prev) return { x: mirroredX, y: avgY };
                // Linear interpolation (Lerp) for silky smooth coordinates transition
                return {
                  x: prev.x + (mirroredX - prev.x) * 0.28,
                  y: prev.y + (avgY - prev.y) * 0.28,
                };
              });

              setMotionActiveCells(activeCells.slice(0, 20));
            } else {
              setHandPos(null);
              setMotionActiveCells([]);
            }
          }

          lastFrameRef.current = data;
        } catch (e) {
          // Guard against safe sandbox frame exceptions
        }
      }
    }

    requestRef.current = requestAnimationFrame(processMotionAndPhysics);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(processMotionAndPhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Trigger capture via Hand motion overlap
  const triggerMotionCapture = (m: Monster) => {
    if (m.isCaptured || !isPlaying.current || activeSortingMonster) return;
    
    sounds.playPop();
    sounds.playChime();
    
    // Scale percentages to pixels inside container frame
    const stageWidth = 800; // approximate
    const stageHeight = 520;
    const x = (m.x / 100) * stageWidth;
    const y = (m.y / 100) * stageHeight;
    
    setActiveSortingCoords({ x, y });
    setActiveSortingMonster(m);
    
    const KoreanType = m.type === "plastic" ? "플라스틱 괴물" :
                       m.type === "paper" ? "종이 상자 괴물" :
                       m.type === "can" ? "캔음료 괴물" :
                       m.type === "milk_carton" ? "우유팩 괴물" :
                       m.type === "vinyl" ? "비닐 괴물" : "일반 쓰레기 괴물";
                       
    sounds.speak(`손 움직임으로 ${KoreanType}을 잡았습니다! 이 쓰레기는 어떤 수거함에 분리수거해야 지구를 지킬까요?`);
  };

  // Real-time Hand cursor overlap test
  useEffect(() => {
    if (!handPos || !isPlaying.current || activeSortingMonster) return;

    // Check collision with any active uncaptured monster
    const found = monsters.find((m) => {
      if (m.isCaptured || m.y < 0) return false;
      const dx = m.x - handPos.x;
      const dy = m.y - handPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < 12; // hit radius 12%
    });

    if (found) {
      triggerMotionCapture(found);
    }
  }, [handPos, monsters]);

  // Capture touch/click action
  const handleCapture = (m: Monster, e: React.MouseEvent) => {
    if (m.isCaptured || !isPlaying.current || activeSortingMonster) return;
    
    sounds.playPop();
    
    // Save coordinate values for future splash animation
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    
    setActiveSortingCoords({ x, y });
    setActiveSortingMonster(m);
    
    const KoreanType = m.type === "plastic" ? "플라스틱 괴물" :
                       m.type === "paper" ? "종이 상자 괴물" :
                       m.type === "can" ? "캔음료 괴물" :
                       m.type === "milk_carton" ? "우유팩 괴물" :
                       m.type === "vinyl" ? "비닐 괴물" : "일반 쓰레기 괴물";
                       
    sounds.speak(`앗! ${KoreanType}을 찾았어요! 이 쓰레기는 어떤 분리수거함에 버려야 할까요? 맞추면 추가 에너지를 얻을 수 있어요!`);
  };

  const handleSortAnswer = (binType: CategoryType) => {
    if (!activeSortingMonster) return;
    
    const m = activeSortingMonster;
    
    if (binType === m.type) {
      // CORRECT!
      sounds.playCatch();
      sounds.playChime();
      
      let msg = "";
      switch (m.type) {
        case "plastic":
          msg = `딩동댕! 정답이에요! 플라스틱 물통은 깨끗이 씻고 라벨을 떼서 파란색 플라스틱 수거함에 버려요!`;
          break;
        case "paper":
          msg = `딩동댕! 정답이에요! 종이 상자와 페이퍼는 부착된 테이프를 떼고 노란색 종이 분리수거함에 납작하게 펼쳐 버려요!`;
          break;
        case "can":
          msg = `딩동댕! 정답이에요! 튼튼한 금속 캔은 내용물을 비우고 비틀어 찌그러트려서 녹색 캔 수거함에 버려요!`;
          break;
        case "milk_carton":
          msg = `딩동댕! 정답이에요! 종이팩과 우유팩은 씻고 쫙 펼쳐서 전용 종이팩 수거함에 넣어줘요!`;
          break;
        case "vinyl":
          msg = `딩동댕! 정답이에요! 비닐봉지와 과자봉지는 딱지접기를 하지 않고 그대로 투명 비닐수거함에 납작하게 버려요!`;
          break;
        default:
          msg = `딩동댕! 정답이에요! 음식물이 묻어 오염된 쓰레기나 재활용이 어려운 은박지는 꼭 일반 쓰레기통 종량제 봉투에 담아 버려요!`;
      }
      sounds.speak(msg);
      
      const popupId = `popup-${Date.now()}`;
      setCapturePopups((prev) => [
        ...prev,
        { id: popupId, x: activeSortingCoords.x, y: activeSortingCoords.y, text: `분리수거 대성공! +${m.points}⚡` }
      ]);
      
      setMonsters((prev) =>
        prev.map((item) => (item.id === m.id ? { ...item, isCaptured: true } : item))
      );
      setScoreEarned((prev) => prev + m.points);
      
      // Self-delete splash text
      setTimeout(() => {
        setCapturePopups((prev) => prev.filter((p) => p.id !== popupId));
      }, 1500);
      
      setActiveSortingMonster(null);
    } else {
      // INCORRECT!
      sounds.playFail();
      
      let msg = "";
      switch (m.type) {
        case "plastic":
          msg = `앗, 아쉬워요! 이건 플라스틱 괴물이라 플라스틱 수거함에 들어가야 안전해요! 다시 한 번 골라볼까요?`;
          break;
        case "paper":
          msg = `앗, 아쉬워요! 알록달록 종이로 만든 괴물이라 종이 분리수거함에 가야 해요! 다시 한 번 골라볼까요?`;
          break;
        case "can":
          msg = `앗, 아쉬워요! 쇠와 캔으로 된 녀석이라 반짝이는 캔 수거함으로 가야 해요! 다시 한 번 골라볼까요?`;
          break;
        case "milk_carton":
          msg = `앗, 아쉬워요! 맛있는 우유가 들었던 우유팩 괴물이라 우유팩 전용 분리수거함에 가야 해요! 다시 한 번 골라볼까요?`;
          break;
        case "vinyl":
          msg = `앗, 아쉬워요! 바스락 비닐로 만들어진 비닐 괴물이라 보라색 비닐 수거함에 가야 해요! 다시 한 번 골라볼까요?`;
          break;
        default:
          msg = `앗, 아쉬워요! 이 쓰레기는 다른 수거함이 아니라 일반 회색 쓰레기통에 담아야 해요! 다시 한 번 골라볼까요?`;
      }
      sounds.speak(msg);
    }
  };

  // Complete game and forward points to parent App
  const handleFinish = () => {
    isPlaying.current = false;
    onMonsterCaptured(scoreEarned);
  };

  const activeProfile = MONSTER_PROFILES[detectedCategory];
  const allCaught = monsters.length > 0 && monsters.every((m) => m.isCaptured);

  useEffect(() => {
    if (allCaught && isPlaying.current) {
      isPlaying.current = false;
      sounds.playChime();
      sounds.speak(`축하합니다! 눈부신 솜씨로 교실 바닥의 모든 쓰레기 괴물들을 남김없이 다 잡았어요!`);
    }
  }, [allCaught]);

  return (
    <div id="monster-hunt" className="fixed inset-0 z-55 bg-slate-950 flex flex-col items-center justify-center text-white select-none">
      
      {/* Background Radar grid effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,58,138,0.3)_0%,rgba(2,6,23,1)_95%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

      {/* Top HUD */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-900/40 backdrop-blur-md rounded-b-2xl">
        <div className="flex items-center space-x-3">
          <Crosshair className="text-red-500 animate-spin" size={24} />
          <div>
            <h3 className="text-base font-bold font-sans tracking-tight text-yellow-300">단계 2: AR 쓰레기 괴물 잡기</h3>
            <p className="text-[11px] text-slate-300">
              구슬 괴물을 눌러 에너지를 구하세요! 현재 주표적: <span className="font-extrabold text-blue-300">{monsterName}</span>
            </p>
          </div>
        </div>

        {/* Counter Indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-white/5">
            <Timer size={15} className="text-red-400" />
            <span className="text-sm font-mono font-bold text-red-300">
              {timeLeft > 0 ? `${timeLeft}초` : "시간 종료!"}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-lg font-bold text-sm">
            <Zap size={14} className="fill-slate-950" />
            <span>획득 에너지: +{scoreEarned}⚡</span>
          </div>
        </div>
      </div>

      {/* Interactive AR Stage Frame */}
      <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-4">
        
        <div className="relative w-full h-[520px] rounded-2xl bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-2xl backdrop-blur-xs">
          
          {/* Live AR Camera Feed Background */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-50 z-0 bg-slate-900"
          />

          {/* Hidden Canvas for real time pixel differencing math */}
          <canvas ref={motionCanvasRef} style={{ display: "none" }} width={64} height={48} />

          {/* Real-time green glowing motion feedback grids */}
          {motionActiveCells.map((cell, idx) => (
            <div
              key={`motion-dot-${idx}`}
              className="absolute w-2 h-2 bg-[#10B981]/50 border border-[#34D399]/40 rounded-full animate-ping pointer-events-none z-10"
              style={{ left: `${100 - cell.x}%`, top: `${cell.y}%` }}
            />
          ))}

          {/* Aesthetic real-time Hand Motion Pointer overlay */}
          {handPos && (
            <div
              style={{
                position: "absolute",
                left: `${handPos.x}%`,
                top: `${handPos.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 35
              }}
              className="flex flex-col items-center justify-center pointer-events-none transition-all duration-75"
            >
              {/* Glowing holographic radar ring */}
              <div className="w-14 h-14 rounded-full border-4 border-dashed border-yellow-400 animate-spin absolute" style={{ animationDuration: "2.5s" }} />
              <div className="w-10 h-10 bg-yellow-400/20 border-2 border-yellow-350 rounded-full animate-pulse absolute" />
              <span className="text-3xl z-10 filter drop-shadow-md animate-bounce">✋</span>
              <span className="absolute -bottom-8 bg-[#1e293b] border border-yellow-400/70 text-white font-sans text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                지키미 손동작 ✋
              </span>
            </div>
          )}

          {/* Virtual camera scanning HUD frames */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-yellow-450 opacity-40 pointer-events-none z-10" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-yellow-450 opacity-40 pointer-events-none z-10" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-yellow-450 opacity-40 pointer-events-none z-10" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-yellow-450 opacity-40 pointer-events-none z-10" />

          {/* Floating radar sweep lines */}
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-emerald-500/10 pointer-events-none z-10" />
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500/10 pointer-events-none z-10" />

          {/* Render floating floating creatures */}
          {monsters.map((m) => (
            <AnimatePresence key={m.id}>
              {!m.isCaptured && (
                <motion.div
                  style={{
                    position: "absolute",
                    left: `${m.x}%`,
                    top: `${m.y}%`,
                    width: `${65 * m.scale}px`,
                    height: `${65 * m.scale}px`,
                    cursor: "pointer",
                    zIndex: 20
                  }}
                  whileHover={{ scale: 1.15 }}
                  onClick={(e) => handleCapture(m, e)}
                  id={`ar-monster-${m.id}`}
                  className="transform -translate-x-1/2 -translate-y-1/2 transition-shadow duration-200"
                >
                  {/* Glowing core */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${MONSTER_PROFILES[m.type].color} opacity-20 blur-xl scale-125`} />
                  
                  {/* SVG monster avatar */}
                  {MONSTER_PROFILES[m.type].svg}

                  {/* Little helper banner for children */}
                  <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-950/80 border border-slate-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded text-yellow-300 pointer-events-none whitespace-nowrap">
                    {m.name}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}

          {/* Render point click labels */}
          {capturePopups.map((pop) => (
            <motion.div
              key={pop.id}
              initial={{ scale: 0.5, y: pop.y - 10, opacity: 1 }}
              animate={{ scale: 1.4, y: pop.y - 60, opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute font-sans font-extrabold text-yellow-400 text-lg pointer-events-none z-30"
              style={{ left: pop.x - 30, top: pop.y }}
            >
              {pop.text}
            </motion.div>
          ))}

          {/* Recycling sorting choice interactive modal overlay */}
          <AnimatePresence>
            {activeSortingMonster && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-x-4 inset-y-4 rounded-xl bg-slate-950/95 border-2 border-yellow-400/55 z-40 flex flex-col items-center justify-center p-4 text-center overflow-y-auto"
              >
                {/* Visual feedback icon */}
                <div className="relative mb-2.5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-400/15 border-2 border-yellow-400 absolute animate-ping duration-1000" />
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-yellow-400 flex items-center justify-center text-2xl z-10">
                    {MONSTER_PROFILES[activeSortingMonster.type].emoji}
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-white mb-0.5">
                  🎉 {activeSortingMonster.name} 발견 완료!
                </h3>
                <p className="text-xs text-yellow-300 font-semibold mb-3">
                  "이 피조물/쓰레기는 어디 분리수거함에 버려야 안전하게 정화될까요?"
                </p>

                {/* Bins selection grids */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 w-full max-w-md">
                  {[
                    { type: "plastic", label: "플라스틱 수거함", icon: "🥤", color: "bg-blue-600 hover:bg-blue-500 border-blue-450 text-white" },
                    { type: "paper", label: "종이 수거함", icon: "📦", color: "bg-amber-600 hover:bg-amber-500 border-amber-550 text-white" },
                    { type: "can", label: "캔류 수거함", icon: "🥫", color: "bg-emerald-600 hover:bg-emerald-500 border-emerald-550 text-white" },
                    { type: "milk_carton", label: "우유팩 수거함", icon: "🥛", color: "bg-pink-600 hover:bg-pink-500 border-pink-500 text-white" },
                    { type: "vinyl", label: "비닐 수거함", icon: "🛍️", color: "bg-purple-600 hover:bg-purple-500 border-purple-500 text-white" },
                    { type: "other", label: "일반 쓰레기통", icon: "🗑️", color: "bg-slate-600 hover:bg-slate-500 border-slate-500 text-white" },
                  ].map((bin) => (
                    <button
                      key={bin.type}
                      onClick={() => handleSortAnswer(bin.type as CategoryType)}
                      className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl text-xs font-bold border-2 transition active:scale-95 space-y-1 shadow-lg cursor-pointer ${bin.color}`}
                    >
                      <span className="text-xl">{bin.icon}</span>
                      <span>{bin.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 mt-3 max-w-xs leading-tight">
                  올바른 수거함을 선택해 터치하면 에너지가 {activeSortingMonster.points}⚡ 충전되며, 달님이 고유 분리수거 방법을 이야기해 주실 거예요!
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game Over / Win State Banner inside stage */}
          {(!isPlaying.current || allCaught) && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center">
              <div className="p-4 bg-yellow-450/10 rounded-full border border-yellow-500/20 mb-4 text-5xl">
                {allCaught ? "🏆" : "⌛"}
              </div>
              
              <h4 className="text-2xl font-black text-yellow-300">
                {allCaught ? "우와! 괴물 물리치기 대성공!" : "시간이 마감되었어요!"}
              </h4>
              <p className="text-slate-350 text-xs max-w-sm mt-1 mb-5 leading-relaxed">
                {allCaught
                  ? "단 한마리도 놓치지 않고 깨끗이 잡았어요! 지구 수호대 어린이 최고에요!"
                  : "괴물들이 교실 속으로 꼭꼭 숨었어요! 하지만 획득한 연료 에너지를 쓰레기차에 넣어볼게요!"}
              </p>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center space-x-4 mb-6">
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono uppercase">획득한 보너스 연료</span>
                  <span className="text-xl font-bold font-mono text-yellow-300">+{scoreEarned} 에너지고</span>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">물리친 괴물 수</span>
                  <span className="text-xl font-bold text-white">
                    {monsters.filter((mon) => mon.isCaptured).length}마리 / {monsters.length}마리
                  </span>
                </div>
              </div>

              <button
                onClick={handleFinish}
                id="btn-complete-hunt"
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold rounded-xl text-sm transition transform hover:from-emerald-400 hover:to-teal-400 shadow-lg"
              >
                에너지 가지고 마을 쓰레기차로 가기!
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Safety Instructions */}
      <div className="relative z-10 w-full max-w-4xl px-4 py-3 flex items-center justify-center space-x-2 text-slate-400 text-[10px]">
        <ShieldCheck size={12} className="text-emerald-500" />
        <span>유치원생 어린이는 게임 플레이 시 교실 주변의 진짜 책상과 가구 모서리에 부딪히지 않게 조심히 한 자리에 서서 안전하게 터치해주세요! 선생님과 함께 놀이해요!</span>
      </div>
    </div>
  );
}
