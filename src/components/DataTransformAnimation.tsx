import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const DataTransformAnimation = () => {
  const [phase, setPhase] = useState<'input' | 'processing' | 'output'>('input');
  const [iteration, setIteration] = useState(0);

  useEffect(() => {
    const phaseSequence = [
      { phase: 'input' as const, duration: 2500 },
      { phase: 'processing' as const, duration: 2000 },
      { phase: 'output' as const, duration: 2500 },
    ];

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const current = phaseSequence[currentIndex];
      setPhase(current.phase);
      
      timeoutId = setTimeout(() => {
        currentIndex = (currentIndex + 1) % phaseSequence.length;
        if (currentIndex === 0) {
          setIteration(prev => prev + 1);
        }
        scheduleNext();
      }, current.duration);
    };

    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  // Input particles with varied positions
  const inputParticles = Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const radius = 100 + Math.random() * 50;
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: Math.random() * 8 + 4,
      color: i % 3 === 0 ? 'hsl(190, 70%, 60%)' : i % 3 === 1 ? 'hsl(180, 65%, 55%)' : 'hsl(195, 75%, 65%)',
    };
  });

  // Text fragments
  const textFragments = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    width: Math.random() * 30 + 15,
    x: Math.cos((i / 8) * Math.PI * 2) * 120,
    y: Math.sin((i / 8) * Math.PI * 2) * 120,
  }));

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-80 h-80">
        
        {/* Phase 1: Input Elements */}
        <AnimatePresence>
          {phase === 'input' && (
            <>
              {inputParticles.map((particle, i) => (
                <motion.div
                  key={`particle-${iteration}-${particle.id}`}
                  className="absolute rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    background: particle.color,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{ 
                    x: particle.x,
                    y: particle.y,
                    opacity: [0, 1, 1, 0.7],
                    scale: [0, 1.2, 1, 0.9],
                  }}
                  exit={{ 
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0.3,
                    transition: { duration: 0.6, delay: i * 0.02 },
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.05,
                  }}
                />
              ))}

              {textFragments.map((fragment, i) => (
                <motion.div
                  key={`fragment-${iteration}-${fragment.id}`}
                  className="absolute h-1 rounded-full"
                  style={{
                    width: fragment.width,
                    background: 'hsl(190, 70%, 60%)',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    x: 0,
                    y: 0,
                    opacity: 0,
                    rotate: 0,
                  }}
                  animate={{ 
                    x: fragment.x,
                    y: fragment.y,
                    opacity: [0, 0.8, 0.8, 0.6],
                    rotate: [0, 0, Math.random() * 20 - 10],
                  }}
                  exit={{ 
                    x: 0,
                    y: 0,
                    opacity: 0,
                    rotate: 0,
                    transition: { duration: 0.6, delay: i * 0.03 },
                  }}
                  transition={{
                    duration: 1,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Phase 2: Processing */}
        <AnimatePresence>
          {phase === 'processing' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* Central processor core */}
              <motion.div
                key={`processor-core-${iteration}`}
                className="relative w-32 h-32 rounded-3xl border-2 flex items-center justify-center"
                style={{
                  borderColor: 'hsl(var(--primary))',
                  background: 'hsl(var(--background))',
                }}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  opacity: 1,
                }}
                exit={{ 
                  scale: 0, 
                  rotate: 180,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                {/* Pulsing glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'hsl(var(--primary) / 0.3)',
                    filter: 'blur(12px)',
                  }}
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Rotating gear icon */}
                <motion.svg
                  width="50"
                  height="50"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="relative z-10"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    fill="hsl(var(--primary) / 0.1)"
                  />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                      key={angle}
                      x1="12"
                      y1="12"
                      x2={12 + Math.cos((angle * Math.PI) / 180) * 9}
                      y2={12 + Math.sin((angle * Math.PI) / 180) * 9}
                      stroke="hsl(var(--primary))"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  ))}
                </motion.svg>
              </motion.div>

              {/* Orbiting particles */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={`orbit-${iteration}-${i}`}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: i % 2 === 0 ? 'hsl(190, 70%, 60%)' : 'hsl(45, 90%, 60%)',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    x: 0,
                    y: -80,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.cos((i / 6) * Math.PI * 2 + Date.now() * 0.001) * 80,
                    y: Math.sin((i / 6) * Math.PI * 2 + Date.now() * 0.001) * 80,
                    opacity: [0, 1, 1],
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    transition: { duration: 0.4 },
                  }}
                  transition={{
                    x: { duration: 2, repeat: Infinity, ease: 'linear' },
                    y: { duration: 2, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 0.3 },
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Phase 3: Output Document */}
        <AnimatePresence>
          {phase === 'output' && (
            <motion.div
              key={`output-${iteration}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72 rounded-xl border-2 p-5 flex flex-col gap-3 shadow-lg"
              style={{
                borderColor: 'hsl(var(--primary))',
                background: 'hsl(var(--background))',
              }}
              initial={{ 
                scale: 0.3,
                opacity: 0,
                rotateY: -90,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
                rotateY: 0,
              }}
              exit={{ 
                scale: 0.3,
                opacity: 0,
                rotateY: 90,
              }}
              transition={{ 
                duration: 0.7,
                ease: 'easeOut',
              }}
            >
              {/* Document header with amber accent */}
              <motion.div
                className="w-full h-10 rounded-lg shadow-sm"
                style={{ background: 'hsl(45, 90%, 60%)' }}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.3,
                  ease: 'easeOut',
                }}
              />
              
              {/* Document content lines */}
              {[85, 95, 65, 90, 75, 85].map((width, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded-full"
                  style={{
                    background: 'hsl(var(--primary))',
                  }}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 0.7 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.5 + i * 0.1,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Decorative accent line */}
              <motion.div
                className="w-full h-1 rounded-full mt-2"
                style={{ background: 'hsl(45, 90%, 60%)' }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.4 }}
                transition={{
                  duration: 0.6,
                  delay: 1.2,
                  ease: 'easeOut',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DataTransformAnimation;
