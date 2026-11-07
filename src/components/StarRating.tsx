import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number; // px
  showValue?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating,
  size = 16,
  showValue = false,
  reviewCount,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.floor(rating);
          const half = !filled && i - 0.5 <= rating;
          return (
            <Star
              key={i}
              width={size}
              height={size}
              className={
                filled || half
                  ? "fill-gold-400 text-gold-400"
                  : "fill-sand-200 text-sand-200"
              }
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-slate-700">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-slate-500">({reviewCount})</span>
      )}
    </div>
  );
}
