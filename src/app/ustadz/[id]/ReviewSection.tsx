"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquarePlus, Quote } from "lucide-react";
import { Review } from "@/lib/types";
import { getReviews, addReview } from "@/lib/storage";
import StarRating from "@/components/StarRating";

const eventOptions = [
  "Kajian Rutin",
  "Ceramah 7 Bulanan",
  "Ceramah Hari Raya",
  "Pengajian Bulanan",
  "Konseling Pra-Nikah",
  "Bimbingan Tahfidz",
  "Pelatihan Internal",
  "Lainnya",
];

export default function ReviewSection({
  ustadzId,
  ustadzName,
  baseRating,
  baseReviewCount,
}: {
  ustadzId: string;
  ustadzName: string;
  baseRating: number;
  baseReviewCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    authorName: "",
    event: eventOptions[0],
    rating: 5,
    comment: "",
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setReviews(getReviews(ustadzId));
  }, [ustadzId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.authorName.trim() || !form.comment.trim()) return;
    const review: Review = {
      id: `r_${Date.now()}`,
      ustadzId,
      authorName: form.authorName.trim(),
      rating: form.rating,
      comment: form.comment.trim(),
      event: form.event,
      date: new Date().toISOString().slice(0, 10),
    };
    addReview(review);
    setReviews((prev) => [review, ...prev]);
    setForm({
      authorName: "",
      event: eventOptions[0],
      rating: 5,
      comment: "",
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
    }, 2000);
  };

  return (
    <section className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-slate-800">
          Ulasan &amp; Rating
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100"
        >
          <MessageSquarePlus className="h-4 w-4" />
          {showForm ? "Tutup" : "Tulis Ulasan"}
        </button>
      </div>

      {/* summary */}
      <div className="mt-4 flex items-center gap-4 rounded-xl bg-sand-50 p-4">
        <div className="text-center">
          <div className="font-display text-3xl font-bold text-slate-800">
            {baseRating.toFixed(1)}
          </div>
          <StarRating rating={baseRating} size={14} />
        </div>
        <div className="h-10 w-px bg-sand-200" />
        <p className="text-sm text-slate-500">
          {baseReviewCount + reviews.length} ulasan dari jamaah &amp; panitia
          yang pernah mengundang {ustadzName}
        </p>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 animate-fade-in rounded-xl border border-primary-100 bg-primary-50/30 p-5"
        >
          <h3 className="font-semibold text-slate-800">Bagikan Pengalaman Anda</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">
                Nama / Instansi
              </label>
              <input
                value={form.authorName}
                onChange={(e) =>
                  setForm({ ...form, authorName: e.target.value })
                }
                placeholder="Mis. Taklim Al-Huda"
                required
                className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">
                Jenis Acara
              </label>
              <select
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
              >
                {eventOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-600">Rating</label>
            <div className="mt-1 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ ...form, rating: i })}
                  className="p-0.5"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      i <= form.rating
                        ? "fill-gold-400 text-gold-400"
                        : "fill-sand-200 text-sand-200 hover:fill-gold-200 hover:text-gold-200"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-slate-700">
                {form.rating}.0
              </span>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-slate-600">
              Ulasan
            </label>
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Ceritakan pengalaman Anda dengan ustadz..."
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Kirim Ulasan
          </button>

          {submitted && (
            <p className="mt-3 text-sm font-medium text-primary-600">
              ✓ Terima kasih! Ulasan Anda telah ditambahkan.
            </p>
          )}
        </form>
      )}

      {/* Review list */}
      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sand-200 py-8 text-center">
            <Quote className="mx-auto h-8 w-8 text-sand-300" />
            <p className="mt-2 text-sm text-slate-500">
              Belum ada ulasan. Jadilah yang pertama!
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-sand-200 p-4 animate-fade-in"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-800">
                    {r.authorName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.event} • {r.date}
                  </div>
                </div>
                <StarRating rating={r.rating} size={14} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                &ldquo;{r.comment}&rdquo;
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
