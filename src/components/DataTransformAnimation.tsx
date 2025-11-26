import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const DataTransformAnimation = () => {
  const [iteration, setIteration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIteration(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scattered input particles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 80 - 40,
    y: Math.random() * 80 - 40,
    delay: i * 0.1,
  }));

  // Document lines for output
  const docLines = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    width: i === 0 ? 70 : Math.random() * 40 + 40,
    delay: i * 0.15 + 2,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-between px-8">
      {/* Left: Scattered Input */}
      <div className="relative w-1/3 h-full flex items-center justify-center">
        {particles.map((particle) => (
          <motion.div
            key={`${particle.id}-${iteration}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `hsl(${180 + Math.random() * 20}, 70%, 60%)`,
            }}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 0,
            }}
            animate={{
              x: [particle.x, 0],
              y: [particle.y, 0],
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: particle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Small text lines */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={`line-${i}-${iteration}`}
            className="absolute h-0.5 rounded-full"
            style={{
              width: `${Math.random() * 15 + 10}px`,
              background: 'hsl(190, 70%, 60%)',
              top: `${30 + i * 15}%`,
              left: `${20 + Math.random() * 40}%`,
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [-10, 0, 20, 40],
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Center: Processor */}
      <div className="relative w-1/3 h-full flex items-center justify-center">
        <motion.div
          key={`processor-${iteration}`}
          className="relative w-24 h-24 rounded-2xl border-2 flex items-center justify-center"
          style={{
            borderColor: 'hsl(var(--primary))',
            background: 'hsl(var(--background))',
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1, 1, 1],
            opacity: [0, 1, 1, 1],
          }}
          transition={{
            duration: 0.5,
            delay: 1,
          }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'hsl(var(--primary) / 0.2)',
              filter: 'blur(8px)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
          
          {/* Processing icon - abstract gear */}
          <motion.svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: 1,
            }}
          >
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
            />
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <line
                key={angle}
                x1="12"
                y1="12"
                x2={12 + Math.cos((angle * Math.PI) / 180) * 8}
                y2={12 + Math.sin((angle * Math.PI) / 180) * 8}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
              />
            ))}
          </motion.svg>
        </motion.div>
      </div>

      {/* Right: Organized Document */}
      <div className="relative w-1/3 h-full flex items-center justify-center">
        <div className="relative w-48 h-56 rounded-lg border-2 p-4 flex flex-col gap-3"
          style={{
            borderColor: 'hsl(var(--primary))',
            background: 'hsl(var(--background))',
          }}
        >
          {/* Document header */}
          <motion.div
            key={`header-${iteration}`}
            className="w-full h-8 rounded"
            style={{ background: 'hsl(45, 90%, 60%)' }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{
              duration: 0.4,
              delay: 2,
              ease: 'easeOut',
            }}
          />
          
          {/* Document lines */}
          {docLines.map((line) => (
            <motion.div
              key={`doc-${line.id}-${iteration}`}
              className="h-2 rounded-full"
              style={{
                background: 'hsl(var(--primary))',
              }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: `${line.width}%`, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: line.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataTransformAnimation;
