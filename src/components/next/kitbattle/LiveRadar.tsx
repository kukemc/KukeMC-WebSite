'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { WSMessage, WSPlayer, WSProjectile, WSKillEvent, WSChatEvent, WSAttackEvent } from '@/types/kitbattle';

const WS_URL = 'wss://api.kuke.ink/api/server/kitbattle/live/ws';
const RECONNECT_DELAY = 3000;
const HEARTBEAT_TIMEOUT = 30000; // Increased to 30s to avoid false positives if server is quiet
const HEARTBEAT_INTERVAL = 5000;

interface LiveRadarProps {
  onKillFeed?: (event: WSKillEvent) => void;
  onChat?: (event: WSChatEvent) => void;
}

const LiveRadar: React.FC<LiveRadarProps> = ({ onKillFeed, onChat }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [players, setPlayers] = useState<WSPlayer[]>([]);
  const [projectiles, setProjectiles] = useState<WSProjectile[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Viewport state for auto-scaling
  const [camPos, setCamPos] = useState({ x: 0, z: 0 });

  // Smooth Interpolation State
  const currentScaleRef = useRef(1);
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const playersMapRef = useRef<Map<string, { x: number, z: number, yaw: number }>>(new Map());
  const projectilesMapRef = useRef<Map<number, { x: number, z: number }>>(new Map());
  const attackEffectsRef = useRef<Array<{ 
    victimUuid: string,
    attackerUuid?: string,
    timestamp: number 
  }>>([]);

  // Preload Avatar Images
  const avatarCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Helper: Get or Load Avatar
  const getAvatar = (name: string) => {
      if (avatarCacheRef.current.has(name)) {
          return avatarCacheRef.current.get(name);
      }
      const img = new Image();
      img.src = `https://cravatar.eu/helmavatar/${name}/16.png`;
      img.onload = () => { /* Force re-render if needed, but RAF loop handles it */ };
      avatarCacheRef.current.set(name, img);
      return img;
  };

  const killEffectsRef = useRef<Array<{ x: number, z: number, victimName: string, killerName?: string, timestamp: number }>>([]);

  const playersRef = useRef<WSPlayer[]>([]);
  const projectilesRef = useRef<WSProjectile[]>([]);

  // Keep latest handlers in refs to avoid reconnection on prop changes
  const onKillFeedRef = useRef(onKillFeed);
  const onChatRef = useRef(onChat);
  const lastMessageTimeRef = useRef(Date.now());

  useEffect(() => {
    onKillFeedRef.current = onKillFeed;
    onChatRef.current = onChat;
  }, [onKillFeed, onChat]);

  // Connect WebSocket
  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout;
    let heartbeatTimer: NodeJS.Timeout;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        console.log('Connected to KitBattle Live WS');
        setConnected(true);
        setError(null);
        lastMessageTimeRef.current = Date.now();
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        lastMessageTimeRef.current = Date.now();
        try {
          const data: WSMessage = JSON.parse(event.data);
          
          if (data.type === 'position_update') {
            setPlayers(data.players);
            playersRef.current = data.players; // Update ref for canvas
            if (data.projectiles) {
                setProjectiles(data.projectiles);
                projectilesRef.current = data.projectiles; // Update ref for canvas
            }
          } else if (data.type === 'kill') {
            if (onKillFeedRef.current) onKillFeedRef.current(data);
            
            const killEvent = data as WSKillEvent;
            killEffectsRef.current.push({
                x: killEvent.victim.location.x,
                z: killEvent.victim.location.z,
                victimName: killEvent.victim.name,
                killerName: killEvent.killer?.name,
                timestamp: Date.now()
            });

          } else if (data.type === 'chat') {
            if (onChatRef.current) onChatRef.current(data);
          } else if (data.type === 'attack') {
             const attack = data as WSAttackEvent;
             attackEffectsRef.current.push({
                 victimUuid: attack.victim.uuid,
                 attackerUuid: attack.attacker?.uuid,
                 timestamp: Date.now()
             });
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from KitBattle Live WS');
        if (isMounted) {
          setConnected(false);
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        if (isMounted) {
            setError('Connection Error');
        }
      };
    };

    connect();

    // Heartbeat Check
    heartbeatTimer = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            if (Date.now() - lastMessageTimeRef.current > HEARTBEAT_TIMEOUT) {
                console.log('Heartbeat timeout, reconnecting...');
                wsRef.current.close();
            }
        }
    }, HEARTBEAT_INTERVAL);

    // Force re-layout trigger on mount to ensure canvas size is correct
    if (canvasRef.current) {
        canvasRef.current.style.display = 'none';
        // Force reflow
        void canvasRef.current.offsetHeight; 
        canvasRef.current.style.display = 'block';
    }

    // Visibility Change Handler
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
                 console.log('Page visible, reconnecting...');
                 if (reconnectTimer) clearTimeout(reconnectTimer);
                 connect();
            }
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []); // Empty dependency array to prevent unnecessary reconnections

  const { theme } = useTheme();
  
  // Helper to determine if we are effectively in dark mode
  const isDarkMode = () => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const colors = {
    grid: isDarkMode() ? 'rgba(6, 182, 212, 0.1)' : 'rgba(2, 132, 199, 0.1)',
    text: isDarkMode() ? '#fff' : '#0f172a',
    textSecondary: isDarkMode() ? '#94a3b8' : '#64748b',
    radarSweep: isDarkMode() ? 'rgba(255, 255, 255, 0.2)' : 'rgba(2, 132, 199, 0.2)',
    scanText: isDarkMode() ? 'rgba(6, 182, 212, 0.5)' : 'rgba(2, 132, 199, 0.5)',
    crosshair: isDarkMode() ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)',
  };

    // Canvas Drawing Loop
  const draw = useCallback(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      // Use getBoundingClientRect for more accurate dimension reading
      const rect = canvas.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      if (displayWidth === 0 || displayHeight === 0) return;
  
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
          canvas.width = displayWidth * dpr;
          canvas.height = displayHeight * dpr;
      }
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  
      const width = displayWidth;
      const height = displayHeight;
  
      const dark = isDarkMode();
      const currentColors = {
          grid: dark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(2, 132, 199, 0.1)',
          text: dark ? '#fff' : '#0f172a',
          textSecondary: dark ? '#94a3b8' : '#64748b',
          radarSweepStart: dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(2, 132, 199, 0.2)',
          radarSweepEnd: dark ? 'rgba(255, 255, 255, 0)' : 'rgba(2, 132, 199, 0)',
          scanText: dark ? 'rgba(6, 182, 212, 0.5)' : 'rgba(2, 132, 199, 0.5)',
          crosshair: dark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.5)',
      };
  
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
  
      const currentPlayers = playersRef.current;
      const currentProjectiles = projectilesRef.current;
  
      if (currentPlayers.length === 0) {
          // Draw "Scanning..."
          ctx.fillStyle = currentColors.scanText;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('正在扫描区域...', width / 2, height / 2);
          
          drawGrid(ctx, width, height, 0, 0, 1, currentColors);
          return;
      }
  
      // Auto-fit Logic
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      currentPlayers.forEach(p => {
          minX = Math.min(minX, p.location.x);
          maxX = Math.max(maxX, p.location.x);
          minZ = Math.min(minZ, p.location.z);
          maxZ = Math.max(maxZ, p.location.z);
      });
  
      const cameraLerp = 0.05;
      const scaleX = width / (maxX - minX + 100);
      const scaleZ = height / (maxZ - minZ + 100);
      const targetScale = Math.min(scaleX, scaleZ, 4); // Max zoom limit
  
      currentScaleRef.current += (targetScale - currentScaleRef.current) * cameraLerp;
      const zoom = currentScaleRef.current;
  
      const targetCamX = (minX + maxX) / 2;
      const targetCamZ = (minZ + maxZ) / 2;
      
      if (!currentOffsetRef.current) currentOffsetRef.current = { x: targetCamX, y: targetCamZ };
  
      const currentCamX = currentOffsetRef.current.x + (targetCamX - currentOffsetRef.current.x) * cameraLerp;
      const currentCamZ = currentOffsetRef.current.y + (targetCamZ - currentOffsetRef.current.y) * cameraLerp;
      
      currentOffsetRef.current = { x: currentCamX, y: currentCamZ };
      
      // Throttle camPos updates to avoid excessive re-renders
      const newCamX = Math.round(currentCamX);
      const newCamZ = Math.round(currentCamZ);
      setCamPos(prev => {
          if (prev.x !== newCamX || prev.z !== newCamZ) {
              return { x: newCamX, z: newCamZ };
          }
          return prev;
      });
  
      // Draw Grid
      drawGrid(ctx, width, height, currentCamX, currentCamZ, zoom, currentColors);
  
      // Draw Players
      currentPlayers.forEach(player => {
        const playerKey = player.uuid;
        const targetX = player.location.x;
        const targetZ = player.location.z;
        const targetYaw = player.location.yaw || 0;
        
        let currentP = playersMapRef.current.get(playerKey);
        
        if (!currentP) {
          currentP = { x: targetX, z: targetZ, yaw: targetYaw };
          playersMapRef.current.set(playerKey, currentP);
        } else {
          const playerLerp = 0.15;
          currentP.x += (targetX - currentP.x) * playerLerp;
          currentP.z += (targetZ - currentP.z) * playerLerp;
          
          let diffYaw = targetYaw - currentP.yaw;
          while (diffYaw > 180) diffYaw -= 360;
          while (diffYaw < -180) diffYaw += 360;
          currentP.yaw += diffYaw * playerLerp;
          
          playersMapRef.current.set(playerKey, currentP);
        }
        
        const cx = (currentP.x - currentCamX) * zoom + width / 2;
        const cy = (currentP.z - currentCamZ) * zoom + height / 2;
  
        // Draw View Cone
        const angle = (currentP.yaw + 90) * (Math.PI / 180); 
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 40, angle - 0.5, angle + 0.5);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
        gradient.addColorStop(0, currentColors.radarSweepStart);
        gradient.addColorStop(1, currentColors.radarSweepEnd);
        ctx.fillStyle = gradient;
        ctx.fill();
  
        // Avatar with Ring
        const avatar = getAvatar(player.name);
        const healthPct = Math.max(0, Math.min(1, player.health / player.max_health));
        const healthColor = healthPct > 0.5 ? '#22c55e' : healthPct > 0.2 ? '#eab308' : '#ef4444';
  
        if (avatar && avatar.complete && avatar.naturalWidth > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(avatar, cx - 10, cy - 10, 20, 20);
            ctx.restore();
  
            // Health Ring
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0,0,0,0.1)`;
            ctx.lineWidth = 3;
            ctx.stroke();
  
            ctx.beginPath();
            ctx.arc(cx, cy, 11, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * healthPct));
            ctx.strokeStyle = healthColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Fallback Dot
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = healthColor;
            ctx.fill();
            ctx.strokeStyle = currentColors.text;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
  
        // Name Tag
        ctx.fillStyle = currentColors.text;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = dark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(player.name, cx, cy - 16);
        
        // Kit Tag
        ctx.fillStyle = currentColors.textSecondary;
        ctx.font = '9px sans-serif';
        ctx.shadowBlur = 0;
        ctx.fillText(`[${player.kit}]`, cx, cy - 26);
      });
  
      // Draw Projectiles
      currentProjectiles.forEach(proj => {
          const targetX = proj.location.x;
          const targetZ = proj.location.z;
          const projKey = proj.id;
          
          let currentP = projectilesMapRef.current.get(projKey);
          if (!currentP) {
              currentP = { x: targetX, z: targetZ };
              projectilesMapRef.current.set(projKey, currentP);
          } else {
               const projLerp = 0.3;
               currentP.x += (targetX - currentP.x) * projLerp;
               currentP.z += (targetZ - currentP.z) * projLerp;
               projectilesMapRef.current.set(projKey, currentP);
          }
  
          const cx = (currentP.x - currentCamX) * zoom + width / 2;
          const cy = (currentP.z - currentCamZ) * zoom + height / 2;
  
          ctx.shadowBlur = 5;
          if (proj.type === 'ARROW') {
              const angle = Math.atan2(proj.velocity.z, proj.velocity.x);
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate(angle);
              ctx.beginPath();
              ctx.moveTo(6, 0);
              ctx.lineTo(-4, 3);
              ctx.lineTo(-4, -3);
              ctx.closePath();
              ctx.fillStyle = '#facc15';
              ctx.shadowColor = '#facc15';
              ctx.fill();
              ctx.restore();
          } else if (proj.type === 'ENDER_PEARL') {
               ctx.beginPath();
               ctx.arc(cx, cy, 3, 0, Math.PI * 2);
               ctx.fillStyle = '#2dd4bf';
               ctx.shadowColor = '#2dd4bf';
               ctx.fill();
          } else {
               ctx.beginPath();
               ctx.arc(cx, cy, 2, 0, Math.PI * 2);
               ctx.fillStyle = currentColors.text;
               ctx.fill();
          }
          ctx.shadowBlur = 0;
      });
      
      // Clean up old projectiles
      const activeProjIds = new Set(currentProjectiles.map(p => p.id));
      for (const id of projectilesMapRef.current.keys()) {
          if (!activeProjIds.has(id)) {
              projectilesMapRef.current.delete(id);
          }
      }
  
      // Draw Attack Effects
      const now = Date.now();
      for (let i = attackEffectsRef.current.length - 1; i >= 0; i--) {
          const effect = attackEffectsRef.current[i];
          const age = now - effect.timestamp;
          
          if (age > 400) {
              attackEffectsRef.current.splice(i, 1);
              continue;
          }
  
          const victimPos = playersMapRef.current.get(effect.victimUuid);
          if (victimPos) {
              const cx = (victimPos.x - currentCamX) * zoom + width / 2;
              const cy = (victimPos.z - currentCamZ) * zoom + height / 2;
              
              const alpha = 1 - (age / 400);
              
              // Flash
              ctx.beginPath();
              ctx.arc(cx, cy, 15, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.4})`;
              ctx.fill();
  
              // Attacker Line
              if (effect.attackerUuid) {
                  const attackerPos = playersMapRef.current.get(effect.attackerUuid);
                  if (attackerPos) {
                      const acx = (attackerPos.x - currentCamX) * zoom + width / 2;
                      const acy = (attackerPos.z - currentCamZ) * zoom + height / 2;
  
                      ctx.beginPath();
                      ctx.moveTo(acx, acy);
                      ctx.lineTo(cx, cy);
                      ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
                      ctx.lineWidth = 2;
                      ctx.setLineDash([5, 5]);
                      ctx.stroke();
                      ctx.setLineDash([]);
                  }
              }
          }
      }
  
      // Draw Kill Effects
      for (let i = killEffectsRef.current.length - 1; i >= 0; i--) {
          const kill = killEffectsRef.current[i];
          const age = now - kill.timestamp;
          const duration = 2000;
          
          if (age > duration) {
              killEffectsRef.current.splice(i, 1);
              continue;
          }
  
          const kx = (kill.x - currentCamX) * zoom + width / 2;
          const ky = (kill.z - currentCamZ) * zoom + height / 2;
          
          const progress = age / duration;
          const alpha = 1 - Math.pow(progress, 3);
          const lift = progress * 40;
          
          // Draw X mark
          ctx.beginPath();
          const size = 12;
          ctx.moveTo(kx - size, ky - lift - size);
          ctx.lineTo(kx + size, ky - lift + size);
          ctx.moveTo(kx + size, ky - lift - size);
          ctx.lineTo(kx - size, ky - lift + size);
          ctx.lineWidth = 3;
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.shadowColor = 'red';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
          
          ctx.font = 'bold 12px sans-serif';
           ctx.textAlign = 'center';
           ctx.fillStyle = dark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
           ctx.fillText('已淘汰', kx, ky - lift - 24);
      }
    } catch (e) {
      console.error('Render error:', e);
    }

  }, [theme]); // Re-draw when theme changes

  // Helper: Draw Grid
  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, camZ: number, zoom: number, colors: any) => {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    const step = 50;
    
    const worldLeft = camX - (w / 2) / zoom;
    const worldRight = camX + (w / 2) / zoom;
    const worldTop = camZ - (h / 2) / zoom;
    const worldBottom = camZ + (h / 2) / zoom;
    
    const startX = Math.floor(worldLeft / step) * step;
    const startZ = Math.floor(worldTop / step) * step;
    
    ctx.beginPath();
    for (let x = startX; x <= worldRight; x += step) {
      const sx = (x - camX) * zoom + w / 2;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let z = startZ; z <= worldBottom; z += step) {
      const sy = (z - camZ) * zoom + h / 2;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // Origin Crosshair
    const originSx = (0 - camX) * zoom + w / 2;
    const originSy = (0 - camZ) * zoom + h / 2;
    
    ctx.strokeStyle = colors.crosshair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originSx - 10, originSy);
    ctx.lineTo(originSx + 10, originSy);
    ctx.moveTo(originSx, originSy - 10);
    ctx.lineTo(originSx, originSy + 10);
    ctx.stroke();
  };

  useEffect(() => {
    let frameId: number;
    const render = () => {
      draw();
      frameId = requestAnimationFrame(render);
    };
    render();

    // Add ResizeObserver to handle layout changes (e.g. tab switching)
    const resizeObserver = new ResizeObserver(() => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                draw();
            }
        }
    });

    if (canvasRef.current?.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
    };
  }, [draw]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-50 dark:bg-slate-950/80 overflow-hidden transition-colors duration-300">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-cyan-500/30 px-3 py-1.5 rounded-lg flex flex-col items-end shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-cyan-400 font-sans tracking-widest uppercase">地图坐标</span>
              <span className="text-slate-900 dark:text-white font-sans font-bold">X: {camPos.x} Z: {camPos.z}</span>
          </div>
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-green-500/30 px-3 py-1.5 rounded-lg flex flex-col items-center shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-green-400 font-sans tracking-widest uppercase">在线玩家</span>
              <span className="text-slate-900 dark:text-white font-sans font-bold text-lg">{players.length}</span>
          </div>
      </div>

      {/* Connection Status */}
      <div className="absolute bottom-4 left-4 pointer-events-none">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${connected ? 'bg-green-50/80 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' : 'bg-red-50/80 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-sans font-bold ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {connected ? '服务器连接正常' : '与服务器断开连接'}
              </span>
          </div>
      </div>

      {/* Grid Overlay for Visuals */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      <div className="absolute inset-0 pointer-events-none border border-slate-200 dark:border-cyan-500/10 rounded-2xl m-2" />
    </div>
  );
};

export default LiveRadar;
