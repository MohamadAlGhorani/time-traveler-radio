import { motion } from 'framer-motion';
import { hapticClick } from '../utils/haptic';

export default function NewsButton({ onClick, isPowered, isNewsBulletin }) {
  const handleClick = () => {
    hapticClick();
    onClick();
  };

  return (
    <motion.button
      className={`news-btn rounded-lg text-[10px] sm:text-xs tracking-widest border transition-all
        ${isPowered
          ? isNewsBulletin
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 bulletin-active'
            : 'border-[#1a3a35] bg-[#0a1a18] text-[#00e5c6] hover:bg-[#00e5c6]/10 hover:border-[#00e5c6]/30'
          : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#333] cursor-not-allowed'
        }`}
      style={{ fontFamily: 'Orbitron', padding: '16px' }}
      onClick={handleClick}
      disabled={!isPowered || isNewsBulletin}
      whileTap={isPowered ? { scale: 0.94 } : {}}
      aria-label={isNewsBulletin ? 'News bulletin playing' : 'Play news bulletin'}
      aria-pressed={isNewsBulletin}
    >
      {isNewsBulletin ? '📡 ON AIR' : '📰 NEWS'}
    </motion.button>
  );
}
