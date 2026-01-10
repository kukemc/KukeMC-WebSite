'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { WSMessage, WSPlayer, WSProjectile, WSKillEvent, WSChatEvent, WSAttackEvent } from '@/types/kitbattle';
import { Unlock, Search, Maximize } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [players, setPlayers] = useState<WSPlayer[]>([]);
  const [projectiles, setProjectiles] = useState<WSProjectile[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Camera Control State
  const [followedPlayerUuid, setFollowedPlayerUuid] = useState<string | null>(null);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [manualParams, setManualParams] = useState({ x: 0, z: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
   const dragStateRef = useRef({ startX: 0, startY: 0, startCamX: 0, startCamZ: 0 });
 
   // Sync state to ref for render loop
   const drawStateRef = useRef({ followedPlayerUuid, isAutoFit, manualParams });
   useEffect(() => {
       drawStateRef.current = { followedPlayerUuid, isAutoFit, manualParams };
   }, [followedPlayerUuid, isAutoFit, manualParams]);

   // Viewport state for auto-scaling
  const [camPos, setCamPos] = useState({ x: 0, z: 0 });

  // Smooth Interpolation State
  const currentScaleRef = useRef(1);
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const playersMapRef = useRef<Map<string, { x: number, z: number, yaw: number }>>(new Map());
  const projectilesMapRef = useRef<Map<number, { x: number, z: number }>>(new Map());
  const chatBubblesRef = useRef<Array<{ name: string, message: string, expiresAt: number }>>([]);
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

  // --- Interaction Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const currentCam = currentOffsetRef.current;
      const currentZoom = currentScaleRef.current;
      const width = rect.width;
      const height = rect.height;

      let clickedPlayerUuid: string | null = null;
      
      // Check collision with players
      for (const p of playersRef.current) {
          const pMap = playersMapRef.current.get(p.uuid);
          const px = pMap ? pMap.x : p.location.x;
          const pz = pMap ? pMap.z : p.location.z;
          
          const cx = (px - currentCam.x) * currentZoom + width / 2;
          const cy = (pz - currentCam.y) * currentZoom + height / 2;
          
          const dist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
          if (dist < 20) { // 20px hit radius
              clickedPlayerUuid = p.uuid;
              break;
          }
      }

      if (clickedPlayerUuid) {
          setFollowedPlayerUuid(clickedPlayerUuid);
      } else {
          setIsDragging(true);
          dragStateRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              startCamX: currentOffsetRef.current.x,
              startCamZ: currentOffsetRef.current.y
          };
      }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (isDragging) {
          const dx = e.clientX - dragStateRef.current.startX;
          const dy = e.clientY - dragStateRef.current.startY;
          
          const zoom = currentScaleRef.current;
          // World delta = Screen delta / zoom
          const dWorldX = dx / zoom;
          const dWorldZ = dy / zoom;
          
          const newCamX = dragStateRef.current.startCamX - dWorldX;
          const newCamZ = dragStateRef.current.startCamZ - dWorldZ;
          
          setManualParams(prev => ({ ...prev, x: newCamX, z: newCamZ, zoom: zoom }));
          setIsAutoFit(false);
          setFollowedPlayerUuid(null); // Stop following on drag
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
      // Prevent default is handled by native listener in useEffect
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      
      let newZoom = currentScaleRef.current * (1 + delta);
      newZoom = Math.max(0.1, Math.min(newZoom, 10)); // Clamp
      
      if (isAutoFit) {
          setManualParams({
              x: currentOffsetRef.current.x,
              z: currentOffsetRef.current.y,
              zoom: newZoom
          });
          setIsAutoFit(false);
      } else {
          setManualParams(prev => ({ ...prev, zoom: newZoom }));
      }
  };

  // Prevent default scroll behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventScroll = (e: WheelEvent) => {
        e.preventDefault();
    };
    
    container.addEventListener('wheel', preventScroll, { passive: false });
    return () => container.removeEventListener('wheel', preventScroll);
  }, []);

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
            
            // Add chat bubble
            chatBubblesRef.current.push({
                name: data.player,
                message: data.message,
                expiresAt: Date.now() + 6000 // Show for 6 seconds
            });
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
    // Removed potentially conflicting reflow logic that might interfere with initial render
    if (canvasRef.current) {
        // Ensure display is block
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
      let rect = canvas.getBoundingClientRect();
      let displayWidth = rect.width;
      let displayHeight = rect.height;
      
      // Fallback to container dimension if canvas has no size yet (e.g. during layout transition)
      if ((displayWidth === 0 || displayHeight === 0) && containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          if (containerRect.width > 0 && containerRect.height > 0) {
              displayWidth = containerRect.width;
              displayHeight = containerRect.height;
          }
      }
      
      // Ensure we don't set 0 dimensions which can break canvas context
      if (displayWidth === 0) displayWidth = 1;
      if (displayHeight === 0) displayHeight = 1;
  
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
          selectionRing: dark ? '#22d3ee' : '#0284c7',
      };
  
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Filter expired chat bubbles
      const now = Date.now();
      chatBubblesRef.current = chatBubblesRef.current.filter(b => b.expiresAt > now);
      const activeBubbles = new Map(chatBubblesRef.current.map(b => [b.name, b]));

      const currentPlayers = playersRef.current;
      const currentProjectiles = projectilesRef.current;
  
      // Update Player Positions for Lerp
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
      });

      // --- Camera Logic ---
      // Read latest state from ref to avoid stale closures in RAF loop
      const { followedPlayerUuid, isAutoFit, manualParams } = drawStateRef.current;

      let targetCamX = 0;
      let targetCamZ = 0;
      let targetScale = 1;

      // 1. Determine Target State
      if (followedPlayerUuid) {
          // FOLLOW MODE
          const pMap = playersMapRef.current.get(followedPlayerUuid);
          if (pMap) {
              targetCamX = pMap.x;
              targetCamZ = pMap.z;
              // If auto-fit is ON, we use a preset "Zoomed In" level for following
              // If auto-fit is OFF, we use the manual zoom level
              targetScale = isAutoFit ? 2.0 : manualParams.zoom;
          } else {
              // Player lost, revert to previous state or center
              setFollowedPlayerUuid(null);
          }
      } 
      
      if (!followedPlayerUuid) {
          if (isAutoFit && currentPlayers.length > 0) {
              // AUTO-FIT MODE (All Players)
              let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
              currentPlayers.forEach(p => {
                  minX = Math.min(minX, p.location.x);
                  maxX = Math.max(maxX, p.location.x);
                  minZ = Math.min(minZ, p.location.z);
                  maxZ = Math.max(maxZ, p.location.z);
              });
              
              const scaleX = width / (maxX - minX + 100);
              const scaleZ = height / (maxZ - minZ + 100);
              // Multiply by 1.5 to zoom in more by default
              targetScale = Math.min(scaleX, scaleZ, 4) * 1.5; 
              targetCamX = (minX + maxX) / 2;
              targetCamZ = (minZ + maxZ) / 2;
          } else if (isAutoFit && currentPlayers.length === 0) {
              // Scanning / Empty
              targetScale = 1;
              targetCamX = 0;
              targetCamZ = 0;
          } else {
              // MANUAL MODE
              targetCamX = manualParams.x;
              targetCamZ = manualParams.z;
              targetScale = manualParams.zoom;
          }
      }

      // 2. Interpolate Camera
      const cameraLerp = 0.1; // Faster response
      currentScaleRef.current += (targetScale - currentScaleRef.current) * cameraLerp;
      const zoom = currentScaleRef.current;
      
      if (!currentOffsetRef.current) currentOffsetRef.current = { x: targetCamX, y: targetCamZ };
      
      const currentCamX = currentOffsetRef.current.x + (targetCamX - currentOffsetRef.current.x) * cameraLerp;
      const currentCamZ = currentOffsetRef.current.y + (targetCamZ - currentOffsetRef.current.y) * cameraLerp;
      currentOffsetRef.current = { x: currentCamX, y: currentCamZ };

      // Update State for HUD (throttled)
      const newCamX = Math.round(currentCamX);
      const newCamZ = Math.round(currentCamZ);
      setCamPos(prev => (prev.x !== newCamX || prev.z !== newCamZ) ? { x: newCamX, z: newCamZ } : prev);

      if (currentPlayers.length === 0 && !manualParams) {
          // Draw "Scanning..."
          ctx.fillStyle = currentColors.scanText;
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('正在扫描区域...', width / 2, height / 2);
          drawGrid(ctx, width, height, 0, 0, 1, currentColors);
          return;
      }
  
      // Draw Grid
      drawGrid(ctx, width, height, currentCamX, currentCamZ, zoom, currentColors);
  
      // Draw Players
      currentPlayers.forEach(player => {
        const playerKey = player.uuid;
        const currentP = playersMapRef.current.get(playerKey);
        if (!currentP) return;
        
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
  
        // Selection Ring (if followed)
        if (followedPlayerUuid === player.uuid) {
            ctx.beginPath();
            ctx.arc(cx, cy, 16, 0, Math.PI * 2);
            ctx.strokeStyle = currentColors.selectionRing;
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

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

    // Draw Chat Bubbles (After players loop to ensure z-index on top)
    currentPlayers.forEach(player => {
        const bubble = activeBubbles.get(player.name);
        if (!bubble) return;

        const playerKey = player.uuid;
        const currentP = playersMapRef.current.get(playerKey);
        if (!currentP) return;
        
        const cx = (currentP.x - currentCamX) * zoom + width / 2;
        const cy = (currentP.z - currentCamZ) * zoom + height / 2;

        ctx.save();
        ctx.font = '12px sans-serif';
        const textMetrics = ctx.measureText(bubble.message);
        const textWidth = textMetrics.width;
        const padding = 8;
        const bubbleW = textWidth + padding * 2;
        const bubbleH = 24;
        const bubbleX = cx - bubbleW / 2;
        const bubbleY = cy - 50;

        // Bubble Background
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6);
        ctx.fillStyle = dark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = dark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Bubble Tail
        ctx.beginPath();
        ctx.moveTo(cx, bubbleY + bubbleH);
        ctx.lineTo(cx - 5, bubbleY + bubbleH);
        ctx.lineTo(cx, bubbleY + bubbleH + 5);
        ctx.lineTo(cx + 5, bubbleY + bubbleH);
        ctx.fill();
        
        // Text
        ctx.fillStyle = currentColors.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bubble.message, cx, bubbleY + bubbleH / 2);
        ctx.restore();
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
    const step = 20; // Smaller grid size
    
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
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                // Resize canvas to match container immediately
                if (canvasRef.current) {
                    canvasRef.current.width = rect.width * (window.devicePixelRatio || 1);
                    canvasRef.current.height = rect.height * (window.devicePixelRatio || 1);
                }
                draw();
            }
        }
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }

    // Fix: Force redraw after animation transition
    // When switching tabs, Framer Motion animation might cause initial dimensions to be 0 or unstable.
    // We force a few redraws to ensure the canvas catches up with the final layout.
    const timers: NodeJS.Timeout[] = [];
    [100, 300, 500, 800].forEach(delay => {
        timers.push(setTimeout(() => {
             if (containerRef.current) {
                 const rect = containerRef.current.getBoundingClientRect();
                 if (rect.width > 0 && rect.height > 0) {
                     draw();
                 }
             }
        }, delay));
    });

    return () => {
        cancelAnimationFrame(frameId);
        resizeObserver.disconnect();
        timers.forEach(t => clearTimeout(t));
    };
  }, [draw]);

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full min-h-[600px] bg-slate-50 dark:bg-slate-950/80 overflow-hidden transition-colors duration-300 select-none group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
    >
      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      />
      
      {/* Controls Overlay (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2 pointer-events-auto">
             {followedPlayerUuid && (
                 <button
                    onClick={() => setFollowedPlayerUuid(null)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white shadow-sm hover:bg-red-600 transition-all"
                 >
                     <Unlock size={14} />
                     <span className="text-xs font-bold">停止跟随</span>
                 </button>
             )}
             
             <button
                onClick={() => {
                    setIsAutoFit(true);
                    setFollowedPlayerUuid(null);
                }}
                className={`p-2 rounded-lg backdrop-blur border shadow-sm transition-all flex items-center gap-2 ${isAutoFit ? 'bg-brand-500 text-white border-brand-600' : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title="自动跟随/缩放"
             >
                 {isAutoFit ? <Maximize size={18} /> : <Search size={18} />}
                 <span className="text-xs font-bold hidden group-hover:block transition-all">
                    {isAutoFit ? '自动视角' : '手动视角'}
                 </span>
             </button>
          </div>
      </div>

      {/* HUD Overlay */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none z-10">
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
      <div className="absolute bottom-4 left-4 pointer-events-none z-10">
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
