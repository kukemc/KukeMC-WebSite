import api from '../utils/api';

export interface LevelInfo {
  username: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  rank: number;
  progress: {
    current: number;
    max: number;
  };
}

export interface CheckInStatus {
  web: {
    checked: boolean;
    streak: number;
    today_reward: number;
    bonus_xp?: number;
    calendar: string[]; // ISO dates
  };
  server: {
    checked: boolean;
    streak: number;
  };
  today_checkin_count: number;
  today_web_checkin_count: number;
  today_server_checkin_count: number;
  today_first_checkin_user?: {
    username: string;
    level: number;
  };
}

export interface Task {
  id: string;
  name: string;
  desc: string;
  progress: number;
  target: number;
  completed: boolean;
  can_claim: boolean;
  xp: number;
}

export const getCheckInStatus = async (username: string) => {
  const response = await api.get<CheckInStatus>('/api/level/check-in/status', { 
    params: { 
      username,
      _t: new Date().getTime() // Prevent caching
    } 
  });
  return response.data;
};

export const performWebCheckIn = async (username: string) => {
  const response = await api.post('/api/level/check-in/web', { username });
  return response.data;
};

export const getTasks = async (username: string) => {
  const response = await api.get<Task[]>('/api/level/tasks', { params: { username } });
  return response.data;
};

export const claimTask = async (username: string, taskId: string) => {
  const response = await api.post('/api/level/tasks/claim', { username, task_id: taskId });
  return response.data;
};

export interface LeaderboardEntry {
  username: string;
  level: number;
  total_xp: number;
}

export const getLeaderboard = async (limit: number = 50) => {
  const response = await api.get<LeaderboardEntry[]>('/api/level/leaderboard', { params: { limit } });
  return response.data;
};
