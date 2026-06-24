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
  const [timeLeft, setTimeLeft] = useState(40); // Set to 40 seconds as requested!
  const [scoreEarned, setScoreEarned] = useState(0);
  const [capturedCount, setCapturedCount] = useState(0); // Track total count of captured items
  const [isGameOver, setIsGameOver] = useState(false); // Game over status indicator
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

  // Dedicated Countdown Timer
  useEffect(() => {
    if (isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          isPlaying.current = false;
          sounds.playChime();
          sounds.speak(`와우! 시간이 다 되었어요! 무려 ${capturedCount}마리의 쓰레기들을 멋지게 퇴치했군요! 대단해요!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameOver, capturedCount]);

  // Initialize monsters
  useEffect(() => {
    // Generate 8 active falling monsters for abundance and fun!
    const list: Monster[] = [];
    const categories: CategoryType[] = ["plastic", "paper", "can", "milk_carton", "vinyl", "other"];
    
    for (let i = 0; i < 8; i++) {
      const matchType = i < 4 ? detectedCategory : categories[Math.floor(Math.random() * categories.length)];
      const profile = MONSTER_PROFILES[matchType];
      
      list.push({
        id: `monster-${i}-${Date.now()}-${Math.random()}`,
        type: matchType,
        name: profile.name,
        x: 10 + Math.random() * 80, // initial percentage x (10-90)
        y: -15 - (Math.random() * 50), // staggered top start positions
        scale: 1.1 + Math.random() * 0.25,
        isCaptured: false,
        points: matchType === detectedCategory ? 15 : 10,
        speedX: 0,
        speedY: 0.6 + Math.random() * 0.6, // downward speed
      });
    }
    setMonsters(list);

    // Audio guidance
    sounds.playFail(); // Rumble sound for monster spawn
    setTimeout(() => {
      sounds.speak(`반짝반짝 쓰레기들이 하늘에서 내려옵니다! 카메라 앞에서 손을 흔들거나 직접 터치해서 제한시간 40초 동안 많이 잡아주세요!`);
    }, 400);

    return () => {
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

                // Threshold of change - lowered to 25 to register subtle movements in kid-friendly environment
                if (totalDiff > 25) {
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
            if (totalMotionPixels > 8) {
              const avgX = (sumX / totalMotionPixels / width) * 100;
              const avgY = (sumY / totalMotionPixels / height) * 100;
              
              // Use unmirrored raw X coordinate so tracking perfectly follows unmirrored camera stream
              const trackedX = avgX;

              setHandPos((prev) => {
                if (!prev) return { x: trackedX, y: avgY };
                // Linear interpolation (Lerp) for silky smooth coordinates transition - increased to 0.45 for snappy follow
                return {
                  x: prev.x + (trackedX - prev.x) * 0.45,
                  y: prev.y + (avgY - prev.y) * 0.45,
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
    if (m.isCaptured || !isPlaying.current) return;
    
    sounds.playPop();
    sounds.playCatch();
    sounds.playChime();
    
    // Scale percentages to pixels inside container frame
    const stageWidth = 800; // approximate
    const stageHeight = 520;
    const x = (m.x / 100) * stageWidth;
    const y = (m.y / 100) * stageHeight;
    
    setActiveSortingCoords({ x, y });
    
    const KoreanType = m.type === "plastic" ? "플라스틱 괴물" :
                       m.type === "paper" ? "종이 상자 괴물" :
                       m.type === "can" ? "캔음료 괴물" :
                       m.type === "milk_carton" ? "우유팩 괴물" :
                       m.type === "vinyl" ? "비닐 괴물" : "일반 쓰레기 괴물";
                       
    sounds.speak(`손으로 ${KoreanType} 퇴치! +${m.points} 에너지!`);

    const popupId = `popup-${Date.now()}-${Math.random()}`;
    setCapturePopups((prev) => [
      ...prev,
      { id: popupId, x, y, text: `퇴치! +${m.points}⚡` }
    ]);
    
    // Increment stats
    setCapturedCount((prev) => prev + 1);
    setScoreEarned((prev) => prev + m.points);

    // Swap captured monster immediately with a fresh randomized monster at the top of the stream!
    setMonsters((prev) =>
      prev.map((item) => {
        if (item.id === m.id) {
          const categories: CategoryType[] = ["plastic", "paper", "can", "milk_carton", "vinyl", "other"];
          const matchType = categories[Math.floor(Math.random() * categories.length)];
          const profile = MONSTER_PROFILES[matchType];
          return {
            id: `monster-${Date.now()}-${Math.random()}`,
            type: matchType,
            name: profile.name,
            x: 10 + Math.random() * 80,
            y: -15 - (Math.random() * 25), // Start above top boundary
            scale: 1.1 + Math.random() * 0.25,
            isCaptured: false,
            points: matchType === detectedCategory ? 15 : 10,
            speedX: 0,
            speedY: 0.6 + Math.random() * 0.6,
          };
        }
        return item;
      })
    );
    
    // Self-delete splash text
    setTimeout(() => {
      setCapturePopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1500);
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
      return dist < 18; // Increased hit radius from 12% to 18% for much easier captures!
    });

    if (found) {
      triggerMotionCapture(found);
    }
  }, [handPos, monsters]);

  // Capture touch/click action
  const handleCapture = (m: Monster, e: React.MouseEvent) => {
    if (m.isCaptured || !isPlaying.current) return;
    
    sounds.playPop();
    sounds.playCatch();
    sounds.playChime();
    
    // Save coordinate values for future splash animation
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    
    setActiveSortingCoords({ x, y });
    
    const KoreanType = m.type === "plastic" ? "플라스틱 괴물" :
                       m.type === "paper" ? "종이 상자 괴물" :
                       m.type === "can" ? "캔음료 괴물" :
                       m.type === "milk_carton" ? "우유팩 괴물" :
                       m.type === "vinyl" ? "비닐 괴물" : "일반 쓰레기 괴물";
                       
    sounds.speak(`터치로 ${KoreanType} 퇴치! +${m.points} 에너지!`);

    const popupId = `popup-${Date.now()}-${Math.random()}`;
    setCapturePopups((prev) => [
      ...prev,
      { id: popupId, x, y, text: `퇴치! +${m.points}⚡` }
    ]);
    
    // Increment stats
    setCapturedCount((prev) => prev + 1);
    setScoreEarned((prev) => prev + m.points);

    // Swap captured monster immediately with a fresh randomized monster at the top of the stream!
    setMonsters((prev) =>
      prev.map((item) => {
        if (item.id === m.id) {
          const categories: CategoryType[] = ["plastic", "paper", "can", "milk_carton", "vinyl", "other"];
          const matchType = categories[Math.floor(Math.random() * categories.length)];
          const profile = MONSTER_PROFILES[matchType];
          return {
            id: `monster-${Date.now()}-${Math.random()}`,
            type: matchType,
            name: profile.name,
            x: 10 + Math.random() * 80,
            y: -15 - (Math.random() * 25), // Start above top boundary
            scale: 1.1 + Math.random() * 0.25,
            isCaptured: false,
            points: matchType === detectedCategory ? 15 : 10,
            speedX: 0,
            speedY: 0.6 + Math.random() * 0.6,
          };
        }
        return item;
      })
    );
    
    // Self-delete splash text
    setTimeout(() => {
      setCapturePopups((prev) => prev.filter((p) => p.id !== popupId));
    }, 1500);
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
      sounds.speak(`축하합니다! 눈부신 솜씨로 쓰레기산의 모든 쓰레기 괴물들을 남김없이 다 잡았어요!`);
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
              style={{ left: `${cell.x}%`, top: `${cell.y}%` }}
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
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-emerald-400 animate-spin absolute" style={{ animationDuration: "2s" }} />
              <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-400 rounded-full animate-pulse absolute" />
              
              {/* High-visibility tracked point dot for instant parent/child verification */}
              <div className="w-4 h-4 bg-rose-500 rounded-full border-2 border-white absolute animate-ping z-20" />
              <div className="w-3 h-3 bg-rose-600 rounded-full border border-white absolute z-20 shadow-md" />

              <span className="text-4xl z-10 filter drop-shadow-md animate-bounce">✋</span>
              <span className="absolute -bottom-8 bg-slate-900 border-2 border-emerald-400 text-emerald-300 font-sans text-[10px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-ping" />
                <span>지키미 동작 인식 중 ✋</span>
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
                    width: `${90 * m.scale}px`, // Increased base size from 65px to 90px for larger click targets!
                    height: `${90 * m.scale}px`,
                    cursor: "pointer",
                    zIndex: 20
                  }}
                  whileHover={{ scale: 1.15 }}
                  onClick={(e) => handleCapture(m, e)}
                  id={`ar-monster-${m.id}`}
                  className="transform -translate-x-1/2 -translate-y-1/2 transition-shadow duration-200"
                >
                  {/* Glowing core */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${MONSTER_PROFILES[m.type].color} opacity-35 blur-xl scale-125`} />
                  
                  {/* Container for styled SVG + high-contrast emoji overlay */}
                  <div className="w-full h-full relative p-2 bg-slate-900/55 rounded-full border-2 border-white/30 backdrop-blur-sm shadow-xl flex items-center justify-center">
                    {MONSTER_PROFILES[m.type].svg}
                    
                    {/* Extra clear, bouncing emoji bubble for immediate visual recognition! */}
                    <div className="absolute -top-3.5 -right-3.5 w-10 h-10 rounded-full bg-white border-3 border-emerald-400 flex items-center justify-center text-xl shadow-lg z-30 animate-bounce">
                      {MONSTER_PROFILES[m.type].emoji}
                    </div>
                  </div>

                  {/* Clean text banner for kids */}
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-950/90 border border-emerald-400 text-[11px] font-black px-2.5 py-0.5 rounded-full text-emerald-300 pointer-events-none whitespace-nowrap shadow-md flex items-center gap-1 z-30">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span>{m.name}</span>
                  </div>
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
              className="absolute font-sans font-extrabold text-yellow-450 text-lg pointer-events-none z-30"
              style={{ left: pop.x - 30, top: pop.y }}
            >
              {pop.text}
            </motion.div>
          ))}

          {/* Game Over State Banner inside stage */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 text-center">
              <div className="p-4 bg-yellow-450/10 rounded-full border border-yellow-500/20 mb-4 text-5xl">
                🏆
              </div>
              
              <h4 className="text-2xl font-black text-yellow-300">
                시간이 마감되었어요!
              </h4>
              <p className="text-slate-300 text-xs max-w-sm mt-1 mb-5 leading-relaxed">
                40초 동안 하늘에서 내려온 쓰레기들을 정말 열심히 분리 정화했군요! 지구 지키기 성공이에요!
              </p>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center space-x-4 mb-6">
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono uppercase">획득한 보너스 연료</span>
                  <span className="text-xl font-bold font-mono text-yellow-300">+{scoreEarned} 에너지</span>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <span className="text-slate-500 text-[10px] block font-mono">물리친 쓰레기 괴물 수</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {capturedCount}마리 퇴치 완료!
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
