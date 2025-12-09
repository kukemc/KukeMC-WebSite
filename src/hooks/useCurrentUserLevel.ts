import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyLevelInfo } from '../services/leveling';

export const useCurrentUserLevel = () => {
  const { user } = useAuth();
  const [level, setLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      if (!user) {
        setLevel(null);
        setLoading(false);
        return;
      }

      try {
        const info = await getMyLevelInfo(user.username);
        setLevel(info.level);
      } catch (error) {
        console.error('Failed to fetch user level', error);
        setLevel(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
  }, [user]);

  return { level, loading };
};
