import { CategoryType } from "../types";

export interface InteractiveTrashItem {
  id: string;
  name: string;
  category: CategoryType;
  points: number;
  top: number; // percentage
  left: number; // percentage
  found: boolean;
  color: string;
  emoji: string;
  description: string;
  hint: string;
  howToRecycle: string;
}

export const CLASSROOM_TRASH_ITEMS: InteractiveTrashItem[] = [
  {
    id: "pet_bottle",
    name: "비어있는 생수 페트병",
    category: "plastic",
    points: 10,
    top: 68,
    left: 22,
    found: false,
    color: "bg-blue-100 border-blue-400 text-blue-600",
    emoji: "🥤",
    description: "생수 다 마시고 남은 투명하고 깨끗한 플라스틱 페트병이에요.",
    hint: "쓰레기산 왼쪽 아래에 있는 놀이 매트 장난감 상자 옆을 살펴보세요!",
    howToRecycle: "페트병은 비닐 라벨을 뜯어서 버려야 해요! 뚜껑과 페트병을 납작하게 찌그러뜨려서 플라스틱 수거함에 쏙!"
  },
  {
    id: "milk_pack",
    name: "달콤 시원 우유팩",
    category: "milk_carton",
    points: 20,
    top: 42,
    left: 78,
    found: false,
    color: "bg-pink-100 border-pink-400 text-pink-600",
    emoji: "🥛",
    description: "간식 시간에 맛있게 먹은 고소한 흰 우유 팩이에요.",
    hint: "쓰레기산 오른쪽 구석, 선생님의 피아노 옆 책상 위에 올려져 있어요!",
    howToRecycle: "우유팩은 물에 헹군 뒤, 가위로 활짝 펼치거나 완전히 펴서 햇볕에 말려 '종이팩 보관함'에 따로 넣어요!"
  },
  {
    id: "soda_can",
    name: "반짝반짝 음료수 캔",
    category: "can",
    points: 15,
    top: 54,
    left: 45,
    found: false,
    color: "bg-emerald-100 border-emerald-400 text-emerald-600",
    emoji: "🥫",
    description: "보글보글 톡 쏘는 포도 탄산음료 알루미늄 캔이에요.",
    hint: "가운데에 있는 동그란 공부 회의용 탁자 아래에 떨어져 있어요!",
    howToRecycle: "캔 안의 남은 음료를 깨끗하게 비우고 헹구어 납작하게 발로 꾹 밟아서 철/알루미늄 캔 수거함으로!"
  },
  {
    id: "paper_box",
    name: "튼튼한 과자 종이상자",
    category: "paper",
    points: 10,
    top: 35,
    left: 15,
    found: false,
    color: "bg-yellow-100 border-yellow-400 text-yellow-600",
    emoji: "📦",
    description: "알록달록 맛있는 쿠키가 들어있던 황토색 종이상자에요.",
    hint: "쓰레기산 왼쪽 끝 책장에 장난감 블록들과 함께 끼어있답니다!",
    howToRecycle: "상자에 붙어있는 반짝이 스카치 테이프나 철사, 비닐 송장을 깨끗이 떼어내서 종이 수거함에 납작하게 펼쳐 버려요!"
  },
  {
    id: "snack_vinyl",
    name: "아삭바삭 감자칩 비닐지",
    category: "vinyl",
    points: 10,
    top: 75,
    left: 62,
    found: false,
    color: "bg-purple-100 border-purple-400 text-purple-600",
    emoji: "🛍️",
    description: "바삭바삭 소리가 나는 맛있는 감자칩 까까 비닐 포장지에요.",
    hint: "쓰레기산 오른쪽 보들보들한 곰인형 쿠션 옆 바닥에 떨어져 있어요!",
    howToRecycle: "비닐 봉지는 부스러기나 오염된 내용물을 깨끗이 쓸어내어 물로 씻은 뒤, 반듯하게 접거나 투명 비닐수거함에 모아요!"
  },
  {
    id: "dirty_apple",
    name: "벌레가 좋아하는 사과심",
    category: "other",
    points: 0,
    top: 48,
    left: 58,
    found: false,
    color: "bg-red-100 border-red-400 text-red-650",
    emoji: "🍎",
    description: "먹다 남은 사과심이에요. 냄새가 나고 갈색으로 변해버렸어요.",
    hint: "쓰레기산 중앙 시계 바로 아래의 책상 구석에 올려져 연기가 나고 있어요!",
    howToRecycle: "먹다 남은 과일은 분리수거가 되지 않는 '음식물 쓰레기'나 일반 쓰레기로 소중히 처리해야 해요. 괴물이 좋아한대요!"
  }
];
