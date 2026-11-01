import { Review, Booking, Conversation, ChatMessage } from "./types";
import { initialReviews, ustadzReplies, salamReply } from "./data";

const isClient = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isClient) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isClient) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const REVIEW_KEY = "cu_reviews";
const BOOKING_KEY = "cu_bookings";
const CHAT_KEY = "cu_chats";

export function getReviews(ustadzId: string): Review[] {
  const all = read<Review[]>(REVIEW_KEY, initialReviews);
  return all.filter((r) => r.ustadzId === ustadzId);
}

export function getReviewsByUstadzMap(): Record<string, Review[]> {
  const all = read<Review[]>(REVIEW_KEY, initialReviews);
  const map: Record<string, Review[]> = {};
  for (const r of all) {
    (map[r.ustadzId] ||= []).push(r);
  }
  return map;
}

export function addReview(review: Review) {
  const all = read<Review[]>(REVIEW_KEY, initialReviews);
  all.unshift(review);
  write(REVIEW_KEY, all);
}

export function getBookings(): Booking[] {
  return read<Booking[]>(BOOKING_KEY, []);
}

export function addBooking(booking: Booking) {
  const all = read<Booking[]>(BOOKING_KEY, []);
  all.unshift(booking);
  write(BOOKING_KEY, all);
}

export function getConversations(): Conversation[] {
  return read<Conversation[]>(CHAT_KEY, []);
}

export function getConversation(ustadzId: string): Conversation {
  const all = getConversations();
  return (
    all.find((c) => c.ustadzId === ustadzId) ?? {
      ustadzId,
      messages: [
        {
          id: "m0",
          sender: "ustadz",
          text: "Assalamu'alaikum, saya siap membantu. Ada yang bisa saya bantu?",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    }
  );
}

export function sendMessage(
  ustadzId: string,
  text: string
): ChatMessage[] {
  const all = getConversations();
  let convo = all.find((c) => c.ustadzId === ustadzId);
  if (!convo) {
    convo = {
      ustadzId,
      messages: [
        {
          id: "m0",
          sender: "ustadz",
          text: "Assalamu'alaikum, saya siap membantu. Ada yang bisa saya bantu?",
          time: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ],
    };
    all.push(convo);
  }

  const now = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  convo.messages.push({
    id: `m${convo.messages.length}_${Date.now()}`,
    sender: "user",
    text,
    time: now,
  });

  // mock auto-reply — salam hanya dibalas salam, tidak pernah diulang sendiri
  const isSalamGreeting = /assalam|asalam|salamualaikum|alaikum/i.test(text);
  const reply = isSalamGreeting
    ? salamReply
    : ustadzReplies[convo.messages.length % ustadzReplies.length];
  convo.messages.push({
    id: `m${convo.messages.length}_${Date.now() + 1}`,
    sender: "ustadz",
    text: reply,
    time: new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  });

  // persist
  write(CHAT_KEY, all);
  return convo.messages;
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}
