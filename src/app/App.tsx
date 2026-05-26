import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Music2, Zap, ChevronDown } from 'lucide-react';

interface Track {
  id: number;
  name: string;
  artist: string;
  color: string;
  genre: string;
  bpm: number;
}

const TRACKS: Track[] = [
  { id: 1, name: "Summer Vibes", artist: "DJ Sunset", color: "#FF6B9D", genre: "Pop", bpm: 128 },
  { id: 2, name: "Deep Ocean", artist: "Wave Rider", color: "#4ECDC4", genre: "Ambient", bpm: 85 },
  { id: 3, name: "Electric Dreams", artist: "Neon Pulse", color: "#FFE66D", genre: "Electronic", bpm: 140 },
  { id: 4, name: "Midnight Jazz", artist: "The Smooths", color: "#A8DADC", genre: "Jazz", bpm: 95 },
  { id: 5, name: "Urban Beat", artist: "City Sounds", color: "#F4A261", genre: "Hip-Hop", bpm: 96 },
  { id: 6, name: "Forest Whisper", artist: "Nature Echo", color: "#95E1D3", genre: "Acoustic", bpm: 72 },
  { id: 7, name: "Stellar Flow", artist: "Cosmic Drift", color: "#C77DFF", genre: "Chillout", bpm: 110 },
  { id: 8, name: "Desert Wind", artist: "Sand Storm", color: "#FF9F1C", genre: "World", bpm: 88 },
];

interface RotaryPickerProps {
  label: string;
  accentColor: string;
  selectedTrack: Track | null;
  onSelect: (track: Track) => void;
}

