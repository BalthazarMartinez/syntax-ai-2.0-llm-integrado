import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const DataTransformAnimation = () => {
  const [phase, setPhase] = useState<'input' | 'processing' | 'output'>('input');
  const [iteration, setIteration] = useState(0);
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    const phaseSequence = [
      { phase: 'input' as const, duration: 3500 },
      { phase: 'processing' as const, duration: 1800 },
      { phase: 'output' as const, duration: 3200 },
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

  // Typing effect for output phase
  useEffect(() => {
    if (phase === 'output') {
      const text = 'Deal Strategy Plan';
      let currentIndex = 0;
      setTypedText('');
      
      const typingInterval = setInterval(() => {
        if (currentIndex <= text.length) {
          setTypedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
        }
      }, 80);

      return () => clearInterval(typingInterval);
    }
  }, [phase, iteration]);

  // Input elements with varied types and positions
  const inputElements = Array.from({ length: 25 }, (_, i) => {
    const angle = (i / 25) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 120 + Math.random() * 80;
    const elementTypes = ['letter', 'dot', 'line', 'bracket'];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'i', 'j', 'k', 'l', 'm', 'n'];
    const punctuation = [',', '.', ':', ';', '!', '?', '"', "'"];
    
    return {
      id: i,
      type: elementTypes[Math.floor(Math.random() * elementTypes.length)],
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: Math.random() * 10 + 6,
      rotation: Math.random() * 360,
      letter: i % 2 === 0 ? letters[i % letters.length] : punctuation[i % punctuation.length],
      color: i % 4 === 0 ? 'hsl(190, 70%, 60%)' : 
             i % 4 === 1 ? 'hsl(180, 65%, 55%)' : 
             i % 4 === 2 ? 'hsl(195, 75%, 65%)' :
             'hsl(185, 68%, 58%)',
      delay: i * 0.04,
    };
  });

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative w-96 h-96">
        
        {/* Phase 1: Input Elements - Data Collection */}
        <AnimatePresence>
          {phase === 'input' && (
            <>
              {inputElements.map((element) => (
                <motion.div
                  key={`element-${iteration}-${element.id}`}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: '50%',
                    fontSize: element.type === 'letter' ? '18px' : undefined,
                    fontWeight: element.type === 'letter' ? '600' : undefined,
                    color: element.color,
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 0,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{ 
                    x: element.x,
                    y: element.y,
                    opacity: [0, 1, 1, 1, 0.85],
                    scale: [0, 1.4, 1.1, 1, 0.98],
                    rotate: [0, element.rotation * 0.2, element.rotation * 0.4],
                  }}
                  exit={{ 
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0.2,
                    rotate: element.rotation,
                    transition: { duration: 0.8, delay: element.delay, ease: 'easeInOut' },
                  }}
                  transition={{
                    duration: 1.8,
                    delay: element.delay,
                    ease: 'easeOut',
                  }}
                >
                  {element.type === 'letter' ? (
                    <span style={{ 
                      textShadow: `0 0 ${element.size}px ${element.color}60` 
                    }}>
                      {element.letter}
                    </span>
                  ) : element.type === 'dot' ? (
                    <div 
                      className="rounded-full" 
                      style={{ 
                        width: element.size, 
                        height: element.size, 
                        background: element.color,
                        boxShadow: `0 0 ${element.size * 2}px ${element.color}50, 0 0 ${element.size * 4}px ${element.color}20`,
                      }} 
                    />
                  ) : element.type === 'line' ? (
                    <div 
                      className="h-1 rounded-full" 
                      style={{ 
                        width: element.size * 3.5, 
                        background: element.color,
                        boxShadow: `0 0 ${element.size * 1.5}px ${element.color}40`,
                      }} 
                    />
                  ) : (
                    <div 
                      className="border-2 rounded" 
                      style={{ 
                        width: element.size, 
                        height: element.size * 1.5, 
                        borderColor: element.color,
                        boxShadow: `0 0 ${element.size}px ${element.color}30`,
                      }} 
                    />
                  )}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Phase 2: Processing - Transformation */}
        <AnimatePresence>
          {phase === 'processing' && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* Central processor core */}
              <motion.div
                key={`processor-core-${iteration}`}
                className="relative w-36 h-36 rounded-3xl border-2 flex items-center justify-center"
                style={{
                  borderColor: 'hsl(var(--primary))',
                  background: 'hsl(var(--background))',
                  boxShadow: '0 0 30px hsl(var(--primary) / 0.3)',
                }}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ 
                  scale: 1, 
                  rotate: 0,
                  opacity: 1,
                }}
                exit={{ 
                  scale: 0.5, 
                  rotate: 180,
                  opacity: 0,
                  transition: { duration: 0.6, ease: 'easeInOut' },
                }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                {/* Pulsing glow - more dramatic */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'hsl(var(--primary) / 0.4)',
                    filter: 'blur(20px)',
                  }}
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Rotating gear icon */}
                <motion.svg
                  width="60"
                  height="60"
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
                    fill="hsl(var(--primary) / 0.15)"
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

              {/* Orbiting particles - more dynamic */}
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div
                  key={`orbit-${iteration}-${i}`}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: i % 2 === 0 ? 'hsl(190, 70%, 60%)' : 'hsl(45, 90%, 60%)',
                    boxShadow: i % 2 === 0 ? '0 0 8px hsl(190, 70%, 60%)' : '0 0 8px hsl(45, 90%, 60%)',
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ 
                    x: 0,
                    y: -90,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.cos((i / 8) * Math.PI * 2 + Date.now() * 0.001) * 90,
                    y: Math.sin((i / 8) * Math.PI * 2 + Date.now() * 0.001) * 90,
                    opacity: [0, 1, 1],
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    transition: { duration: 0.3 },
                  }}
                  transition={{
                    x: { duration: 2, repeat: Infinity, ease: 'linear' },
                    y: { duration: 2, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 0.4 },
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
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 rounded-xl border-2 p-6 flex flex-col gap-4 shadow-xl"
              style={{
                borderColor: 'hsl(var(--primary))',
                background: 'hsl(var(--background))',
                boxShadow: '0 10px 40px hsl(var(--primary) / 0.2)',
              }}
              initial={{ 
                scale: 0.4,
                opacity: 0,
                rotateY: -90,
              }}
              animate={{ 
                scale: 1,
                opacity: 1,
                rotateY: 0,
              }}
              exit={{ 
                scale: 0.4,
                opacity: 0,
                rotateY: 90,
              }}
              transition={{ 
                duration: 0.8,
                ease: 'easeOut',
              }}
            >
              {/* Typed Title - Deal Strategy Plan */}
              <motion.div
                className="w-full min-h-12 flex items-center font-semibold text-lg"
                style={{ 
                  color: 'hsl(45, 90%, 55%)',
                  textShadow: '0 0 20px hsl(45, 90%, 60% / 0.3)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                {typedText}
                {typedText.length < 18 && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    |
                  </motion.span>
                )}
              </motion.div>
              
              {/* Document content lines */}
              {[90, 95, 70, 85, 80, 90, 65].map((width, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded-full"
                  style={{
                    background: 'hsl(var(--primary))',
                    opacity: 0.6,
                  }}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${width}%`, opacity: 0.6 }}
                  transition={{
                    duration: 0.5,
                    delay: 1.2 + i * 0.08,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Decorative accent line */}
              <motion.div
                className="w-full h-1 rounded-full mt-3"
                style={{ 
                  background: 'hsl(45, 90%, 60%)',
                  boxShadow: '0 0 10px hsl(45, 90%, 60% / 0.4)',
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 0.5 }}
                transition={{
                  duration: 0.7,
                  delay: 2,
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
