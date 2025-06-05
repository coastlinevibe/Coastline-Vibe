"use client";
import { useState, useRef, useEffect } from 'react';

function StarfishPointer({ enabled }: { enabled: boolean }) {
  const pointerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 100, y: 100 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      const touch = e.touches[0];
      const newPos = { x: touch.clientX - offset.current.x, y: touch.clientY - offset.current.y };
      setPos(newPos);
      window.__pointerPos = newPos;
      window.dispatchEvent(new Event('pointermodechange'));
    };
    const handleTouchEnd = () => { dragging.current = false; };
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      window.__pointerPos = pos;
      window.dispatchEvent(new Event('pointermodechange'));
    }
  }, [enabled, pos]);

  if (!enabled) return null;
  return (
    <div
      ref={pointerRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 9999,
        touchAction: 'none',
        width: 48,
        height: 48,
        pointerEvents: 'auto',
      }}
      onTouchStart={e => {
        dragging.current = true;
        const touch = e.touches[0];
        const rect = pointerRef.current?.getBoundingClientRect();
        offset.current = {
          x: touch.clientX - (rect?.left || 0),
          y: touch.clientY - (rect?.top || 0),
        };
      }}
    >
      {/* Simple SVG starfish */}
      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
        <circle cx="24" cy="24" r="20" fill="#FBBF24" />
        <path d="M24 6 L28 24 L24 42 L20 24 Z" fill="#F59E42" />
        <path d="M6 24 L24 28 L42 24 L24 20 Z" fill="#F59E42" />
        <circle cx="24" cy="24" r="6" fill="#FDE68A" />
      </svg>
    </div>
  );
}

export default function PointerModeToggle() {
  const [pointerMode, setPointerMode] = useState(false);
  useEffect(() => {
    window.__pointerMode = pointerMode;
    window.dispatchEvent(new Event('pointermodechange'));
    if (!pointerMode) {
      window.__pointerPos = undefined;
    }
  }, [pointerMode]);
  return (
    <>
      <div className="fixed bottom-4 right-4 z-[10000]">
        <button
          className={`px-4 py-2 rounded-full font-bold shadow-lg border-2 border-yellow-400 bg-white text-yellow-700 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${pointerMode ? 'bg-yellow-200' : ''}`}
          onClick={() => setPointerMode(v => !v)}
          aria-pressed={pointerMode}
        >
          {pointerMode ? 'Pointer Mode: ON' : 'Pointer Mode: OFF'}
        </button>
      </div>
      <StarfishPointer enabled={pointerMode} />
    </>
  );
} 