import { AnimationProps } from 'framer-motion';

// Floating animation for when a reaction is clicked
export const floatingAnimation = (
  x: number | string = 0, 
  y: string = '-500%', 
  rotate: number = 0,
  scale: number = 2
): AnimationProps => ({
  initial: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    rotate: 0, 
    x: 0 
  },
  animate: { 
    y, 
    opacity: 0, 
    scale, 
    rotate, 
    x 
  },
  exit: { 
    opacity: 0 
  },
  transition: { 
    duration: 1, 
    ease: "easeOut" 
  }
});

// Animation for reaction count change
export const countChangeAnimation = (): AnimationProps => ({
  initial: { 
    scale: 0.7 
  },
  animate: { 
    scale: 1 
  },
  transition: { 
    type: "spring", 
    stiffness: 400, 
    damping: 10 
  }
});

// Animation for reaction item appearance
export const reactionAppearAnimation = (): AnimationProps => ({
  initial: { 
    scale: 0.5, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1 
  },
  exit: { 
    scale: 0, 
    opacity: 0 
  },
  whileHover: { 
    scale: 1.1 
  },
  transition: { 
    type: "spring", 
    stiffness: 300, 
    damping: 15 
  }
});

// Complex animation for reactions with multi-stage animation
export const complexReactionAnimation = (): AnimationProps => ({
  initial: { 
    opacity: 1, 
    scale: 1, 
    y: 0 
  },
  animate: { 
    opacity: 0, 
    scale: [1, 1.5, 1.2, 0], 
    y: [0, -50, -100, -200],
    rotate: [0, -10, 10, -5, 0, 5, 0]
  },
  transition: { 
    duration: 2, 
    ease: "easeOut",
    scale: { duration: 2, times: [0, 0.3, 0.7, 1] },
    rotate: { duration: 2, times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1] }
  }
});

// Generate random parameters for flying reaction animations
export const generateRandomAnimationParams = () => {
  return {
    x: Math.random() * 200 - 100, // Random value between -100 and 100
    rotate: Math.random() * 90 - 45, // Random rotation between -45 and 45 degrees
  };
}; 