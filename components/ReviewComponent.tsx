import React, { useState } from 'react';
import { Star, X, Send, Heart } from 'lucide-react';
import { Review } from '../types';

interface ReviewComponentProps {
  reviews: Review[];
  businessName: string;
  businessId: string;
  onSubmitReview: (rating: number, comment: string) => void;
  onClose: () => void;
  averageRating?: number;
  userReview?: Review; // Current user's review if exists
}

export const ReviewComponent: React.FC<ReviewComponentProps> = ({
  reviews,
  businessName,
  businessId,
  onSubmitReview,
  onClose,
  averageRating,
  userReview
}) => {
  const [rating, setRating] = useState<number>(userReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState(userReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!userReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Kérjük, válasszon csillagok számát!');
      return;
    }
    setIsSubmitting(true);
    try {
      onSubmitReview(rating, comment);
      setRating(0);
      setComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-gradient-to-br from-white via-orange-50 to-white w-full h-full md:w-full md:h-auto md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* Header Background */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                {isEditing ? '✏️ Módosítsd az Értékelést' : '⭐ Review'}
              </h1>
              <p className="text-lg text-white/90 font-bold mt-2">{businessName}</p>
              {isEditing && (
                <p className="text-sm text-white/70 mt-1">Frissítsd az értékelésed vagy a megjegyzésed</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all backdrop-blur-xl border border-white/30 active:scale-90"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          {/* Average Rating Badge */}
          {averageRating !== undefined && (
            <div className="relative z-10 mt-6 inline-block">
              <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      size={20}
                      className={i <= Math.round(averageRating) ? 'fill-orange-500 text-orange-500' : 'text-orange-200'}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-600">{averageRating.toFixed(1)}</p>
                  <p className="text-[10px] font-black text-orange-400 uppercase">{reviews.length} értékelés</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll">
          
          {/* Submit Review Section */}
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-8 border-2 border-orange-200 shadow-lg">
            <h2 className="text-2xl font-black text-orange-900 mb-6">
              {isEditing ? '📝 Módosítsd az értékelésed' : 'Hagyj értékelést! 💭'}
            </h2>

            {/* Star Rating - Large Interactive */}
            <div className="flex gap-4 justify-center mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-all transform hover:scale-125 active:scale-95"
                >
                  <Star
                    size={56}
                    className={`${
                      star <= (hoveredRating || rating)
                        ? 'fill-orange-500 text-orange-500 drop-shadow-lg'
                        : 'text-orange-200'
                    } transition-all cursor-pointer`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            {rating > 0 && (
              <div className="text-center mb-6 animate-in fade-in">
                <p className="text-xl font-black text-orange-600">
                  {rating === 1 && '😞 Rosszabb volt'}
                  {rating === 2 && '😐 Közepes'}
                  {rating === 3 && '😊 Jó volt'}
                  {rating === 4 && '😄 Nagyon jó!'}
                  {rating === 5 && '🤩 Kiváló!'}
                </p>
              </div>
            )}

            {/* Comment Textarea */}
            <div className="mb-6">
              <label className="block text-sm font-black text-orange-900 mb-3">
                Megjegyzés (opcionális)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Írj egy részletes megjegyzést... Pl: Super pizza, gyors szervíz, tökéletes hely baráti körrel ☺️"
                className="w-full p-4 border-2 border-orange-300 rounded-2xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400/30 resize-none bg-white/90 backdrop-blur-sm text-slate-800 placeholder-slate-400"
                rows={5}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-300 disabled:to-slate-400 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              {isSubmitting ? 'Frissítés...' : isEditing ? 'Módosítást Menteni' : 'Review Küldése'}
            </button>
          </div>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Heart size={24} className="text-orange-500" />
                Legfrissebb Értékelések
              </h2>
              <div className="space-y-4">
                {reviews.slice(0, 10).map((review, idx) => (
                  <div
                    key={review.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-orange-300 transition-all animate-in slide-in-from-bottom"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-black text-slate-900">{review.userName}</h4>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              size={16}
                              className={i <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-orange-200'}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {new Date(review.timestamp).toLocaleDateString('hu-HU')}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-slate-700 leading-relaxed mb-3">{review.comment}</p>
                    )}
                    {review.ownerResponse && (
                      <div className="mt-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-xl">
                        <p className="text-xs font-black text-orange-700 mb-1">💬 Válasz az étteremtől:</p>
                        <p className="text-sm text-orange-600">{review.ownerResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {reviews.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-black text-slate-400 mb-2">Még nincs értékelés</p>
              <p className="text-sm text-slate-500">Légy az első aki értékelést hagy! ⭐</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
