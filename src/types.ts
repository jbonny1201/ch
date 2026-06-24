export type CategoryType = "plastic" | "paper" | "can" | "milk_carton" | "vinyl" | "other";

export interface Participant {
  id: string;
  name: string;
  scanCount: number;
  captureCount: number;
  totalScore: number;
  unlockedStickers: string[]; // ids
  createdAt: string;
}

export interface TrashScanResult {
  category: CategoryType;
  itemName: string;
  recyclable: boolean;
  points: number;
  childExplanation: string;
  monsterName: string;
}

export interface Monster {
  id: string;
  type: CategoryType;
  name: string;
  x: number; // percentage width 10-90
  y: number; // percentage height 10-90
  scale: number; // visual scale multiplier
  isCaptured: boolean;
  points: number;
  speedX: number;
  speedY: number;
}

export type GameMode = "INTRO" | "MAIN" | "SCAN" | "AR_MONSTER" | "VS_MODE" | "TEACHER" | "STICKERS";

export interface VSPlayer {
  name: string;
  score: number;
  scanCount: number;
  captureCount: number;
}

export interface Sticker {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlockedAt?: string;
}

export const STICKER_LIST: Sticker[] = [
  {
    id: "moon_sticker",
    name: "달님 스티커",
    description: "첫 번째 분리수거 물건을 성공적으로 찾아서 촬영했을 때 달님에게 받은 격려 스티커!",
    emoji: "🌙",
  },
  {
    id: "truck_sticker",
    name: "쓰레기차 스티커",
    description: "쓰레기차 에너지 충전도 100%를 달성하여 고장 난 쓰레기차를 완전히 고쳤을 때 받는 스티커!",
    emoji: "🚛",
  },
  {
    id: "recycling_king",
    name: "재활용왕 스티커",
    description: "쓰레기 괴물을 5마리 이상 잡거나 분리수거 대왕이 되었을 때 획득하는 스티커!",
    emoji: "👑",
  },
  {
    id: "victory_hero",
    name: "환경 영웅 스티커",
    description: "2인 분리수거 대결 모드에서 승리하거나 100점 대장 돌파 시 지급되는 영웅 스티커!",
    emoji: "🏆",
  }
];

export const TITLE_MILESTONES = [
  { score: 0, title: "분리수거 새싹 🌱" },
  { score: 30, title: "분리수거 박사 🎓" },
  { score: 70, title: "쓰레기 헌터 🏹" },
  { score: 120, title: "땅별마을 수호대 🛡️" },
  { score: 200, title: "환경 영웅 🏆" }
];
