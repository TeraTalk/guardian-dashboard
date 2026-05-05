import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import {
  AlertCircle, History, TrendingDown, ChevronDown, ChevronUp,
  Target, CheckCircle2, TrendingUp, BarChart2,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SodaError { category: string; expected: string | null; produced: string; }

interface AttemptData {
  id: number;
  created_at: string;
  is_pass: boolean;
  severity: number | null;
  speech_level: string;
  expected_word?: string | null;
  expected_sound?: string | null;
  transcribed_word?: string | null;
  error_type?: string | null;
  confidence?: number | null;
  wrong_word?: boolean | null;
  game_type?: string | null;
  game_level?: number | null;
  analysis_model?: string | null;
  phonological_analysis?: {
    errors: { type: string; expected: string; position: number; predicted: string }[];
    severity_label?: string;
    expected_phonemes: string[];
    recognized_phonemes: string[];
    wrong_word_msg?: string;
  } | null;
  soda_analysis?: {
    soda_errors: { taxonomy: SodaError[]; primary_error_type: string };
    pronunciation_quality_combined: number;
    articulation_errors: Array<{ expected: string; produced: string; details: Record<string, string> }>;
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GAME_LABELS: Record<string, string> = {
  pizza_toppings: 'Pizza Toppings',
  candy_land: 'Candy Land',
  alphaspeak: 'AlphaSpeak',
  pancake_maker: 'Pancake Maker',
};

const SODA_LABELS: Record<string, string> = {
  substitution: 'Wrong sound used',
  addition: 'Extra sound added',
  omission: 'Sound omitted',
  stopping: 'Early stopping',
  depalatalization: 'Wrong tongue position',
};

// ── Detail Panel ──────────────────────────────────────────────────────────────

const DetailPanel: React.FC<{ attempt: AttemptData }> = ({ attempt }) => {
  const quality = attempt.soda_analysis?.pronunciation_quality_combined ?? null;
  const sodaErrors = attempt.soda_analysis?.soda_errors?.taxonomy ?? [];
  const artErrors = attempt.soda_analysis?.articulation_errors ?? [];
  const expectedPh = attempt.phonological_analysis?.expected_phonemes ?? [];
  const recognizedPh = attempt.phonological_analysis?.recognized_phonemes ?? [];
  const phonErrors = attempt.phonological_analysis?.errors ?? [];

  const hasContent = quality !== null || sodaErrors.length > 0 || artErrors.length > 0 || expectedPh.length > 0;
  if (!hasContent) return (
    <tr>
      <td colSpan={6} className="px-6 py-3 bg-slate-50 text-xs text-slate-400 italic border-b border-slate-100">
        No detailed analysis available for this attempt.
      </td>
    </tr>
  );

  return (
    <tr>
      <td colSpan={6} className="bg-slate-50 border-b border-slate-100">
        <div className="px-6 py-4 space-y-4">

          {/* Quality bar */}
          {quality !== null && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 w-36 shrink-0">Pronunciation Quality</span>
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-xs">
                <div
                  className={`h-full rounded-full ${quality >= 0.8 ? 'bg-emerald-500' : quality >= 0.5 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  style={{ width: `${Math.round(quality * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600">{Math.round(quality * 100)}%</span>
            </div>
          )}

          {/* Phoneme comparison */}
          {expectedPh.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Sound Comparison</p>
              <div className="flex flex-wrap gap-1.5">
                {expectedPh.map((ph, i) => {
                  const heard = recognizedPh[i];
                  const match = heard === ph;
                  return (
                    <div key={i} className={`text-center rounded px-2 py-1 min-w-[44px] border text-[11px]
                      ${match ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                      <div className="font-bold">{ph}</div>
                      {!match && heard && <div className="text-rose-400 font-medium">{heard}</div>}
                      {match && <div className="text-emerald-400">✓</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SODA errors */}
          {sodaErrors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Error Breakdown</p>
              <div className="flex flex-wrap gap-2">
                {sodaErrors.map((e, i) => (
                  <span key={i} className="text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-600">
                    <span className="font-medium">{SODA_LABELS[e.category] ?? e.category}</span>
                    <span className="text-slate-400 ml-1 font-mono">
                      {e.expected ? `/${e.expected}/→/${e.produced}/` : `+/${e.produced}/`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Articulation */}
          {artErrors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Articulation Notes</p>
              <div className="space-y-1">
                {artErrors.slice(0, 3).map((e, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    Expected <span className="font-semibold">/{e.expected}/</span>, produced{' '}
                    <span className="font-semibold text-rose-600">/{e.produced}/</span>
                    {Object.values(e.details).length > 0 && (
                      <span className="text-slate-400"> — {Object.values(e.details).join('; ')}</span>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Phonological errors list */}
          {phonErrors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">Phonological Errors</p>
              <div className="flex flex-wrap gap-2">
                {phonErrors.slice(0, 6).map((e, i) => (
                  <span key={i} className="text-[11px] bg-white border border-slate-200 rounded px-2 py-0.5 font-mono text-slate-600">
                    {e.type}: <span className="text-emerald-600">{e.expected}</span>→<span className="text-rose-500">{e.predicted}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

export const Analytics: React.FC = () => {
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/evaluation/history').catch(() => ({ data: generateMockData() }));
        setAttempts(res.data || []);
      } catch {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Chart data
  const severityByDay = attempts.reduce((acc, curr) => {
    if (curr.severity === null) return acc;
    const date = new Date(curr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { date, total: 0, count: 0 };
    acc[date].total += curr.severity; acc[date].count += 1;
    return acc;
  }, {} as Record<string, { date: string; total: number; count: number }>);

  const trendData = Object.values(severityByDay)
    .map(d => ({ date: d.date, 'Avg. Severity': +(d.total / d.count).toFixed(2) })).reverse();

  const byLevel = attempts.reduce((acc, curr) => {
    if (!acc[curr.speech_level]) acc[curr.speech_level] = { level: curr.speech_level, Passed: 0, 'Needs Practice': 0 };
    if (curr.is_pass) acc[curr.speech_level].Passed += 1;
    else acc[curr.speech_level]['Needs Practice'] += 1;
    return acc;
  }, {} as Record<string, { level: string; Passed: number; 'Needs Practice': number }>);

  const total = attempts.length;
  const passed = attempts.filter(a => a.is_pass).length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgQ = total > 0
    ? Math.round(attempts.map(a => a.soda_analysis?.pronunciation_quality_combined ?? (a.is_pass ? 0.85 : 0.4))
        .reduce((s, v) => s + v, 0) / total * 100)
    : 0;

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <header className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
          <TrendingDown className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Speech Analytics</h1>
          <p className="mt-1 text-slate-500">Monitor your child's pronunciation accuracy and progress over time.</p>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Target className="w-4 h-4" />,       label: 'Total Attempts', value: total },
          { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Passed',         value: passed },
          { icon: <TrendingUp className="w-4 h-4" />,   label: 'Pass Rate',      value: `${passRate}%` },
          { icon: <BarChart2 className="w-4 h-4" />,    label: 'Avg. Quality',   value: `${avgQ}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</span>
              <span className="text-slate-400">{s.icon}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Pronunciation Severity Trend</h2>
          <p className="text-sm text-slate-500 mb-4">Lower is better. Average error severity per day.</p>
          <div className="h-[280px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="Avg. Severity" stroke="#8b5cf6" strokeWidth={3}
                    dot={{ strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#8b5cf6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">Not enough data yet</div>}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Success Rate by Difficulty</h2>
          <p className="text-sm text-slate-500 mb-4">Successful vs failed attempts per speech level.</p>
          <div className="h-[280px]">
            {Object.values(byLevel).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.values(byLevel)} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} />
                  <Bar dataKey="Passed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Needs Practice" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-400">Not enough data yet</div>}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Recent Attempt History</h2>
            <p className="text-sm text-slate-500">A detailed log of the last 30 practice attempts. Click "Details" to see error analysis.</p>
          </div>
          <History className="w-6 h-6 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Date &amp; Time</th>
                <th className="px-6 py-4 font-medium">Target Word</th>
                <th className="px-6 py-4 font-medium">Game</th>
                <th className="px-6 py-4 font-medium">Result</th>
                <th className="px-6 py-4 font-medium">Severity</th>
                <th className="px-6 py-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No attempts recorded yet.
                  </td>
                </tr>
              )}
              {attempts.slice(0, 30).map((attempt, index) => {
                const isExpanded = expandedId === attempt.id;
                const sev = attempt.severity ?? 0;
                const sevColor = sev === 0 ? 'bg-emerald-500' : sev < 0.4 ? 'bg-emerald-400' : sev < 0.7 ? 'bg-amber-400' : 'bg-rose-500';
                const wordMismatch = attempt.transcribed_word &&
                  attempt.transcribed_word.toLowerCase() !== (attempt.expected_word ?? '').toLowerCase();
                const hasDetails = !!(
                  attempt.soda_analysis?.soda_errors?.taxonomy?.length ||
                  attempt.phonological_analysis?.errors?.length ||
                  attempt.soda_analysis?.pronunciation_quality_combined !== undefined
                );

                return (
                  <React.Fragment key={attempt.id ?? index}>
                    <tr className={`border-b border-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}>

                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">
                        {new Date(attempt.created_at).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                        })}
                      </td>

                      {/* Target word */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800 capitalize">
                          {attempt.expected_word || attempt.expected_sound || '—'}
                        </div>
                        {wordMismatch && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            Heard: <span className="italic text-rose-500">{attempt.transcribed_word}</span>
                          </div>
                        )}
                        {attempt.wrong_word === true && (
                          <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                            Wrong word
                          </span>
                        )}
                      </td>

                      {/* Game */}
                      <td className="px-6 py-4">
                        <div className="text-slate-700 capitalize">
                          {attempt.game_type ? (GAME_LABELS[attempt.game_type] ?? attempt.game_type.replace(/_/g, ' ')) : '—'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 capitalize">{attempt.speech_level}</div>
                      </td>

                      {/* Result */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                          ${attempt.is_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {attempt.is_pass ? 'Passed' : 'Needs Practice'}
                        </span>
                        {attempt.error_type && (
                          <div className="text-xs text-slate-400 mt-1 capitalize">{attempt.error_type}</div>
                        )}
                      </td>

                      {/* Severity bar */}
                      <td className="px-6 py-4">
                        {attempt.severity !== null ? (
                          <div className="flex items-center gap-2 w-28">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${sevColor}`}
                                style={{ width: `${Math.min(100, sev * 100)}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-8 text-right">{sev.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">N/A</span>
                        )}
                      </td>

                      {/* Details toggle */}
                      <td className="px-6 py-4 text-right">
                        {hasDetails ? (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : attempt.id)}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                              ${isExpanded
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'}`}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Hide' : 'Details'}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {isExpanded && <DetailPanel attempt={attempt} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Mock Data ─────────────────────────────────────────────────────────────────
function generateMockData(): AttemptData[] {
  const data: AttemptData[] = [];
  const now = new Date();
  const words = ['Rabbit', 'Snake', 'Train', 'Blue', 'Car'];
  const sounds = ['R', 'S', 'TR', 'BL', 'K'];
  const games = ['pancake_maker', 'candy_land', 'alphaspeak'];
  const errors = ['Substitution', 'Mixed', 'Addition'];
  for (let i = 0; i < 20; i++) {
    const d = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const level = Math.random() > 0.6 ? 'intermediate' : 'beginner';
    const isPass = level === 'beginner' ? Math.random() > 0.3 : Math.random() > 0.6;
    const severity = isPass ? Math.random() * 0.4 : 0.5 + Math.random() * 0.5;
    data.push({
      id: i,
      created_at: d.toISOString(),
      is_pass: isPass,
      severity,
      speech_level: level,
      expected_word: words[Math.floor(Math.random() * words.length)],
      expected_sound: sounds[Math.floor(Math.random() * sounds.length)],
      transcribed_word: isPass ? words[0] : 'wabbit',
      error_type: isPass ? null : errors[Math.floor(Math.random() * errors.length)],
      confidence: 0.6 + Math.random() * 0.35,
      game_type: games[Math.floor(Math.random() * games.length)],
      game_level: 2,
    });
  }
  return data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
