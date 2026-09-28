import React from 'react';
import { CheckCircle2, Circle, Snowflake, Target } from 'lucide-react';
import { DailyState } from '../types';
import { Mascot } from './Mascot';

interface DailyTasksProps {
  daily: DailyState;
  userName: string;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ daily, userName }) => {
  const allDone = daily.tasks.every((t) => t.done >= t.target);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <Mascot emotion={allDone ? 'celebrating' : 'happy'} size="sm" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-black text-slate-800 text-sm">
              {userName}，今日任務
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
              <Snowflake className="w-3 h-3 text-sky-400" />
              {daily.freezeDays} 凍結
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-2.5">
            三項全清才算「紀律日」
          </p>

          <div className="space-y-2">
            {daily.tasks.map((task) => {
              const done = task.done >= task.target;
              return (
                <div key={task.id} className="flex items-center gap-2">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#58CC02] shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold flex-1 ${
                      done ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}
                  >
                    {task.label}
                  </span>
                  <span className="text-[10px] font-black text-slate-500">
                    {Math.min(task.done, task.target)} / {task.target}
                  </span>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="mt-2.5 flex items-center gap-1.5 bg-[#F0FFF4] border border-emerald-100 rounded-xl px-2.5 py-1.5">
              <Target className="w-3.5 h-3.5 text-[#58CC02]" />
              <span className="text-[11px] font-black text-emerald-800">
                紀律日達成！連續 7 天可拿徽章
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
