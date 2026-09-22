import React, { useState } from 'react';
import {
  Shield,
  Award,
  TrendingUp,
  PlusCircle,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  HeartHandshake,
  Tag,
  Smile,
  X,
} from 'lucide-react';
import { TradeDecision, BehavioralBadge } from '../types';
import { sound } from '../utils/audio';

interface TradeJournalProps {
  decisions: TradeDecision[];
  badges: BehavioralBadge[];
  onAddDecision: (decision: TradeDecision) => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({
  decisions,
  badges,
  onAddDecision,
}) => {
  const [filter, setFilter] = useState<'all' | 'disciplined' | 'loss-protection'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding custom decision
  const [ticker, setTicker] = useState('2317');
  const [tickerName, setTickerName] = useState('鴻海');
  const [action, setAction] = useState<TradeDecision['action']>('買進試單');
  const [strategyTag, setStrategyTag] = useState('20MA月線突破');
  const [rationale, setRationale] = useState('突破 20MA 短線轉強，設定跌破前一日低點為停損防線。');
  const [disciplineFollowed, setDisciplineFollowed] = useState(true);
  const [emotions, setEmotions] = useState<TradeDecision['emotions']>('冷靜理性');

  // Metrics calculation
  const totalDecisions = decisions.length;
  const disciplinedCount = decisions.filter((d) => d.disciplineFollowed).length;
  const disciplineRate = totalDecisions > 0 ? Math.round((disciplinedCount / totalDecisions) * 100) : 100;
  const decisionWinRate = 72; // Gamified simulated process win-rate
  const avgHoldingDays = 14.2; // Average holding period

  const filteredDecisions = decisions.filter((d) => {
    if (filter === 'disciplined') return d.disciplineFollowed;
    if (filter === 'loss-protection') return d.action === '嚴格停損';
    return true;
  });

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playSuccess();

    const newTrade: TradeDecision = {
      id: `trade-${Date.now()}`,
      ticker,
      tickerName,
      date: new Date().toISOString().split('T')[0],
      action,
      strategyTag,
      rationale,
      disciplineFollowed,
      outcome: '待觀察',
      emotions,
      gainOrDisciplineScore: disciplineFollowed ? '+100 紀律分' : '+50 檢討分',
    };

    onAddDecision(newTrade);
    setIsAddModalOpen(false);
  };

