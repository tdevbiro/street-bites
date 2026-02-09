import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Review } from '../types';

interface ReviewComponentProps {
  reviews: Review[];
  businessName: string;
  onSubmitReview: (rating: number, comment: string) => void;
  onClose: () => void;
  averageRating?: number;
}

export const ReviewComponent: React.FC<ReviewComponentProps> = ({
  reviews,
  businessName,
  onSubmitReview,
  onClose,
  averageRating
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{businessName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Average Rating */}
        {averageRating !== undefined && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}/5</span>
            </div>
          </div>
        )}

        {/* Submit Review Section */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
          <h3 className="font-semibold mb-4 text-lg">Hagyj értékelést</h3>

          {/* Star Rating */}
          <div className="flex gap-3 mb-6 justify-center">
            {[...Array(5)].map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setHoveredRating(i + 1)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(i + 1)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    i < (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Írd meg az élményed... (opcionális)"
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 resize-none mb-4"
            rows={4}
          />

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              isSubmitting || rating === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
            }`}
          >
            {isSubmitting ? 'Küldés...' : 'Küldés'}
          </button>
        </div>

        {/* Recent Reviews */}
        <div>
          <h3 className="font-semibold mb-4 text-lg">Legfrissebb értékelések</h3>
          <div className="space-y-4">
            {reviews.slice(0, 10).map((review) => (
              <div
                key={review.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{review.userName}</h4>
                    <div className="flex gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.timestamp).toLocaleDateString('hu-HU')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                )}
                {review.ownerResponse && (
                  <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Válasz az étteremtől:</p>
                    <p className="text-sm text-blue-600">{review.ownerResponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
