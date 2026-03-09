import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { BookOpen, AlertCircle, Loader2, Plus, MessageSquare, Trash2, Calendar, Star, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface JournalNote {
    id: string;
    note_text: string;
    milestone_type: string | null;
    created_at: string;
}

const MILESTONE_TYPES = [
    { value: 'Milestone', color: 'text-amber-500 bg-amber-50 border-amber-200', icon: Star },
    { value: 'Observation', color: 'text-blue-500 bg-blue-50 border-blue-200', icon: MessageSquare },
    { value: 'Challenge', color: 'text-red-500 bg-red-50 border-red-200', icon: AlertTriangle },
    { value: 'Other', color: 'text-slate-500 bg-slate-50 border-slate-200', icon: HelpCircle },
];

export const Journal: React.FC = () => {
    const [notes, setNotes] = useState<JournalNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [newText, setNewText] = useState('');
    const [newType, setNewType] = useState<string>('Observation');

    const fetchNotes = async () => {
        try {
            const res = await api.get('/journal');
            setNotes(res.data || []);
        } catch (err) {
            setError('Failed to load journal entries.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newText.trim()) return;

        setSaving(true);
        try {
            const res = await api.post('/journal', {
                note_text: newText,
                milestone_type: newType,
            });
            // Append new note to the top
            if (res.data) {
                setNotes([res.data, ...notes]);
                setNewText('');
                setNewType('Observation');
            }
        } catch (err) {
            setError('Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;

        try {
            await api.delete(`/journal/${id}`);
            setNotes(notes.filter(n => n.id !== id));
        } catch (err) {
            alert("Failed to delete note");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 min-h-[60vh]">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 pb-24 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <BookOpen className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Guardian Journal</h1>
                    <p className="mt-1 text-slate-500">Record observations, milestones, and challenges during home practice.</p>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center border border-red-100">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* New Note Composer */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Add a New Entry</h2>
                <form onSubmit={handleAddNote} className="space-y-4">
                    <div>
                        <textarea
                            required
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="e.g. He finally pronounced 'Rabbit' perfectly during dinner today!"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 min-h-[100px] resize-y"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {MILESTONE_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setNewType(type.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition-all duration-200 border",
                                        newType === type.value
                                            ? `${type.color} shadow-sm border-transparent`
                                            : "bg-white text-slate-500 hover:bg-slate-50"
                                    )}
                                >
                                    <type.icon className="w-3.5 h-3.5 mr-1.5" />
                                    {type.value}
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={saving || !newText.trim()}
                            className="flex items-center px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                            Add Entry
                        </button>
                    </div>
                </form>
            </div>

            {/* Journal Timeline */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {notes.length === 0 && (
                    <div className="text-center py-12 text-slate-500 relative z-10 bg-slate-50/80 rounded-3xl border border-slate-100 backdrop-blur-sm">
                        <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <p>No journal entries yet. Start writing observations to track non-data progress!</p>
                    </div>
                )}

                {notes.map((note) => {
                    const typeConfig = MILESTONE_TYPES.find(t => t.value === note.milestone_type) || MILESTONE_TYPES[3];
                    const Icon = typeConfig.icon;

                    return (
                        <div key={note.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            {/* Timeline Dot */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <Icon className={cn("w-4 h-4", typeConfig.color.split(' ')[0])} />
                            </div>

                            {/* Note Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl shadow-sm border border-slate-100 bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", typeConfig.color)}>
                                        {note.milestone_type || 'Note'}
                                    </span>
                                    <div className="flex items-center space-x-3 text-xs text-slate-400">
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <button onClick={() => handleDelete(note.id)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{note.note_text}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
