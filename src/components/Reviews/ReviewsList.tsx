"use client";

import { useEffect, useMemo, useState } from "react";
import RatingSummary from "./RatingSummary";

interface Review {
  id: string;
  reviewer: {
    name: string;
    avatar?: string;
  };
  rating: number;
  date: string;
  comment: string;
  helpfulCount: number;
  instructorReply?: {
    message: string;
    date: string;
  };
}

type VoteState = "up" | "down" | null;

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  const [sortBy, setSortBy] = useState("mostRecent");
  const [reviewList, setReviewList] = useState(reviews);
  const [visibleCount, setVisibleCount] = useState(5);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});

  useEffect(() => {
    setReviewList(reviews);
  }, [reviews]);

  const averageRating =
    reviewList.length === 0
      ? 0
      : reviewList.reduce((sum, review) => sum + review.rating, 0) /
        reviewList.length;

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviewList.filter((review) => review.rating === stars).length,
  }));

  const sortedReviews = useMemo(() => {
    const sorted = [...reviewList];

    switch (sortBy) {
      case "highestRated":
        return sorted.sort((a, b) => b.rating - a.rating);

      case "lowestRated":
        return sorted.sort((a, b) => a.rating - b.rating);

      case "mostHelpful":
        return sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);

      case "mostRecent":
      default:
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }
  }, [reviewList, sortBy]);

  const handleVote = (reviewId: string, next: Exclude<VoteState, null>) => {
    const current = votes[reviewId] ?? null;
    const resolved: VoteState = current === next ? null : next;

    setVotes((prev) => ({ ...prev, [reviewId]: resolved }));

    setReviewList((prev) =>
      prev.map((item) => {
        if (item.id !== reviewId) return item;

        let delta = 0;
        if (current === "up") delta -= 1;
        if (current === "down") delta += 1;
        if (resolved === "up") delta += 1;
        if (resolved === "down") delta -= 1;

        return { ...item, helpfulCount: item.helpfulCount + delta };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <RatingSummary
        averageRating={averageRating}
        totalReviews={reviewList.length}
        distribution={distribution}
      />

      <div className="flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-ink-200 px-3 py-2 text-sm"
        >
          <option value="mostRecent">Most Recent</option>
          <option value="mostHelpful">Most Helpful</option>
          <option value="highestRated">Highest Rated</option>
          <option value="lowestRated">Lowest Rated</option>
        </select>
      </div>

      {sortedReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 p-8 text-center">
          <p className="text-ink-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedReviews.slice(0, visibleCount).map((review) => {
            const vote = votes[review.id] ?? null;

            return (
              <div
                key={review.id}
                className="rounded-xl border border-ink-100 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 font-semibold">
                      {review.reviewer.avatar ? (
                        <img
                          src={review.reviewer.avatar}
                          alt={`${review.reviewer.name} avatar`}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        review.reviewer.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-ink-900">
                        {review.reviewer.name}
                      </h4>

                      <p className="text-sm text-ink-500">{review.date}</p>
                    </div>
                  </div>

                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= review.rating
                            ? "text-amber-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-ink-700">{review.comment}</p>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-ink-500">
                    Was this review helpful?
                  </span>

                  <button
                    type="button"
                    aria-pressed={vote === "up"}
                    aria-label="Mark review as helpful"
                    onClick={() => handleVote(review.id, "up")}
                    className={
                      vote === "up"
                        ? "flex items-center gap-1 rounded-lg border border-hamplard-primary bg-hamplard-primary/10 px-3 py-1 text-sm font-medium text-hamplard-primary"
                        : "flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1 text-sm font-medium text-ink-600 hover:bg-gray-50"
                    }
                  >
                    <span aria-hidden="true">👍</span>
                    <span>{review.helpfulCount}</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={vote === "down"}
                    aria-label="Mark review as not helpful"
                    onClick={() => handleVote(review.id, "down")}
                    className={
                      vote === "down"
                        ? "flex items-center gap-1 rounded-lg border border-red-500 bg-red-50 px-3 py-1 text-sm font-medium text-red-600"
                        : "flex items-center gap-1 rounded-lg border border-ink-200 px-3 py-1 text-sm font-medium text-ink-600 hover:bg-gray-50"
                    }
                  >
                    <span aria-hidden="true">👎</span>
                  </button>
                </div>

                {review.instructorReply && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-semibold">Instructor Reply</p>

                    <p className="mt-1 text-sm text-ink-700">
                      {review.instructorReply.message}
                    </p>

                    <p className="mt-2 text-xs text-ink-500">
                      {review.instructorReply.date}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {visibleCount < sortedReviews.length && (
        <div className="flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Load More
          </button>
        </div>
      )}

      {/* Empty State */}
    </div>
  );
}
