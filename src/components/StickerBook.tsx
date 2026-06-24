import React from "react";
import { Participant, STICKER_LIST, TITLE_MILESTONES } from "../types";
import { sounds } from "../utils/audio";
import { Milestone, Trophy, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { motion } from "motion/react";

interface StickerBookProps {
  activeStudent: Participant | null;
  onClose: () => void;
}

export default function StickerBook({ activeStudent, onClose }: StickerBookProps) {
  // Compute title based on current student's points
  const currentScore = activeStudent?.totalScore || 0;
  
  // Find current title milestone
  let currentTitle = TITLE_MILESTONES[0].title;
  let nextMilestone = TITLE_MILESTONES[1];
  
  for (let i = 0; i < TITLE_MILESTONES.length; i++) {
    if (currentScore >= TITLE_MILESTONES[i].score) {
      currentTitle = TITLE_MILESTONES[i].title;
      nextMilestone = TITLE_MILESTONES[i + 1] || null;
    }
  }

  return (
    <div id="sticker-book" className="fixed inset-0 z-50 bg-[#F0F9FF]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 text-[#1E293B] overflow-y-auto">
      
      <div className="w-full max-w-2xl bg-white border-4 border-[#F97316] rounded-[2.5rem] p-8 shadow-2xl relative bg-gradient-to-b from-[#FFF7ED] via-white to-white">
        
        {/* Close Button */}
        <button
          onClick={() => { sounds.playPop(); onClose(); }}
          className="absolute top-4 right-4 bg-[#FFEAD2] hover:bg-[#FFD8A8] text-[#9A3412] p-2.5 rounded-full transition font-bold"
        >
          ✕
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-4xl">🌸</span>
          <h3 className="text-2xl font-black text-[#9A3412] mt-2 font-display">마을 보훈관 : 내 칭호 & 스티커 보관함</h3>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">분리수거를 열심히 해서 지구의 소중한 명예 훈장을 모아보세요!</p>
        </div>

        {/* Active Child Identification */}
        <div className="bg-white/80 p-5 rounded-2xl border-4 border-[#FB923C]/50 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-[#4ADE80] text-white font-black rounded-2xl text-xl flex items-center justify-center shadow-md animate-pulse">
              {activeStudent ? activeStudent.name.charAt(0) : "🌟"}
            </div>
            <div>
              <span className="text-[10px] text-[#64748B] font-extrabold block uppercase tracking-wider">현재 소속 탐험대 어린이</span>
              <strong className="text-lg text-[#0F172A]">{activeStudent ? activeStudent.name : "체험단 어린이"}</strong>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] text-[#64748B] font-extrabold block uppercase tracking-wider">획득 에너지</span>
            <strong className="text-2xl font-black text-[#F59E0B]">{currentScore} ⚡ 에너지고</strong>
          </div>
        </div>

        {/* Title Achievement Milestones progress */}
        <div className="mb-6 bg-[#EEF2FF] p-5 rounded-2xl border-4 border-[#6366F1]/50 shadow-sm">
          <h4 className="text-sm font-black text-[#3730A3] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Milestone size={14} className="text-[#6366F1]" />
            <span>내 칭호 레벨: <strong className="text-[#2563EB] text-base ml-1">{currentTitle}</strong></span>
          </h4>
          
          {nextMilestone ? (
            <div className="text-xs text-[#475569] leading-relaxed">
              다음 칭호인 <strong className="text-[#3730A3]">{nextMilestone.title}</strong>까지{" "}
              <strong className="text-[#D97706] font-bold">{nextMilestone.score - currentScore}점</strong>이 더 필요해요!
              
              {/* Progress Bar */}
              <div className="w-full bg-[#E2E8F0] h-3 rounded-full overflow-hidden mt-2 border border-slate-300">
                <div 
                  className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((currentScore / nextMilestone.score) * 100))}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#059669] font-black flex items-center space-x-1 leading-none mt-1">
              <Trophy size={14} className="text-[#10B981] animate-pulse" />
              <span>축하합니다! 최고 칭호인 [환경 영웅] 지킵이 대장에 등극하셨어요!</span>
            </div>
          )}
        </div>

        {/* Grid of Achievement stickers */}
        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-widest pl-1 mb-3">수집한 달님 칭호 스티커 도장</h4>
        <div className="grid grid-cols-2 gap-4">
          {STICKER_LIST.map((sticker) => {
            const isUnlocked = activeStudent?.unlockedStickers?.includes(sticker.id) || currentScore >= 40;
            
            return (
              <div 
                key={sticker.id}
                className={`p-4 rounded-2xl border-4 transition-all duration-300 ${
                  isUnlocked 
                    ? "bg-white border-[#F97316] shadow-lg text-[#1E293B]" 
                    : "bg-[#FFEDD5]/40 border-dashed border-[#FCD34D] text-[#94A3B8] select-none grayscale"
                }`}
              >
                <div className="flex items-center space-x-2.5 mb-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-sm ${
                    isUnlocked ? "bg-gradient-to-tr from-[#FFF7ED] to-white border-2 border-[#FB923C] text-[#F97316]" : "bg-slate-100 border-2 border-slate-200 text-slate-350"
                  }`}>
                    {sticker.emoji}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block text-[#0F172A]">
                      {sticker.name}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold block ${
                      isUnlocked ? "text-[#F59E0B]" : "text-[#94A3B8]"
                    }`}>
                      {isUnlocked ? "획득 완료 🔓" : "인증 필요 🔒"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B] leading-normal font-medium">
                  {sticker.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-[10.5px] text-[#64748B] font-bold flex items-center justify-center space-x-1.5">
          <Heart size={10} className="fill-[#EC4899] text-[#EC4899]" />
          <span>점수를 획득하거나 대결을 계속 진행하면 도감에 스티커 도장이 찍힙니다!</span>
        </div>

      </div>

    </div>
  );
}
