import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { hapticTap, hapticTurn } from '../utils/haptic';

const MIN_VOL = 0;
const MAX_VOL = 1;

function volumeToAngle(vol) {
  return (vol / MAX_VOL) * 270 - 135; // -135 to +135 range
}

function angleToVolume(angle) {
  const clamped = Math.max(-135, Math.min(135, angle));
  return ((clamped + 135) / 270) * MAX_VOL;
}

export default function VolumeSlider({ volume, onVolumeChange, isPowered }) {
  const knobRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ angle: 0, startAngle: 0 });
  const currentAngleRef = useRef(volumeToAngle(volume));
  const lastHapticRef = useRef(0);

  const getAngleFromEvent = useCallback((e, rect) => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (!isPowered) return;
    e.preventDefault();
    e.stopPropagation();

    hapticTap();

    const rect = knobRef.current.getBoundingClientRect();
    const startAngle = getAngleFromEvent(e, rect);

    dragStartRef.current = {
      angle: currentAngleRef.current,
      startAngle,
    };
    setIsDragging(true);

    const handleMove = (moveE) => {
      moveE.preventDefault();
      const currentPointerAngle = getAngleFromEvent(moveE, rect);
      let delta = currentPointerAngle - dragStartRef.current.startAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const newAngle = dragStartRef.current.angle + delta * 1.2;
      const clampedAngle = Math.max(-135, Math.min(135, newAngle));
      currentAngleRef.current = clampedAngle;

      const vol = angleToVolume(clampedAngle);
      onVolumeChange(vol);

      // Haptic tick every ~10% turn
      const now = Date.now();
      if (now - lastHapticRef.current > 80) {
        hapticTurn();
        lastHapticRef.current = now;
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }, [isPowered, getAngleFromEvent, onVolumeChange]);

  const rotation = volumeToAngle(volume);

  // Volume percentage for the arc indicator
  const volPercent = Math.round(volume * 100);

  return (
    <div className="flex flex-col items-center gap-1" role="group" aria-label="Volume control">
      {/* Volume knob */}
      <motion.div
        ref={knobRef}
        className="vol-knob-outer"
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(volume * 100)}
        aria-valuetext={`${Math.round(volume * 100)} percent`}
        tabIndex={isPowered ? 0 : -1}
        onKeyDown={(e) => {
          if (!isPowered) return;
          const step = 0.05;
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); onVolumeChange(Math.min(1, volume + step)); }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); onVolumeChange(Math.max(0, volume - step)); }
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ opacity: isPowered ? 1 : 0.5, touchAction: 'none' }}
        animate={{ rotate: rotation }}
        transition={{
          type: 'spring',
          stiffness: isDragging ? 600 : 250,
          damping: isDragging ? 40 : 20,
          mass: 0.5,
        }}
      >
        <div className="vol-knob-inner">
          <div className="vol-knob-indicator" />
        </div>
      </motion.div>

      {/* Label */}
      <span className="text-[#555] text-[7px] sm:text-[8px] tracking-widest" style={{ fontFamily: 'Orbitron' }}>
        VOL {isDragging && isPowered ? volPercent : ''}
      </span>
    </div>
  );
}
