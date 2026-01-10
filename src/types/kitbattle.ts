export interface KitBattlePlayerStats {
  uuid: string;
  name: string;
  kills: number;
  deaths: number;
  exp: number;
  coins: number;
  elo: number;
  killstreak: number;
  highest_killstreak: number;
  rank: string;
  updated_at: number;
}

export interface KitBattleKitStats {
  kit_name: string;
  kills: number;
}

export interface PlayerDetails extends KitBattlePlayerStats {
  kits_stats: KitBattleKitStats[];
  favorite_kit: string | null;
}

// WebSocket Types

export interface WSLocation {
  world?: string;
  x: number;
  y: number;
  z: number;
  yaw?: number;
  pitch?: number;
}

export interface WSPlayer {
  uuid: string;
  name: string;
  kit: string;
  health: number;
  max_health: number;
  location: WSLocation;
}

export interface WSProjectile {
  id: number;
  type: string; // ARROW, SNOWBALL, etc.
  location: WSLocation;
  velocity: { x: number; y: number; z: number };
}

export interface WSPositionUpdate {
  type: 'position_update';
  timestamp: number;
  players: WSPlayer[];
  projectiles?: WSProjectile[];
}

export interface WSKillEvent {
  type: 'kill';
  timestamp: number;
  message: string;
  victim: {
    name: string;
    uuid: string;
    kit: string;
    location: WSLocation;
  };
  killer?: {
    name: string;
    uuid: string;
    kit: string;
    health: number;
  };
}

export interface WSChatEvent {
  type: 'chat';
  timestamp: number;
  player: string;
  message: string;
}

export interface WSAttackEvent {
  type: 'attack';
  timestamp: number;
  attacker?: {
    name: string;
    uuid: string;
  };
  victim: {
    name: string;
    uuid: string;
    health: number;
  };
  damage: number;
  is_projectile: boolean;
}

export interface WSProjectileLaunchEvent {
  type: 'projectile_launch';
  timestamp: number;
  projectile_id: number;
  projectile_type: string;
  shooter: {
    name: string;
    uuid: string;
  };
  location: WSLocation;
  velocity: { x: number; y: number; z: number };
  potion_effects?: { type: string; amplifier: number; duration: number }[];
}

export interface WSProjectileHitEvent {
  type: 'projectile_hit';
  timestamp: number;
  projectile_id: number;
  location: WSLocation;
  hit_entity_type?: string;
  hit_entity_id?: number;
}

export type WSMessage = 
  | WSPositionUpdate 
  | WSKillEvent 
  | WSChatEvent 
  | WSAttackEvent 
  | WSProjectileLaunchEvent 
  | WSProjectileHitEvent;
