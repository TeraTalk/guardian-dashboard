import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, MapPin, Star, CalendarDays, ChevronRight, UserCircle } from 'lucide-react';

interface Therapist {
    user_id: string;
    full_name: string;
    clinic_name: string;
    specialty: string;
    bio: string;
    avatar_url?: string;
}

interface Package {
    id: string;
    title: string;
    duration_months: number;
    price: number;
    description: string;
    therapy_goals: string[];
}

export const FindTherapist: React.FC = () => {
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    
    // Booking modal state
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
    const [schedulingNotes, setSchedulingNotes] = useState('');
    const [bookingSubmitting, setBookingSubmitting] = useState(false);

    useEffect(() => {
        const fetchTherapists = async () => {
            try {
                const response = await api.get('/therapists');
                setTherapists(response.data);
            } catch (error) {
                console.error("Failed to load therapists", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTherapists();
    }, []);

    const handleSelectTherapist = async (therapist: Therapist) => {
        setSelectedTherapist(therapist);
        setSelectedPackage(null);
        try {
            const response = await api.get(`/therapists/${therapist.user_id}/packages`);
            setPackages(response.data);
        } catch (error) {
            console.error("Failed to load packages", error);
        }
    };

    const handleBook = async () => {
        if (!selectedPackage || !selectedTherapist) return;
        setBookingSubmitting(true);
        try {
            await api.post('/bookings', {
                therapistId: selectedTherapist.user_id,
                packageId: selectedPackage.id,
                preferredSchedule: { notes: schedulingNotes }
            });
            alert('Booking request sent successfully!');
            setSelectedPackage(null);
            setSelectedTherapist(null);
        } catch (error) {
            alert('Failed to book. Please try again.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading therapists nearest you...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            <header>
                <div className="flex items-center gap-3 text-purple-600 mb-2">
                    <Search className="w-6 h-6" />
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Find a Therapist</h1>
                </div>
                <p className="text-slate-500">Discover and book accredited speech therapists to elevate your child's journey.</p>
            </header>

            {!selectedTherapist ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {therapists.map(t => (
                        <div key={t.user_id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    {t.avatar_url ? (
                                        <img src={t.avatar_url} alt={t.full_name} className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center shrink-0">
                                            <UserCircle className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 leading-tight">{t.full_name || 'Anonymous Therapist'}</h3>
                                        <p className="text-purple-600 font-medium text-sm flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {t.clinic_name || 'Independent'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 5.0
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3">
                                {t.bio || 'Experienced speech language pathologist dedicated to early childhood development...'}
                            </p>
                            <button 
                                onClick={() => handleSelectTherapist(t)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-xl text-slate-700 font-semibold transition-colors"
                            >
                                View Packages <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {therapists.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
                            No therapists are currently accepting patients.
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8 relative">
                        <button 
                            onClick={() => setSelectedTherapist(null)}
                            className="absolute top-6 right-6 text-sm font-semibold text-slate-500 hover:text-slate-800"
                        >
                            ← Back to Directory
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            {selectedTherapist.avatar_url ? (
                                <img src={selectedTherapist.avatar_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                            ) : null}
                            <h2 className="text-2xl font-bold text-slate-900">{selectedTherapist.full_name}</h2>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 font-medium ml-[80px]">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-purple-500"/> {selectedTherapist.clinic_name}</span>
                            <span className="bg-purple-100 text-purple-700 px-2 rounded-md">{selectedTherapist.specialty}</span>
                        </div>
                        <p className="mt-4 text-slate-700 max-w-3xl leading-relaxed">{selectedTherapist.bio}</p>
                    </div>
                    
                    <div className="p-6 sm:p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Available Therapy Packages</h3>
                        
                        {!selectedPackage ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="border border-purple-100 bg-purple-50/30 rounded-2xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-purple-600 text-white font-bold text-xs px-3 py-1 rounded-bl-lg">
                                            {pkg.duration_months} Months
                                        </div>
                                        <h4 className="font-bold text-lg text-purple-900 mb-1">{pkg.title}</h4>
                                        <p className="text-2xl font-extrabold text-slate-900 mb-4">${pkg.price}</p>
                                        <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                                        
                                        <div className="text-sm font-semibold text-slate-700 mb-2">Therapy Goals:</div>
                                        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1 mb-6">
                                            {pkg.therapy_goals?.map((goal, i) => (
                                                <li key={i}>{goal}</li>
                                            ))}
                                            {(!pkg.therapy_goals || pkg.therapy_goals.length === 0) && <li>Custom goals determined during intake</li>}
                                        </ul>
                                        
                                        <button 
                                            onClick={() => setSelectedPackage(pkg)}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm transition-transform active:scale-95"
                                        >
                                            Select Package
                                        </button>
                                    </div>
                                ))}
                                {packages.length === 0 && <p className="text-slate-500 italic">This therapist has not listed any packages yet.</p>}
                            </div>
                        ) : (
                            <div className="max-w-xl mx-auto border border-slate-200 rounded-2xl p-6 md:p-8 bg-white shadow-xl">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Schedule Intake</h3>
                                <p className="text-slate-500 mb-6">You're booking the <strong className="text-purple-600">{selectedPackage.title}</strong> ({selectedPackage.duration_months} Months) with {selectedTherapist.full_name}.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                            <CalendarDays className="w-4 h-4 text-purple-500"/> Preferred Scheduling
                                        </label>
                                        <textarea
                                            value={schedulingNotes}
                                            onChange={e => setSchedulingNotes(e.target.value)}
                                            rows={3}
                                            placeholder="E.g., Tuesdays at 4:00 PM, or Weekend mornings."
                                            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">The therapist will allocate time based on your availability.</p>
                                    </div>
                                    
                                    <div className="pt-4 flex gap-3">
                                        <button 
                                            onClick={() => setSelectedPackage(null)}
                                            className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleBook}
                                            disabled={bookingSubmitting || !schedulingNotes.trim()}
                                            className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-md hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {bookingSubmitting ? 'Requesting...' : 'Request Booking'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