function RotaryPicker({ label, accentColor, selectedTrack, onSelect }: RotaryPickerProps) {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const circleRef = useRef<HTMLDivElement>(null);
  const dragStartAngleRef = useRef(0);
  const dragStartRotationRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const RADIUS = 210;
  const CARD_COUNT = TRACKS.length;

  const getAngleFromCenter = useCallback((clientX: number, clientY: number): number => {
    if (!circleRef.current) return 0;
    const rect = circleRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  }, []);

  const getSelectedIndexFromRotation = useCallback((rot: number): number => {
    const normalized = ((rot % 360) + 360) % 360;
    const step = 360 / CARD_COUNT;
    // Selection zone is at top (270° in standard coords), cards start from top
    // When rotation is 0, card 0 is at top. We want to find which card is at top.
    // Card i is at top when: (i * step + rot) % 360 ≈ 0
    // So selected = round(-rot / step) % CARD_COUNT
    const raw = -rot / step;
    const idx = ((Math.round(raw) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
    return idx;
  }, [CARD_COUNT]);

  const snapToNearest = useCallback((rot: number) => {
    const step = 360 / CARD_COUNT;
    const snapped = Math.round(rot / step) * step;
    setRotation(snapped);
    const idx = getSelectedIndexFromRotation(snapped);
    onSelect(TRACKS[idx]);
  }, [CARD_COUNT, getSelectedIndexFromRotation, onSelect]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartAngleRef.current = getAngleFromCenter(e.clientX, e.clientY);
    dragStartRotationRef.current = rotation;
  }, [getAngleFromCenter, rotation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const currentAngle = getAngleFromCenter(e.clientX, e.clientY);
    const delta = currentAngle - dragStartAngleRef.current;
    if (Math.abs(delta) > 2) hasDraggedRef.current = true;
    setRotation(dragStartRotationRef.current + delta);
  }, [isDragging, getAngleFromCenter]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest(rotation);
  }, [isDragging, rotation, snapToNearest]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartAngleRef.current = getAngleFromCenter(touch.clientX, touch.clientY);
    dragStartRotationRef.current = rotation;
  }, [getAngleFromCenter, rotation]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const currentAngle = getAngleFromCenter(touch.clientX, touch.clientY);
    const delta = currentAngle - dragStartAngleRef.current;
    if (Math.abs(delta) > 2) hasDraggedRef.current = true;
    setRotation(dragStartRotationRef.current + delta);
  }, [isDragging, getAngleFromCenter]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    snapToNearest(rotation);
  }, [isDragging, rotation, snapToNearest]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const handleCardClick = useCallback((track: Track, index: number) => {
    if (hasDraggedRef.current) return;
    const step = 360 / CARD_COUNT;
    const targetRotation = -index * step;
    const current = rotation % 360;
    const diff = targetRotation - current;
    const adjustedDiff = ((diff + 180 + 360) % 360) - 180;
    const snapped = rotation + adjustedDiff;
    setRotation(snapped);
    onSelect(track);
  }, [CARD_COUNT, rotation, onSelect]);

  const selectedIdx = getSelectedIndexFromRotation(rotation);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-white/50 text-sm tracking-widest uppercase mb-1">{label}</p>
        <div
          className="h-0.5 w-16 mx-auto rounded-full"
          style={{ background: accentColor }}
        />
      </div>

      {/* Selection indicator at top */}
      <div className="relative" style={{ width: (RADIUS + 100) * 2, height: (RADIUS + 100) * 2 }}>
        {/* Top selection zone indicator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: `linear-gradient(to bottom, ${accentColor}, transparent)` }}
          />
          <div
            className="w-3 h-3 rounded-full mt-[-2px]"
            style={{ background: accentColor, boxShadow: `0 0 12px ${accentColor}` }}
          />
        </div>

        {/* Outer ring glow */}
        <div
          className="absolute inset-0 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          }}
        />

        {/* Rotatable circle */}
        <div
          ref={circleRef}
          className="absolute inset-0 rounded-full"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Circle ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: rotation }}
            transition={{ type: isDragging ? 'tween' : 'spring', duration: isDragging ? 0 : 0.4, bounce: 0.2 }}
            style={{
              border: `1px solid ${accentColor}30`,
            }}
          >
            {/* Tick marks */}
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-0 origin-bottom"
                style={{
                  transform: `translateX(-50%) rotate(${(i / 48) * 360}deg)`,
                  height: '50%',
                  width: '1px',
                }}
              >
                <div
                  className="absolute top-0 left-0 w-full"
                  style={{
                    height: i % 8 === 0 ? '12px' : i % 4 === 0 ? '8px' : '4px',
                    background: i % 8 === 0 ? `${accentColor}60` : `${accentColor}25`,
                  }}
                />
              </div>
            ))}

            {/* Track cards on the ring */}
            {TRACKS.map((track, index) => {
              const angle = (index / CARD_COUNT) * 360;
              const rad = ((angle - 90) * Math.PI) / 180;
              const x = Math.cos(rad) * RADIUS;
              const y = Math.sin(rad) * RADIUS;
              const isSelected = index === selectedIdx;

              return (
                <motion.div
                  key={track.id}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${-rotation}deg)`,
                    zIndex: isSelected ? 10 : 1,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(track, index);
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isSelected ? 1.08 : 0.9,
                      opacity: isSelected ? 1 : 0.55,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative rounded-xl overflow-hidden cursor-pointer select-none"
                    style={{
                      width: 96,
                      height: 80,
                      background: `linear-gradient(135deg, ${track.color}22, ${track.color}44)`,
                      border: isSelected
                        ? `2px solid ${track.color}`
                        : `1px solid ${track.color}40`,
                      boxShadow: isSelected
                        ? `0 0 20px ${track.color}60, 0 0 40px ${track.color}20`
                        : 'none',
                    }}
                  >
                    <div className="p-2 flex flex-col h-full justify-between">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `${track.color}40` }}
                      >
                        <Music2 size={12} style={{ color: track.color }} />
                      </div>
                      <div>
                        <p className="text-white text-xs leading-tight truncate" style={{ maxWidth: 76 }}>
                          {track.name}
                        </p>
                        <p className="text-white/50 text-[9px] truncate" style={{ maxWidth: 76 }}>
                          {track.artist}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${track.color}15, ${track.color}05)`,
                        }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Center display */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: RADIUS * 2 - 260,
                height: RADIUS * 2 - 260,
                background: 'rgba(15, 15, 25, 0.95)',
                border: `1px solid ${accentColor}20`,
                boxShadow: `inset 0 0 40px ${accentColor}10`,
              }}
            >
              <AnimatePresence mode="wait">
                {selectedTrack ? (
                  <motion.div
                    key={selectedTrack.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="text-center px-4"
                  >
                    <div
                      className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ background: `${selectedTrack.color}30`, border: `1px solid ${selectedTrack.color}60` }}
                    >
                      <Music2 size={18} style={{ color: selectedTrack.color }} />
                    </div>
                    <p className="text-white text-sm leading-tight mb-0.5">{selectedTrack.name}</p>
                    <p className="text-white/50 text-xs">{selectedTrack.artist}</p>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `${selectedTrack.color}25`, color: selectedTrack.color }}
                      >
                        {selectedTrack.genre}
                      </span>
                      <span className="text-[10px] text-white/40">{selectedTrack.bpm} BPM</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <p className="text-white/20 text-sm">드래그하여</p>
                    <p className="text-white/20 text-sm">선택하세요</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaveformBar({ color, isPlaying }: { color: string; isPlaying: boolean }) {
  const bars = 32;
  return (
    <div className="flex items-end gap-0.5 h-12">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full"
          style={{ background: color, minWidth: 3 }}
          animate={
            isPlaying
              ? {
                height: [
                  `${20 + Math.random() * 60}%`,
                  `${20 + Math.random() * 60}%`,
                  `${20 + Math.random() * 60}%`,
                ],
              }
              : { height: '20%' }
          }
          transition={
            isPlaying
              ? {
                duration: 0.4 + (i % 5) * 0.08,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
                delay: (i / bars) * 0.2,
              }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export default function App() {
  const [selectedTrack1, setSelectedTrack1] = useState<Track | null>(null);
  const [selectedTrack2, setSelectedTrack2] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 0.5;
        });
      }, 100);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPlaying]);

  const bothSelected = selectedTrack1 && selectedTrack2;

  const gradientColor = bothSelected
    ? `linear-gradient(135deg, ${selectedTrack1.color}, ${selectedTrack2.color})`
    : 'linear-gradient(135deg, #667eea, #764ba2)';

  const avgBpm = bothSelected
    ? Math.round((selectedTrack1.bpm + selectedTrack2.bpm) / 2)
    : 0;

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0d0d1e 50%, #0a0a14 100%)' }}
    >

      {/* Main area */}
      <main className="flex-1 flex flex-col items-center justify-start px-8 py-8 overflow-auto">
        {/* Two pickers side by side */}
        <div className="flex items-start justify-center gap-0 w-full max-w-7xl">
          {/* Track 1 */}
          <div className="flex-1 flex justify-center">
            <RotaryPicker
              label="트랙 A"
              accentColor="#FF6B9D"
              selectedTrack={selectedTrack1}
              onSelect={setSelectedTrack1}
            />
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center justify-center pt-40 px-4">
            <div className="h-40 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <div className="my-3 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
              <span className="text-white/30 text-xs">+</span>
            </div>
            <div className="h-40 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          </div>

          {/* Track 2 */}
          <div className="flex-1 flex justify-center">
            <RotaryPicker
              label="트랙 B"
              accentColor="#4ECDC4"
              selectedTrack={selectedTrack2}
              onSelect={setSelectedTrack2}
            />
          </div>
        </div>

        {/* Arrow */}
        <AnimatePresence>
          {bothSelected && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-center mt-2 mb-4"
            >
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown size={24} className="text-white/30" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Synthesized Result */}
        <AnimatePresence>
          {bothSelected && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="w-full max-w-2xl mb-8"
            >
              <div
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: 'rgba(20, 20, 35, 0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Background gradient accent */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ background: gradientColor }}
                />

                <div className="relative z-10">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: selectedTrack1.color }}
                        />
                        <span className="text-white/60 text-xs">{selectedTrack1.name}</span>
                        <span className="text-white/30 text-xs">×</span>
                        <div
                          className="w-2 h-2 rounded-full animate-pulse"
                          style={{ background: selectedTrack2.color }}
                        />
                        <span className="text-white/60 text-xs">{selectedTrack2.name}</span>
                      </div>
                      <p className="text-white text-xl">합성된 트랙</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-xs mb-0.5">평균 BPM</p>
                      <p className="text-white text-2xl">{avgBpm}</p>
                    </div>
                  </div>

                  {/* Waveform */}
                  <div className="mb-5">
                    <WaveformBar
                      color={`url(#waveGradient)`}
                      isPlaying={isPlaying}
                    />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={selectedTrack1.color} />
                          <stop offset="100%" stopColor={selectedTrack2.color} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-5">
                    <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: gradientColor }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-white/30 text-xs">
                        {Math.floor((progress / 100) * 180)}s
                      </span>
                      <span className="text-white/30 text-xs">3:00</span>
                    </div>
                  </div>

                  {/* Play button */}
                  <button
                    onClick={() => {
                      if (!isPlaying && progress >= 100) setProgress(0);
                      setIsPlaying(!isPlaying);
                    }}
                    className="w-full rounded-xl py-3 flex items-center justify-center gap-3 transition-all"
                    style={{
                      background: gradientColor,
                      boxShadow: isPlaying
                        ? `0 0 30px ${selectedTrack1.color}40, 0 0 60px ${selectedTrack2.color}20`
                        : 'none',
                    }}
                  >
                    {isPlaying ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white" />
                    )}
                    <span className="text-white text-sm">
                      {isPlaying ? '일시정지' : '합성 재생'}
                    </span>
                  </button>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {[selectedTrack1.genre, selectedTrack2.genre].map((g, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          background: i === 0 ? `${selectedTrack1.color}20` : `${selectedTrack2.color}20`,
                          color: i === 0 ? selectedTrack1.color : selectedTrack2.color,
                          border: `1px solid ${i === 0 ? selectedTrack1.color : selectedTrack2.color}30`,
                        }}
                      >
                        {g}
                      </span>
                    ))}
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/40 border border-white/10">
                      Synthesized
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state hint */}
        {!bothSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4"
          >
            <p className="text-white/20 text-sm">
              {!selectedTrack1 && !selectedTrack2
                ? '원을 드래그하거나 카드를 클릭하여 트랙을 선택하세요'
                : !selectedTrack1
                  ? '트랙 A를 선택해주세요'
                  : '트랙 B를 선택해주세요'}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
