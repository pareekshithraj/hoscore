import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Star, MessageSquare } from 'lucide-react';

export const Feedback = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => { api.get('/feedback').then(setReviews); }, []);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-extrabold">Patient Feedback</h2><p className="text-slate-400">Satisfaction ratings & reviews</p></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map(r => (
          <div key={r.id} className="bg-white p-5 rounded-2xl border">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">{r.category}</span>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({length: 5}).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-current' : 'text-slate-200'}`} />)}
              </div>
            </div>
            <p className="font-bold mb-1">{r.isAnonymous ? 'Anonymous' : r.patientName}</p>
            {r.doctorName && <p className="text-xs text-blue-500 font-medium mb-3">Re: Dr. {r.doctorName}</p>}
            {r.comment && <div className="bg-slate-50 p-3 rounded-xl text-sm text-slate-600 flex gap-2"><MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300"/> <p>{r.comment}</p></div>}
          </div>
        ))}
        {reviews.length === 0 && <p className="col-span-full py-10 text-center text-slate-400">No feedback submitted yet</p>}
      </div>
    </div>
  );
};
