import React, { useState } from 'react';
import { Task, claimTask } from '../../services/leveling';
import { CheckCircle, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Props {
  tasks: Task[] | null;
  username: string;
  onTaskUpdate: () => void;
  loading?: boolean;
}

const TaskBoard: React.FC<Props> = ({ tasks, username, onTaskUpdate, loading }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleClaim = async (taskId: string, e: React.MouseEvent) => {
    setLoadingId(taskId);
    
    // Calculate click position for confetti
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    try {
      const res = await claimTask(username, taskId);
      if (res.status === 'success') {
          confetti({
              particleCount: 60,
              spread: 70,
              origin: { x, y },
              colors: ['#f97316', '#eab308'], // Orange and Yellow
              disableForReducedMotion: true
          });
          onTaskUpdate();
      } else {
          alert("领取失败");
      }
    } catch (error) {
      console.error(error);
      alert("领取失败");
    } finally {
      setLoadingId(null);
    }
  };

  if (loading || !tasks) {
      return (
          <div className="space-y-6 animate-pulse">
              {[1, 2].map(i => (
                  <div key={i}>
                      <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                      <div className="space-y-3">
                          {[1, 2, 3].map(j => (
                              <div key={j} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )
  }

  const dailyTasks = tasks.filter(t => !t.id.includes("week"));
  const weeklyTasks = tasks.filter(t => t.id.includes("week"));

  const TaskItem = ({ task }: { task: Task }) => {
    const progressPercent = Math.min((task.progress / task.target) * 100, 100);
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${task.completed ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform'}`}>
                {task.completed ? <CheckCircle size={24}/> : <Gift size={24}/>}
            </div>
        </div>
        
        <div className="flex-grow min-w-0">
            <div className="flex justify-between mb-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{task.name}</h4>
                <span className="text-xs font-bold text-orange-500">+{task.xp} XP</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{task.desc}</p>
            
            <div className="flex items-center gap-3">
                <div className="flex-grow h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full rounded-full ${task.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                    ></motion.div>
                </div>
                <span className="text-xs text-gray-400 font-mono w-16 text-right">
                    {task.progress}/{task.target}
                </span>
            </div>
        </div>

        <div className="flex-shrink-0">
            {task.can_claim ? (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleClaim(task.id, e)}
                    disabled={loadingId === task.id}
                    className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-orange-500/30"
                >
                    {loadingId === task.id ? '...' : '领取'}
                </motion.button>
            ) : task.completed ? (
                <button disabled className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-sm font-medium rounded-lg">
                    已完成
                </button>
            ) : (
                <button disabled className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 text-sm font-medium rounded-lg opacity-50">
                    进行中
                </button>
            )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                每日任务
            </h3>
            <div className="space-y-3">
                {dailyTasks.map(t => <TaskItem key={t.id} task={t} />)}
            </div>
        </div>
        
        <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                每周任务
            </h3>
            <div className="space-y-3">
                {weeklyTasks.map(t => <TaskItem key={t.id} task={t} />)}
            </div>
        </div>
    </div>
  );
};

export default TaskBoard;
