import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Volume2, ChevronRight, AlertCircle, BookOpen } from 'lucide-react';

interface TonguePlacement {
    position: string;
    description: string;
    visual_guide: string;
    emoji_hint: string;
}

interface TherapyPhoneme {
    phoneme: string;
    parent_tip: string;
    example_words: string[];
    tongue_placements: TonguePlacement | null;
}

export const Curriculum: React.FC = () => {
    const [phonemes, setPhonemes] = useState<TherapyPhoneme[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoneme, setSelectedPhoneme] = useState<TherapyPhoneme | null>(null);

    useEffect(() => {
        const fetchCurriculum = async () => {
            try {
                const res = await api.get('/curriculum/phonemes');
                setPhonemes(res.data.data || []);
                if (res.data.data?.length > 0) {
                    setSelectedPhoneme(res.data.data[0]);
                }
            } catch (err: any) {
                console.error('Failed to load curriculum:', err);
                setError('Could not load the phoneme curriculum. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchCurriculum();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-100">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (phonemes.length === 0) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-6">
                    <BookOpen className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Curriculum Not Found</h2>
                <p className="text-slate-500 max-w-md">No phoneme data is currently mapped in the database for the Sound Board.</p>
            </div>
        );
    }

    return (
        <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <header className="flex items-center space-x-4 flex-shrink-0">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Volume2 className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mastery Sound Board</h1>
                    <p className="mt-1 text-slate-500">Learn how to coach your child through difficult sounds with visual placement guides.</p>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 overflow-hidden">
                {/* Left Panel: Grid of sounds */}
                <div className="lg:w-1/3 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
                    <div className="mb-4 flex-shrink-0">
                        <h2 className="text-xl font-bold text-slate-800">Target Sounds</h2>
                        <p className="text-sm text-slate-500">Select a sound to view coaching details</p>
                    </div>

                    <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
                        {phonemes.map((p) => (
                            <button
                                key={p.phoneme}
                                onClick={() => setSelectedPhoneme(p)}
                                className={`w-full text-left px-5 py-4 rounded-2xl flex items-center justify-between transition-all duration-200 border-2 ${selectedPhoneme?.phoneme === p.phoneme
                                        ? 'border-indigo-500 bg-indigo-50/50 shadow-md transform scale-[1.02]'
                                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-bold ${selectedPhoneme?.phoneme === p.phoneme ? 'bg-indigo-500 text-white shadow-inner' : 'bg-white text-slate-700 shadow-sm'
                                        }`}>
                                        {p.phoneme}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 tracking-wide">Sound "{p.phoneme}"</p>
                                        <p className="text-xs text-slate-500 capitalize">{p.tongue_placements?.position || 'General'} Placement</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-5 h-5 transition-transform ${selectedPhoneme?.phoneme === p.phoneme ? 'text-indigo-600 translate-x-1' : 'text-slate-400'}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Detail View */}
                <div className="lg:w-2/3 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-y-auto custom-scrollbar relative">
                    {selectedPhoneme ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">

                            {/* Hero Header for Sound */}
                            <div className="flex items-start space-x-6 border-b border-slate-100 pb-8 relative">
                                <div className="absolute top-0 right-0 text-8xl opacity-5 select-none pointer-events-none">
                                    {selectedPhoneme.phoneme}
                                </div>

                                <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-indigo-200 shrink-0">
                                    {selectedPhoneme.phoneme}
                                </div>
                                <div className="pt-2">
                                    <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                                        The "{selectedPhoneme.phoneme}" Sound
                                    </h2>
                                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-full">
                                        <span className="text-lg">{selectedPhoneme.tongue_placements?.emoji_hint}</span>
                                        <span className="text-sm font-semibold text-slate-600 capitalize">
                                            {selectedPhoneme.tongue_placements?.position || 'Standard'} Position
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                {/* Coach / Parent Tip */}
                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                    <h3 className="text-sm tracking-wider font-bold text-amber-800 uppercase mb-3 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                                        Parent Coaching Tip
                                    </h3>
                                    <p className="text-amber-900 font-medium leading-relaxed text-lg">
                                        "{selectedPhoneme.parent_tip}"
                                    </p>
                                </div>

                                {/* Example Words */}
                                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                                    <h3 className="text-sm tracking-wider font-bold text-indigo-800 uppercase mb-4 flex items-center">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
                                        Practice Words
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedPhoneme.example_words && selectedPhoneme.example_words.length > 0 ? (
                                            selectedPhoneme.example_words.map((word, i) => (
                                                <span key={i} className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded-xl shadow-sm border border-indigo-100/50">
                                                    {word}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-indigo-400 text-sm">No specific words mapped.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Technical Anatomical Guide */}
                            {selectedPhoneme.tongue_placements && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800 mb-6 font-serif">Anatomical Breakdown</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">What they should do</h4>
                                            <p className="text-slate-700 leading-relaxed">
                                                {selectedPhoneme.tongue_placements.visual_guide}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Technical Description</h4>
                                            <p className="text-slate-600 leading-relaxed text-sm">
                                                {selectedPhoneme.tongue_placements.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Volume2 className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg">Select a sound to view coaching materials.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
