import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface EarthBackgroundProps {
  greenScore: number; // 0 - 100
}

export default function EarthBackground({ greenScore }: EarthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine Earth physical status based on Green Score
  // Green Store >= 80: Healthy (Green Glow, Blue Oceans, lush green continents)
  // 50 <= Green Score < 80: warning (Yellow haze, duller land, slightly polluted water)
  // Green Score < 50: critical (pulsing red smog, toxic ocean, dark-brown scorched land)
  const isGreen = greenScore >= 80;
  const isWarning = greenScore >= 50 && greenScore < 80;
  const isCritical = greenScore < 50;

  // Set visual vibes based on state
  let glowColor = 'rgba(34, 197, 94, 0.55)'; // green
  if (isWarning) glowColor = 'rgba(234, 179, 8, 0.4)';  // yellow
  if (isCritical) glowColor = 'rgba(239, 68, 68, 0.6)'; // pulsing red

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;
    let cloudsRotation = 0;

    // Generate static land masses coordinates dynamically for procedural continents
    // so they rotate consistently around the sphere projection
    const landMasses = [
      { x: 30, y: 40, r: 25 },
      { x: 80, y: 70, r: 35 },
      { x: 140, y: 30, r: 20 },
      { x: 190, y: 60, r: 40 },
      { x: 260, y: 35, r: 25 },
      { x: 310, y: 75, r: 30 },
      { x: 380, y: 50, r: 35 },
    ];

    // Generate floating CO2 carbon particles for warning & critical states
    const particles: Array<{ x: number; y: number; r: number; speed: number; opacity: number }> = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        r: Math.random() * 3.5 + 1.5,
        speed: Math.random() * 0.4 + 0.1,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    const resizeCanvas = () => {
      // Fit to container dynamically using ResizeObserver helper or standard bounds
      const rect = canvas.getBoundingClientRect();
      const scale = window.devicePixelRatio || 1;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      ctx.scale(scale, scale);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const size = Math.min(width, height) * 0.85;
      const radius = size / 2;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Rotate angles
      rotation += 0.0035; // realistic slow GPU rotation
      cloudsRotation += 0.0055; // clouds rotate at different pace

      // Draw Sphere Mask clipping path natively
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Base Oceans color
      let oceanColor = '#0EA5E9'; // health blue
      if (isWarning) oceanColor = '#0B7AA3'; // slightly polluted/acidified dull blue-grey
      if (isCritical) oceanColor = '#413A32'; // toxic grey-brown oceans
      ctx.fillStyle = oceanColor;
      ctx.fillRect(cx - radius, cy - radius, size, size);

      // Procedural continents drawing wrapped around spherical projection
      landMasses.forEach((land) => {
        // Move islands forward with rotation speed
        let lx = ((land.x + rotation * 50) % 360) - 180; // normalized
        // Orthographic projection conversion approximation
        const relativeX = lx / 180; 
        const renderX = cx + Math.sin(relativeX * Math.PI) * radius;
        const renderY = cy + (land.y / 100 - 0.5) * radius * 1.5;

        // Clip land mass only when visible on front hemisphere
        const isFront = Math.cos(relativeX * Math.PI) > 0;
        if (isFront) {
          ctx.beginPath();
          ctx.arc(renderX, renderY, land.r * (size / 240), 0, Math.PI * 2);
          
          let landColor = '#22C55E'; // lush healthy green
          if (isWarning) landColor = '#D4AF37'; // slightly dry/deforested yellow
          if (isCritical) landColor = '#7B3F00'; // burnt scorched earth brown
          
          ctx.fillStyle = landColor;
          ctx.fill();
        }
      });

      // Shading layer (3D depth / light sphere drop vinitte shadow)
      const grad = ctx.createRadialGradient(
        cx - radius * 0.2, cy - radius * 0.2, radius * 0.3,
        cx, cy, radius
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.65)'); // shadow border
      ctx.fillStyle = grad;
      ctx.fillRect(cx - radius, cy - radius, size, size);

      // Procedural clouds overlay rotating independently
      ctx.fillStyle = isCritical ? 'rgba(230, 230, 230, 0.2)' : 'rgba(255, 255, 255, 0.55)';
      for (let i = 0; i < 6; i++) {
        let cloudAngle = (cloudsRotation + (i * Math.PI / 3)) % (Math.PI * 2);
        const relativeCloudX = Math.cos(cloudAngle);
        if (relativeCloudX > 0) {
          const rx = cx + Math.sin(cloudAngle) * radius * 0.9;
          const ry = cy + Math.sin(i * 123) * radius * 0.5;
          ctx.beginPath();
          ctx.arc(rx, ry, radius * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Restore clipping context
      ctx.restore();

      // Atmospheric Limb Glow ring
      const limbGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, radius * 1.15);
      if (isGreen) {
        limbGrad.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        limbGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.15)');
        limbGrad.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
      } else if (isWarning) {
        limbGrad.addColorStop(0, 'rgba(234, 179, 8, 0.25)');
        limbGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.1)');
        limbGrad.addColorStop(1, 'rgba(234, 179, 8, 0.0)');
      } else {
        limbGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        limbGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
        limbGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = limbGrad;
      ctx.fill();

      // Draw floating CO2 / dust floating toxic air particles for warnings/criticals
      if (isWarning || isCritical) {
        particles.forEach((p) => {
          p.y -= p.speed * (isCritical ? 1.5 : 1);
          if (p.y < -radius) p.y = radius; // recycle
          
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = isCritical ? '#4A4A4A' : '#D1B280'; // grey dust for red, sandy brown for warn
          ctx.beginPath();
          ctx.arc(cx + p.x, cy + p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [greenScore, isGreen, isWarning, isCritical]);

  return (
    <div id="eco-earth-vibe" className="absolute inset-0 select-none overflow-hidden pointer-events-none z-0 bg-[#07111A]">
      {/* Layer 1: Galaxy Deep Space Background Stars */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0b1b2a] via-[#07111a] to-[#03060a] opacity-90 z-0">
        {/* Generous layout stars */}
        <div className="absolute top-10 left-10 w-1 h-1 bg-white opacity-40 rounded-full animate-pulse" />
        <div className="absolute top-1/4 right-20 w-1.5 h-1.5 bg-sky-200 opacity-60 rounded-full animate-ping [animation-duration:4s]" />
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-white opacity-50 rounded-full" />
        <div className="absolute bottom-12 right-1/3 w-2 h-2 bg-emerald-200 opacity-30 rounded-full animate-pulse [animation-duration:7s]" />
        <div className="absolute top-1/2 left-12 w-1.5 h-1.5 bg-yellow-100 opacity-40 rounded-full" />
        <div className="absolute bottom-5 right-10 w-1 h-1 bg-white opacity-60 rounded-full" />
      </div>

      {/* Layer 2: Glowing Atmospheric Halo Overlay */}
      <div 
        className="absolute w-[clamp(180px,38vw,660px)] h-[clamp(180px,38vw,660px)] rounded-full blur-[40px] opacity-60 transition-all duration-1000 ease-in-out left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-110"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      {/* Critical state smoke pulsing background cloud effects */}
      {isCritical && (
        <motion.div 
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-red-950/15 mix-blend-color-burn z-0"
        />
      )}

      {/* Layer 3: Interactive HTML Canvas */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas 
          ref={canvasRef} 
          className="w-[clamp(180px,40vw,600px)] h-[clamp(180px,40vw,600px)] transition-all duration-1000 ease-in-out"
        />
      </div>

      {/* Cinematic HUD Status Label overlay in margin */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 p-2 rounded-xl bg-[#0e1720]/75 backdrop-blur-md border border-white/5 font-mono text-[10px] text-gray-400">
        <span className={`w-2 h-2 rounded-full ${isGreen ? 'bg-green-500 animate-pulse' : isWarning ? 'bg-yellow-500' : 'bg-red-500 animate-ping'}`} />
        <span>EARTH INDEX: {greenScore}% ({isGreen ? 'HEALTHY' : isWarning ? 'WARNING' : 'CRITICAL'})</span>
      </div>
    </div>
  );
}
