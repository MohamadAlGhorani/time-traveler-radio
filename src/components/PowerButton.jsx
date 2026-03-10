import { motion } from 'framer-motion';
import { hapticHeavy } from '../utils/haptic';

export default function PowerButton({ isPowered, onClick, isBooting }) {
  const handleClick = () => {
    hapticHeavy();
    onClick();
  };

  return (
    <motion.button
      className={`power-button shrink-0 ${isPowered ? 'on' : ''}`}
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      disabled={isBooting}
      aria-label={isPowered ? 'Turn off radio' : 'Turn on radio'}
      aria-pressed={isPowered}
    >
      <svg
        className="power-icon"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke={isPowered ? '#00e5c6' : '#555'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    </motion.button>
  );
}
