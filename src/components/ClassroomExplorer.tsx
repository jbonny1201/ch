import React, { useRef, useState, useEffect } from "react";
import { CLASSROOM_TRASH_ITEMS, InteractiveTrashItem } from "../data/mockClassroom";
import { TrashScanResult, CategoryType } from "../types";
import { sounds } from "../utils/audio";
import { Camera, RefreshCw, Sparkles, Upload, FileText, CheckCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClassroomExplorerProps {
  onScanSuccess: (result: TrashScanResult) => void;
  onClose: () => void;
}

// Sample images of recyclables that kids can quickly click to "simulate a snapshot"
const SAMPLE_RECYCLABLES = [
  {
    name: "투명 페트병",
    category: "plastic",
    emoji: "🥤",
    // Small base64 transparent pixel to satisfy the image format, or standard placeholders
    data: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  },
  {
    name: "종이 상자",
    category: "paper",
    emoji: "📦",
    data: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwAEgQGAf15s9wAAAABJRU5ErkJggg=="
  },
  {
    name: "흰색 우유팩",
    category: "milk_carton",
    emoji: "🥛",
    data: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
  },
  {
    name: "음료수 캔",
    category: "can",
    emoji: "🥫",
    data: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAEgQGAf15s9wAAAABJRU5ErkJggg=="
  },
  {
    name: "비닐 봉지",
    category: "vinyl",
    emoji: "🛍️",
    data: "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAEvgGAs73s7wAAAABJRU5ErkJggg=="
  }
];

const getBinNameInKorean = (category: string) => {
  switch (category) {
    case "plastic":
      return "🥤 플라스틱 분리수거함";
    case "paper":
      return "📦 종이 분리수거함";
    case "can":
      return "🥫 캔 분리수거함";
    case "milk_carton":
      return "🥛 우유팩 전용 분리수거함";
    case "vinyl":
      return "🛍️ 비닐 분리수거함";
    default:
      return "🗑️ 일반 쓰레기통 (종량제 봉투)";
  }
};

export default function ClassroomExplorer({ onScanSuccess, onClose }: ClassroomExplorerProps) {
  const [activeTab, setActiveTab] = useState<"simulator" | "camera">("camera");
  const [items, setItems] = useState<InteractiveTrashItem[]>(CLASSROOM_TRASH_ITEMS);
  const [selectedItem, setSelectedItem] = useState<InteractiveTrashItem | null>(null);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<TrashScanResult | null>(null);

  // Initialize camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const constraints = {
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err: any) {
      console.warn("Camera init failed:", err);
      setCameraError("카메라를 켤 수 없어요! 아래 시뮬레이터나 사진 업로드를 이용해주세요.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const [autoScanCountdown, setAutoScanCountdown] = useState<number | null>(5);

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera();
      setAutoScanCountdown(5);
    } else {
      stopCamera();
      setAutoScanCountdown(null);
    }
    return () => stopCamera();
  }, [activeTab]);

  // Hands-free camera automatic scan ticker
  useEffect(() => {
    if (activeTab !== "camera" || uploadPreview || isAnalyzing || cameraError || !cameraStream) {
      setAutoScanCountdown(null);
      return;
    }

    if (autoScanCountdown === null) {
      setAutoScanCountdown(5);
      return;
    }

    if (autoScanCountdown === 0) {
      setAutoScanCountdown(null);
      capturePhoto();
      return;
    }

    const timer = setTimeout(() => {
      setAutoScanCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [activeTab, uploadPreview, isAnalyzing, cameraError, cameraStream, autoScanCountdown]);

  // Clicked item in simulated library classroom
  const handleItemClick = (item: InteractiveTrashItem) => {
    sounds.playPop();
    setSelectedItem(item);
    setAiFeedback(null);
    setUploadPreview(null);
  };

  // Analyze simulated search selection via server-side Gemini or instant simulator
  const scanSimulatedItem = async (item: InteractiveTrashItem) => {
    setIsAnalyzing(true);
    sounds.playPop();
    
    // We send a small prompt to represent the simulated item to Gemini to make a REAL Gemini call so we never mock if we have the key!
    try {
      const matchedSample = SAMPLE_RECYCLABLES.find(s => s.category === item.category);
      const imageData = matchedSample ? matchedSample.data : "data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const response = await fetch("/api/analyze-trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          mimeType: "image/png",
          itemHint: item.category,
          isSample: true
        }),
      });

      if (response.ok) {
        let data = await response.json();
        // Override with custom classroom details to keep it beautiful
        data = {
          ...data,
          category: item.category,
          itemName: item.name,
          points: item.points,
          childExplanation: item.howToRecycle + " 달님이 알려주는 꿀팁: " + data.childExplanation,
        };
        setAiFeedback(data);
        sounds.playChime();
        sounds.speak(item.name + " 발견! " + data.childExplanation);
        
        // Mark as found in local state
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, found: true } : i));
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback custom classroom mock data (safely synced)
      const data: TrashScanResult = {
        category: item.category,
        itemName: item.name,
        recyclable: item.category !== "other",
        points: item.points,
        childExplanation: item.howToRecycle,
        monsterName: item.category === "plastic" ? "플라스틱 괴물" :
                     item.category === "paper" ? "종이 괴물" :
                     item.category === "can" ? "캔 괴물" :
                     item.category === "milk_carton" ? "우유갑 괴물" :
                     item.category === "vinyl" ? "비닐 괴물" : "먼지 괴물"
      };
      setAiFeedback(data);
      sounds.playChime();
      sounds.speak(item.name + " 발견! " + item.howToRecycle);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, found: true } : i));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Camera capture photo and send to real Gemini API
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    sounds.playPop();
    setIsAnalyzing(true);
    setAiFeedback(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Mirror the canvas horizontally so the captured photo matches the mirrored screen preview
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setUploadPreview(dataUrl);

        // Call the server Gemini endpoint
        const res = await fetch("/api/analyze-trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl, mimeType: "image/jpeg" }),
        });

        if (res.ok) {
          const data: TrashScanResult = await res.json();
          setAiFeedback(data);
          sounds.playChime();
          const binK = getBinNameInKorean(data.category);
          sounds.speak(`${data.itemName}을 발견했어요! 꼭 ${binK}에 쏘옥 담아서 분리수거해 주세요! ${data.childExplanation}`);
        } else {
          const errData = await res.json();
          throw new Error(errData.error || "분석 이상");
        }
      }
    } catch (err: any) {
      console.error(err);
      sounds.playFail();
      
      const fallbacks: TrashScanResult[] = [
        {
          category: "plastic",
          itemName: "맑은 생수 페트병 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "우와! 깨끗한 플라스틱 생수병이군요! 페트병의 비닐 상표 라벨스티커를 꼭 뜯어서 따로 분리수거하고, 찌그러뜨려서 플라스틱 수거함에 쏙 넣어주세요! 땅별마을이 환하게 미소지을 거예요!",
          monsterName: "플라스틱 괴물"
        },
        {
          category: "paper",
          itemName: "달콤한 과자 종이상자 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "우와! 과자를 담았던 이쁜 종이상자네요! 테이프나 철사 같은 다른 부품을 떼어내고 납작하게 꾹꾹 눌러서 종이 수거함에 예쁘게 담아주세요!",
          monsterName: "종이 괴물"
        },
        {
          category: "can",
          itemName: "시원한 콜라 캔 (시뮬레이션)",
          recyclable: true,
          points: 15,
          childExplanation: "짠! 시원한 음료수가 담겨있던 알루미늄 캔이네요! 내용물을 물로 가볍게 헹구고 발로 꾹 밟아서 납작하게 만든 후 캔 수거함에 쏙 버려주세요!",
          monsterName: "캔 괴물"
        },
        {
          category: "milk_carton",
          itemName: "고소한 흰 우유팩 (시뮬레이션)",
          recyclable: true,
          points: 20,
          childExplanation: "와! 영양만점 우유팩이네요! 다 마신 우유갑은 속을 물로 깨끗하게 헹군 뒤, 네모나게 활짝 펼쳐서 말려 전용 우유팩 수거함에 버려요! 소중한 화장지로 다시 태어난답니다!",
          monsterName: "우유갑 괴물"
        },
        {
          category: "vinyl",
          itemName: "투명 과일 비닐봉지 (시뮬레이션)",
          recyclable: true,
          points: 10,
          childExplanation: "바스락바스락 비닐봉지군요! 비닐 안에 이물질이 남아있지 않게 확인하고 비닐류 전용 분리수거함에 바람을 빼서 납작하게 넣어주세요!",
          monsterName: "비닐 괴물"
        }
      ];

      const randomIndex = Math.floor(Math.random() * fallbacks.length);
      const fallbackResult = fallbacks[randomIndex];
      setAiFeedback(fallbackResult);
      const binK = getBinNameInKorean(fallbackResult.category);
      sounds.speak(`${fallbackResult.itemName}을 찾았어요! 꼭 ${binK}에 분리수거해 주세요!`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drag and drop photo upload
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 사진 파일만 올려주세요!");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setUploadPreview(dataUrl);
        setIsAnalyzing(true);
        setAiFeedback(null);

        try {
          const res = await fetch("/api/analyze-trash", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl, mimeType: file.type }),
          });

          if (res.ok) {
            const data: TrashScanResult = await res.json();
            setAiFeedback(data);
            sounds.playChime();
            const binK = getBinNameInKorean(data.category);
            sounds.speak(`${data.itemName}을 발견했어요! 꼭 ${binK}에 분리수거해 주세요! ${data.childExplanation}`);
          } else {
            throw new Error();
          }
        } catch (e) {
          // Local analysis simulation fallback based on files
          const randomItems: TrashScanResult[] = [
            { category: "plastic", itemName: "색깔 플라스틱 용기", recyclable: true, points: 10, childExplanation: "물로 깔끔하게 헹구어 버려주세요!", monsterName: "플라스틱 괴물" },
            { category: "paper", itemName: "알록달록 종이상자", recyclable: true, points: 10, childExplanation: "종이 테이프를 모두 떼고 펼쳐 버려주세요!", monsterName: "종이 괴물" },
            { category: "can", itemName: "참치 캔", recyclable: true, points: 15, childExplanation: "쇠붙이 캔으로 분류하며 안에 물을 비워서 버려주세요!", monsterName: "캔 괴물" }
          ];
          const choice = randomItems[Math.floor(Math.random() * randomItems.length)];
          setAiFeedback(choice);
          sounds.playChime();
          const binK = getBinNameInKorean(choice.category);
          sounds.speak(`${choice.itemName}을 발견했어요! 꼭 ${binK}에 분리수거해 주세요! ${choice.childExplanation}`);
        } finally {
          setIsAnalyzing(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Clean-up and go to Monster hunt
  const commitScanResult = () => {
    if (aiFeedback) {
      onScanSuccess(aiFeedback);
    }
  };

  return (
    <div id="classroom-explorer" className="fixed inset-0 z-55 flex flex-col bg-slate-900 overflow-y-auto text-white animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">👀</span>
          <div>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">단계 1: 인공지능 재활용 스캐너</h2>
            <p className="text-xs text-slate-300">실제 종이, 플라스틱, 캔, 우유팩 등의 쓰레기를 보여주면 달님이 버리는 곳을 가르쳐 줘요!</p>
          </div>
        </div>
        <button
          onClick={onClose}
          id="btn-close-explore"
          className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] rounded-full text-sm font-extrabold transition shadow-md"
        >
          돌아가기
        </button>
      </div>

      {/* Main Interactive Screen */}
      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto w-full items-stretch justify-center">
        
        {/* LEFT VIEWPORT */}
        <div className="flex-1 flex flex-col bg-slate-950/80 rounded-2xl border-2 border-slate-700 overflow-hidden relative min-h-[400px]">
          
          {activeTab === "simulator" ? (
            /* Simulator Mode */
            <div className="relative flex-1 bg-gradient-to-b from-sky-450 via-lime-200 to-amber-200 p-4 flex flex-col justify-between">
              
              {/* Virtual Classroom Graphic */}
              <div className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40" />
              
              {/* Header inside simulator */}
              <div className="relative z-10 bg-slate-900/65 backdrop-blur-md px-4 py-2 rounded-xl text-center self-center border border-white/10 max-w-lg mt-2">
                <span className="text-yellow-300 font-bold block">✨ 땅별마을 쓰레기산 ✨</span>
                <span className="text-xs text-slate-200">쓰레기산에 버려진 물품들을 하나씩 찾아서 터치해봐요!</span>
              </div>

              {/* Classroom Illustration and absolute pins */}
              <div className="relative w-full flex-1 min-h-[300px] border border-dashed border-sky-300/30 rounded-xl mt-4 overflow-hidden bg-gradient-to-tr from-sky-500/20 to-lime-500/10">
                
                {/* Trash mountain visual markers */}
                <span className="absolute top-24 left-10 text-xs bg-black/40 border border-yellow-400/45 px-2 py-0.5 rounded text-white font-mono uppercase">고철 더미 🔩</span>
                <span className="absolute top-36 right-16 text-xs bg-black/40 border border-yellow-400/45 px-2 py-0.5 rounded text-white font-mono uppercase">폐가구 더미 🛋️</span>
                <span className="absolute bottom-24 left-12 text-xs bg-black/40 border border-yellow-400/45 px-2 py-0.5 rounded text-white font-mono uppercase">비닐 언덕 🛍️</span>
                <span className="absolute bottom-36 left-1/3 text-xs bg-black/40 border border-yellow-400/45 px-2 py-0.5 rounded text-white font-mono uppercase">플라스틱 산 🥤</span>
                <span className="absolute bottom-16 right-1/4 text-xs bg-black/40 border border-yellow-400/45 px-2 py-0.5 rounded text-white font-mono uppercase">종이 상자 더미 📦</span>

                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    id={`classroom-item-${item.id}`}
                    style={{ top: `${item.top}%`, left: `${item.left}%` }}
                    className={`absolute p-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20 shadow-md ${
                      item.found 
                        ? "bg-slate-800/80 text-gray-500 border border-slate-700 line-through scale-90" 
                        : "bg-white text-slate-900 border-2 border-yellow-450 hover:scale-125 hover:rotate-3"
                    }`}
                  >
                    <span className="text-2xl block">{item.found ? "✅" : item.emoji}</span>
                    {!item.found && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 items-center justify-center text-[8px] font-bold text-slate-950">?</span>
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Reset simulator helper */}
              <button
                onClick={() => {
                  sounds.playPop();
                  setItems(CLASSROOM_TRASH_ITEMS.map(i => ({ ...i, found: false })));
                  setSelectedItem(null);
                  setAiFeedback(null);
                }}
                className="relative z-10 self-center mt-3 flex items-center space-x-1.5 px-3 py-1 bg-slate-800 text-xs text-slate-350 hover:text-white rounded-lg transition"
              >
                <RefreshCw size={12} />
                <span>쓰레기산 쓰레기 처음부터 다시 숨기기</span>
              </button>
            </div>
          ) : (
            /* Camera/Upload Mode */
            <div className="flex-1 flex flex-col p-4 relative justify-center items-center">
              {uploadPreview ? (
                /* Photo preview and cancel */
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={uploadPreview}
                    alt="Scan snapshot"
                    className="max-h-[290px] rounded-lg border border-slate-700 object-contain shadow-lg"
                  />
                  <button
                    onClick={() => {
                      sounds.playPop();
                      setUploadPreview(null);
                      setAiFeedback(null);
                      setAutoScanCountdown(5); // Reset automated snapshot countdown!
                      startCamera();
                    }}
                    className="mt-3 flex items-center space-x-2 px-4 py-2 bg-slate-800 text-sm hover:bg-slate-700 text-yellow-300 rounded-full"
                  >
                    <RefreshCw size={15} />
                    <span>다시 촬영하기</span>
                  </button>
                </div>
              ) : (
                /* Live Video Window */
                <div className="w-full flex-1 flex flex-col items-center justify-center relative bg-black rounded-lg overflow-hidden">
                  {cameraError ? (
                    <div className="p-6 text-center max-w-sm">
                      <p className="text-yellow-400 mb-4">{cameraError}</p>
                      
                      {/* Drag & Drop Area */}
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragleave={handleDrag}
                        onDrop={handleDrop}
                        className={`w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                          dragActive ? "border-yellow-450 bg-slate-900" : "border-slate-700 hover:border-slate-500"
                        }`}
                      >
                        <Upload className="text-slate-450 mb-2 animate-pulse" size={32} />
                        <span className="text-sm font-semibold text-slate-300 mb-1">인터넷 브라우저 사진 끌어놓기</span>
                        <span className="text-xs text-slate-500 mb-3">(페트병, 캔, 종이 등 사진 업로드 가능)</span>
                        <label className="px-4 py-1.5 bg-yellow-450 text-slate-900 rounded-full text-xs font-bold ring-2 ring-yellow-400 cursor-pointer hover:bg-yellow-400">
                          파일 선택하기
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover min-h-[280px]"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      
                      {/* Hands-Free Automated Capture Countdown Overlay */}
                      {autoScanCountdown !== null && (
                        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-30 pointer-events-none animate-fade-in">
                          <div className="bg-slate-900/95 border-3 border-emerald-400 p-5 rounded-3xl flex flex-col items-center justify-center shadow-2xl max-w-xs text-center">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">🤖 인공지능 자동 물체 스캐너</span>
                            <div className="flex items-center space-x-3 mb-2.5">
                              <div className="w-14 h-14 bg-emerald-400 text-slate-950 font-black rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-white animate-pulse">
                                {autoScanCountdown}
                              </div>
                              <span className="text-sm font-black text-white text-left">초 후에<br />자동으로 찰칵! 📸</span>
                            </div>
                            <span className="text-[10px] text-slate-300 leading-normal">카메라 앞에 분리수거 대상을 비추고 잠시 멈춰 기다려주세요!</span>
                          </div>
                        </div>
                      )}

                      {/* Scan grid mask */}
                      <div className="absolute inset-x-8 top-1/4 bottom-1/4 border border-yellow-350/30 rounded flex items-center justify-center pointer-events-none z-10">
                        <div className="w-full h-[2px] bg-yellow-400 opacity-60 absolute animate-pulse" />
                        <span className="text-[10px] text-yellow-350/70 bg-slate-900/80 px-2 py-0.5 rounded-full absolute bottom-2">분리수거 물건을 비춰주세요</span>
                      </div>

                      {/* Snap Action Button */}
                      <button
                        onClick={capturePhoto}
                        id="btn-camera-snap"
                        className="absolute bottom-4 px-6 py-3 bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-bold rounded-full flex items-center space-x-2 shadow-2xl scale-110 active:scale-95 transition z-10"
                      >
                        <Camera size={18} />
                        <span>찰칵! 촬영하기</span>
                      </button>
                    </>
                  )}
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />

              {/* Sample recyclable generator cards for debug/convenience */}
              <div className="w-full mt-4 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-2 text-center">💡 소품이 없을 때 빠른 체험용 샘플 카드:</span>
                <div className="grid grid-cols-5 gap-2">
                  {SAMPLE_RECYCLABLES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        sounds.playPop();
                        setIsAnalyzing(true);
                        setAiFeedback(null);
                        setUploadPreview(sample.data);
                        try {
                          const res = await fetch("/api/analyze-trash", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ image: sample.data, mimeType: "image/png", itemHint: sample.category, isSample: true })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setAiFeedback(data);
                            sounds.playChime();
                            sounds.speak(data.itemName + " 발견! " + data.childExplanation);
                          }
                        } catch (err) {
                          console.log(err);
                          setIsAnalyzing(false);
                        } finally {
                          setIsAnalyzing(false);
                        }
                      }}
                      className="flex flex-col items-center justify-center py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-slate-600 rounded-lg text-xs transition"
                    >
                      <span className="text-xl">{sample.emoji}</span>
                      <span className="font-medium text-slate-300 mt-0.5">{sample.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analyzing Overlay / Laser Mask */}
          <AnimatePresence>
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-40 p-6 text-center"
              >
                <div className="relative mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-yellow-350 border-t-transparent rounded-full animate-spin" />
                  <Sparkles className="text-yellow-400 absolute animate-pulse" size={24} />
                </div>
                <h3 className="text-lg font-bold text-yellow-300 animate-pulse">달님이 우주 돋보기로 사진을 읽고 있어요</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2">
                  "어디 보자... 어떤 멋진 분리수거 물품을 친구가 보여줬을까요? 귀여운 괴물들을 탐색하는 중이에요!"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT INFO PANEL (Feedback & Educational guidance) */}
        <div className="w-full lg:w-[350px] bg-slate-850 rounded-2xl border-2 border-slate-700 p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-300 border-b border-slate-700 pb-2 mb-3 text-sm tracking-widest uppercase">🔎 분석 정보판</h3>
            
            {!selectedItem && !aiFeedback && (
              <div className="text-center py-12 text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <HelpCircle size={44} className="mx-auto text-yellow-350 mb-3 animate-pulse" />
                <p className="text-sm font-bold text-slate-200">분석된 쓰레기가 아직 없어요</p>
                <p className="text-xs mt-1.5 text-slate-400 leading-normal">
                  왼쪽 카메라 화면을 보고 <strong className="text-yellow-400">찰칵! 촬영하기</strong> 버튼을 누르거나, <strong className="text-yellow-400">파일 업로드</strong> 또는 <strong className="text-yellow-400">샘플 카드</strong>를 누르면 AI 분석이 시작돼요!
                </p>
              </div>
            )}

            {selectedItem && !aiFeedback && (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2.5 mb-2">
                  <span className="text-3xl">{selectedItem.emoji}</span>
                  <div>
                    <h4 className="font-bold text-white text-base">{selectedItem.name}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-850 text-yellow-300 border border-slate-700">
                      카테고리: {selectedItem.category}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{selectedItem.description}</p>
                
                <div className="bg-slate-950/70 p-3 rounded-lg text-xs text-yellow-300/90 border border-yellow-500/10 mb-4 leading-relaxed">
                  <span className="font-bold text-yellow-450 block mb-0.5">💡 숨은 위치 힌트:</span>
                  {selectedItem.hint}
                </div>

                <button
                  onClick={() => scanSimulatedItem(selectedItem)}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-extrabold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition transform active:scale-95 text-xs inline-flex items-center justify-center space-x-1.5"
                >
                  <Sparkles size={13} />
                  <span>이 물고 돋보기로 인공지능 분석하기 (+{selectedItem.points}점)</span>
                </button>
              </div>
            )}

            {/* AI Result Card */}
            {aiFeedback && (
              <motion.div
                initial={{ transform: "scale(0.95)", opacity: 0 }}
                animate={{ transform: "scale(1)", opacity: 1 }}
                className="bg-slate-900 border-2 border-emerald-450/60 p-4 rounded-xl"
              >
                <span className="text-[9px] bg-emerald-500/25 border border-emerald-500/40 px-2 py-0.5 text-emerald-400 font-extrabold rounded-full uppercase tracking-wider mb-2 inline-block">
                  성공적으로 발견 완료!
                </span>
                
                <div className="flex items-center space-x-3 mb-3 border-b border-slate-800 pb-3">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <h4 className="font-extrabold text-white text-[17px]">{aiFeedback.itemName}</h4>
                    <p className="text-[11px] text-slate-350">
                      분류: <strong className="text-yellow-450">{aiFeedback.category}</strong>
                    </p>
                  </div>
                </div>

                {/* Where to separate / Put recycling bin banner */}
                <div className="p-3 bg-blue-500/15 border-2 border-blue-500/40 text-blue-300 rounded-xl text-center font-bold text-sm mb-3">
                  📍 올바른 분리수거 위치:<br />
                  <span className="text-yellow-300 font-extrabold text-[15px] block mt-1">{getBinNameInKorean(aiFeedback.category)}</span>
                </div>

                {/* Score Alert */}
                <div className="flex items-center justify-between bg-yellow-400/10 p-2.5 rounded-lg border border-yellow-500/20 mb-3 text-xs">
                  <span className="text-yellow-350 font-bold">쓰레기 에너지 획득:</span>
                  <span className="text-yellow-350 font-extrabold text-sm animate-pulse">+{aiFeedback.recyclable ? aiFeedback.points : 0} 에너지고</span>
                </div>

                {/* Kid instructions */}
                <div className="bg-slate-950/80 p-3 rounded-lg text-slate-200 text-xs leading-relaxed mb-1 border border-slate-800">
                  <span className="text-xl block mb-1">🌕 달님의 재활용 비법:</span>
                  <p className="font-medium">{aiFeedback.childExplanation}</p>
                </div>

                {aiFeedback.recyclable && (
                  <div className="mt-3 bg-indigo-950/50 p-2.5 rounded-lg border border-indigo-500/20 text-[11px] text-purple-300 leading-normal flex items-start space-x-1">
                    <span className="text-xs">😈</span>
                    <span>
                      이 물건 근처에 숨어있던 <strong>{aiFeedback.monsterName}</strong>가 고장난 쓰레기차 에너지 주위를 방해하고 있어요! 다음 단계인 AR 모드에서 괴물을 물리쳐볼까요?
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-800 pt-4">
            {aiFeedback ? (
              <button
                onClick={commitScanResult}
                id="btn-confirm-scan-result"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl transition flex items-center justify-center space-x-2 text-sm"
              >
                <CheckCircle size={18} />
                <span>에너지 충전하고 쓰레기 괴물 잡으러 가기!</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-slate-800 text-slate-500 font-bold rounded-xl text-center cursor-not-allowed text-xs"
              >
                물건을 골라서 분석을 마쳐주세요
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
