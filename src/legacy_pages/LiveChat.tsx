import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Send, MessageSquare, Server, AlertCircle, Users, Wifi } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCurrentUserLevel } from '../hooks/useCurrentUserLevel';
import SEO from '../components/SEO';

interface ChatMessage {
  id: number;
  player: string;
  content: string;
  timestamp: number;
  server?: string;
  channel?: string;
  recipient?: string;
}

interface Player {
  name: string;
  uuid: string;
  ping?: number;
}

interface ServerGroup {
  server: string;
  count: number;
  players: Player[];
}

const LiveChat: React.FC = () => {
  const { user, token } = useAuth();
  const { level: currentUserLevel } = useCurrentUserLevel();
  const userRef = useRef(user); // Keep track of current user for WS callbacks

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Online Players State
  const [serverGroups, setServerGroups] = useState<ServerGroup[]>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [showPlayersMobile, setShowPlayersMobile] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Helper to get WS URL
  const getWsUrl = () => {
    const baseUrl = api.defaults.baseURL || 'https://api.kuke.ink';
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const host = baseUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${host}/api/chatlog/public/ws`;
    return token ? `${wsUrl}?token=${token}` : wsUrl;
  };

  // Fetch recent messages
  useEffect(() => {
    const fetchRecent = async () => {
        try {
          const res = await api.get('/api/chatlog/public/recent?limit=50');
          setMessages(res.data.reverse());
        } catch (err) {
        console.error('Failed to fetch recent chat', err);
      }
    };
    fetchRecent();
  }, []);

  // Fetch Online Players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await api.get('/api/playerlist/grouped');
        if (res.data && res.data.servers) {
          setServerGroups(res.data.servers);
          const total = res.data.servers.reduce((acc: number, curr: ServerGroup) => acc + curr.count, 0);
          setTotalOnline(total);
        }
      } catch (err) {
        console.error('Failed to fetch players', err);
      }
    };
    
    fetchPlayers();
    const interval = setInterval(fetchPlayers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // WebSocket Connection
  useEffect(() => {
    const connectWs = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const url = getWsUrl();
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            const msg = data.data;
            // Filter out messages without ID (incomplete) or private messages
            if (msg.id && !msg.recipient && msg.channel !== 'staff') {
              setMessages((prev) => {
                if (prev.some(m => m.id === msg.id)) return prev;
                
                // Optimistic deduplication for self messages
                if (msg.server === 'Web' && msg.player === userRef.current?.username) {
                   const optimisticIndex = prev.findIndex(m => 
                     m.id > 1000000000000 && // It's a timestamp ID
                     m.content === msg.content &&
                     m.player === msg.player
                   );
                   
                   if (optimisticIndex !== -1) {
                     const newPrev = [...prev];
                     newPrev[optimisticIndex] = msg; // Replace optimistic with real
                     return newPrev;
                   }
                }

                const newMessages = [...prev, msg];
                if (newMessages.length > 100) newMessages.shift();
                return newMessages;
              });
            }
          } else if (data.type === 'error') {
            setError(data.message || '发送失败');
            setTimeout(() => setError(null), 3000);
          }
        } catch (e) {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Only reconnect if this is still the current WS instance (avoid race conditions)
        if (wsRef.current === ws) {
           setTimeout(connectWs, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    };

    connectWs();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [token]); // Re-connect when token changes

  // Auto scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || cooldown > 0) return;

    if (!token) {
      setError('请先登录后再发送消息');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (currentUserLevel !== null && currentUserLevel < 5) {
      setError('您的等级不足 5 级，无法发送消息。请前往游戏内升级！');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('实时连接未就绪，请稍后重试');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setCooldown(5);
      
      const formattedContent = `&8[&2Web&8] &f${user?.username || 'Unknown'} &7>> &f${inputValue}`;
      const payload = {
        type: "send",
        content: formattedContent,
        raw_content: inputValue
      };

      wsRef.current.send(JSON.stringify(payload));
      
      // Optimistic update: Show message immediately
      setMessages(prev => [...prev, {
        id: Date.now(),
        player: user?.username || 'Unknown',
        content: inputValue,
        timestamp: Date.now(),
        server: 'Web'
      }]);

      setInputValue('');
    } catch (err: any) {
      setError('发送失败');
      setCooldown(0);
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden">
      <SEO title="实时聊天" />
      
      <motion.div 
        initial="initial"
        animate="animate"
        variants={{
          initial: { opacity: 0 },
          animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        className="max-w-7xl mx-auto relative z-10 h-[85vh] flex flex-col"
      >
        {/* Header */}
        <motion.div 
          variants={{ initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { duration: 0.4 } } }}
          className="flex items-center justify-between mb-6 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 backdrop-blur-md">
              <MessageSquare className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                实时互动
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                {isConnected ? '已连接实时通道' : '正在连接...'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400 bg-white dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 backdrop-blur-md shadow-sm">
              <span className="flex items-center gap-1"><Server className="w-3 h-3" /> 全服互通</span>
              <span className="w-px h-3 bg-slate-200 dark:bg-white/20" />
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {totalOnline} 人在线</span>
            </div>
            {/* Mobile Toggle for Player List */}
            <button 
              onClick={() => setShowPlayersMobile(!showPlayersMobile)}
              className="lg:hidden p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 shadow-sm"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 overflow-hidden pb-4">
          
          {/* Left: Chat Area */}
          <motion.div 
            variants={{ initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.5 } } }}
            className="flex-1 flex flex-col bg-white/80 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg overflow-hidden"
          >
            {/* Messages List */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isSystem = !msg.player;
                  if (isSystem) {
                     return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex justify-center my-4"
                      >
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 backdrop-blur-sm">
                           <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                             {msg.content}
                           </span>
                           <span className="text-[10px] text-slate-400 dark:text-gray-600">
                             {format(new Date(msg.timestamp), 'HH:mm:ss')}
                           </span>
                        </div>
                      </motion.div>
                     );
                  }

                  const isSelf = user?.username === msg.player;

                  return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                    className={`flex items-start gap-3 group ${isSelf ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Link to={`/player/${msg.player}`}>
                        <img 
                          src={`https://minotar.net/helm/${msg.player}/40.png`} 
                          alt={msg.player}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 hover:opacity-80 transition-opacity"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://minotar.net/helm/steve/40.png'; }}
                        />
                      </Link>
                    </div>

                    <div className={`flex-1 flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                      <div className={`flex items-baseline gap-2 mb-1 ${isSelf ? 'flex-row-reverse' : ''}`}>
                        <Link to={`/player/${msg.player}`} className="font-bold text-sm sm:text-base text-slate-700 dark:text-gray-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors hover:underline">
                          {msg.player}
                        </Link>
                        {msg.server && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-500 border border-slate-200 dark:border-white/5">
                            {msg.server}
                          </span>
                        )}
                      </div>
                      
                      <div className="relative group/bubble w-fit max-w-full">
                        <div className={`
                          px-4 py-2.5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm break-words relative transition-all duration-200
                          ${isSelf 
                            ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' 
                            : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 rounded-tl-none border border-slate-200 dark:border-white/5 group-hover/bubble:bg-slate-200 dark:group-hover/bubble:bg-white/10'
                          }
                        `}>
                           {msg.content}
                        </div>
                      </div>
                      <span className={`text-[10px] text-slate-400 dark:text-gray-500 mt-1 ${isSelf ? 'text-right' : 'text-left'}`}>
                         {format(new Date(msg.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  </motion.div>
                )})}
              </AnimatePresence>
            </div>

            {/* Error Toast */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-2 text-sm z-20"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-slate-50/50 dark:bg-black/20 backdrop-blur-md border-t border-slate-200 dark:border-white/10">
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={token ? "参与讨论..." : "请登录后参与聊天"}
                  disabled={!token || cooldown > 0}
                  className="w-full bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 rounded-xl py-3 pl-4 pr-12 border border-slate-200 dark:border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || cooldown > 0}
                    className={`p-2 rounded-lg transition-all flex items-center justify-center
                      ${inputValue.trim() && cooldown === 0
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {cooldown > 0 ? (
                      <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">{cooldown}</span>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
              <div className="text-center mt-2">
                 <span className="text-[10px] text-slate-400 dark:text-gray-600">每5秒仅限发送一条消息 • 请文明发言</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Online Players Sidebar (Desktop) */}
          <motion.div 
            variants={{ initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1, transition: { duration: 0.5 } } }}
            className={`
            fixed inset-0 z-50 lg:static lg:z-auto lg:w-80 lg:block
            ${showPlayersMobile ? 'block' : 'hidden'}
          `}>
            {/* Mobile Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setShowPlayersMobile(false)} />
            
            <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs lg:w-full lg:static lg:h-full bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl lg:rounded-2xl border-l lg:border border-slate-200 dark:border-white/10 shadow-lg flex flex-col transition-transform duration-300 p-4">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">在线玩家 ({totalOnline})</h2>
                <button onClick={() => setShowPlayersMobile(false)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-white/10">
                  <Users className="w-5 h-5" />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-2 mb-4 px-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-slate-800 dark:text-white">在线玩家</h2>
                <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full ml-auto">
                  {totalOnline}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
                {serverGroups.map((group) => (
                  <div key={group.server} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider px-2">
                      <span>{group.server}</span>
                      <span className="w-px h-3 bg-slate-300 dark:bg-white/10" />
                      <span>{group.count} 人</span>
                    </div>
                    <div className="space-y-1">
                      {group.players.map((player) => (
                        <Link to={`/player/${player.name}`} key={player.uuid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                           <div className="relative">
                              <img 
                                src={`https://minotar.net/helm/${player.name}/32.png`} 
                                alt={player.name}
                                className="w-8 h-8 rounded-md shadow-sm border border-slate-200 dark:border-white/10"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://minotar.net/helm/steve/32.png'; }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                               {player.name}
                             </div>
                             {player.ping !== undefined && (
                               <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-gray-500">
                                 <Wifi className="w-3 h-3" />
                                 <span>{player.ping}ms</span>
                               </div>
                             )}
                           </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {serverGroups.length === 0 && (
                  <div className="text-center py-10 text-slate-400 dark:text-gray-600 text-sm">
                    暂无玩家在线
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.3);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
           background: rgba(255, 255, 255, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.5);
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
           background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default LiveChat;