  return (
    <div id="trade-journal-container" className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Top Banner: Process over luck philosophy */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-black tracking-wider uppercase text-emerald-200">
            Ticker Passport · 投資決策日記
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-1">重紀律，而非碰運氣</h2>
        <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
          華爾街傳奇教訓：活在市場裡最久的人，不是猜對最多飆股的人，而是嚴格守住紀律、絕不讓小虧損演變成致命災難的人。
        </p>
      </div>

      {/* KPI Stats Grid: 決策勝率, 平均抱單天數, 鋼鐵紀律勳章 */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Metric 1: 決策勝率 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-slate-200 text-center shadow-xs">
          <div className="w-9 h-9 mx-auto mb-2 bg-emerald-100 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#58CC02]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800">{decisionWinRate}%</p>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5">決策勝率</p>
          <span className="inline-block mt-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            優於 85% 同學
          </span>
        </div>

        {/* Metric 2: 平均抱單天數 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-slate-200 text-center shadow-xs">
          <div className="w-9 h-9 mx-auto mb-2 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800">{avgHoldingDays} <span className="text-xs font-bold text-slate-500">天</span></p>
          <p className="text-[11px] font-bold text-slate-500 mt-0.5">平均抱單天數</p>
          <span className="inline-block mt-1 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
            波段耐力佳
          </span>
        </div>

        {/* Metric 3: 鋼鐵紀律勳章 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border-2 border-amber-200 bg-amber-50/40 text-center shadow-xs">
          <div className="w-9 h-9 mx-auto mb-2 bg-amber-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-600 fill-amber-500" />
          </div>
          <p className="text-sm sm:text-base font-black text-amber-900 mt-1">鋼鐵紀律勳章</p>
          <p className="text-[11px] font-bold text-amber-700 mt-0.5">3/3 遵守停損</p>
          <span className="inline-block mt-1 text-[10px] font-extrabold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
            已解鎖榮譽 🛡️
          </span>
        </div>
      </div>

      {/* Behavioral Badges Carousel / Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
            <span>🛡️</span> 行為金融成就勳章
          </h3>
          <span className="text-xs font-bold text-slate-500">
            解鎖 {badges.filter((b) => b.unlocked).length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {badges.slice(0, 4).map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-2xl border-2 transition-all ${
                badge.unlocked
                  ? 'bg-white border-amber-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <h4 className="font-black text-xs text-slate-800 truncate">{badge.name}</h4>
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                {badge.description}
              </p>
              <div className="mt-2 flex items-center gap-1">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-bold text-slate-400">
                  {badge.progress}/{badge.maxProgress}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Log Section */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span>🛂</span> 決策護照紀錄
          </h3>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : ''
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('disciplined')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'disciplined' ? 'bg-white text-emerald-800 shadow-xs font-black' : ''
                }`}
              >
                守紀律
              </button>
              <button
                onClick={() => setFilter('loss-protection')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filter === 'loss-protection' ? 'bg-white text-rose-800 shadow-xs font-black' : ''
                }`}
              >
                停損保護
              </button>
            </div>

            {/* Add Custom Decision Button */}
            <button
              onClick={() => {
                sound.playClick();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#58CC02] hover:bg-[#4bb302] text-white text-xs font-black rounded-xl border-b-2 border-[#3e9302] active:translate-y-0.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>記一筆</span>
            </button>
          </div>
        </div>

        {/* Decision Cards List */}
        <div className="space-y-3">
          {filteredDecisions.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 text-center text-slate-400">
              <p className="font-bold text-sm">尚無相關決策紀錄</p>
            </div>
          ) : (
            filteredDecisions.map((decision) => (
              <div
                key={decision.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-2 relative"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {decision.ticker}
                    </span>
                    <span className="font-black text-sm text-slate-800">
                      {decision.tickerName}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md ${
                        decision.action === '買進試單'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : decision.action === '嚴格停損'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {decision.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>{decision.date}</span>
                  </div>
                </div>

                {/* Rationale text */}
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {decision.rationale}
                </p>

                {/* Footer tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {decision.strategyTag}
                    </span>
                    <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Smile className="w-3 h-3 text-teal-500" />
                      {decision.emotions}
                    </span>
                  </div>

                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {decision.gainOrDisciplineScore}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Add Decision Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                <span>📝</span> 記錄一筆模擬投資決策
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-600 mb-1">股票代碼</label>
                  <input
                    type="text"
                    required
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="例如 2330"
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-[#58CC02] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-600 mb-1">股票名稱</label>
                  <input
                    type="text"
                    required
                    value={tickerName}
                    onChange={(e) => setTickerName(e.target.value)}
                    placeholder="例如 台積電"
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#58CC02] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-600 mb-1">決策動作</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as TradeDecision['action'])}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#58CC02] outline-none font-bold"
                >
                  <option value="買進試單">買進試單 (建立基本單)</option>
                  <option value="嚴格停損">嚴格停損 (觸發出場保本)</option>
                  <option value="逢高獲利">逢高獲利 (分批落袋為安)</option>
                  <option value="空手觀望">空手觀望 (等待明確訊號)</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-600 mb-1">策略標籤</label>
                <input
                  type="text"
                  value={strategyTag}
                  onChange={(e) => setStrategyTag(e.target.value)}
                  placeholder="如 20MA月線突破、跳空缺口支撐"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#58CC02] outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-slate-600 mb-1">進/出場理由與停損紀律</label>
                <textarea
                  rows={3}
                  required
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="記錄下單依據及跌破何價位必須停損..."
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-[#58CC02] outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="disciplineCheck"
                  checked={disciplineFollowed}
                  onChange={(e) => setDisciplineFollowed(e.target.checked)}
                  className="w-4 h-4 text-[#58CC02] rounded-md focus:ring-0"
                />
                <label htmlFor="disciplineCheck" className="font-extrabold text-slate-700 cursor-pointer">
                  我已在下單前客觀設定停損點，並保證嚴格遵守
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#58CC02] hover:bg-[#4bb302] text-white font-black text-sm rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md mt-2"
              >
                存入決策護照
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
