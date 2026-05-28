import { useState, useEffect } from 'react';

export function useAnimatedCounter(targetValue: number, duration: number = 800): number {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (targetValue === 0) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);
      
      const currentCount = Math.floor(easeProgress * (targetValue - startValue) + startValue);
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, duration]);

  return count;
}
