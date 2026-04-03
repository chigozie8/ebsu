import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
  getDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FirebaseCommunityMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  topic: string;
  community_id?: string;
  image_urls?: string[];
  sticker_url?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface FirebaseCommunityReply {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  reply: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface FirebaseCommunityReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToMessage(id: string, data: Record<string, unknown>): FirebaseCommunityMessage {
  return {
    id,
    user_id: (data.user_id as string) || '',
    user_name: (data.user_name as string) || 'Unknown',
    user_avatar: (data.user_avatar as string | undefined),
    message: (data.message as string) || '',
    topic: (data.topic as string) || 'General',
    community_id: (data.community_id as string | undefined),
    image_urls: (data.image_urls as string[] | undefined),
    sticker_url: (data.sticker_url as string | undefined),
    created_at: toIso(data.created_at),
    updated_at: toIso(data.updated_at),
    likes_count: (data.likes_count as number) || 0,
    reply_count: (data.reply_count as number) || 0,
    is_pinned: (data.is_pinned as boolean) || false,
    is_edited: (data.is_edited as boolean) || false,
    is_deleted: (data.is_deleted as boolean) || false,
  };
}

function docToReply(id: string, data: Record<string, unknown>): FirebaseCommunityReply {
  return {
    id,
    message_id: (data.message_id as string) || '',
    user_id: (data.user_id as string) || '',
    user_name: (data.user_name as string) || 'Unknown',
    user_avatar: (data.user_avatar as string | undefined),
    reply: (data.reply as string) || '',
    created_at: toIso(data.created_at),
    updated_at: toIso(data.updated_at),
    is_edited: (data.is_edited as boolean) || false,
    is_deleted: (data.is_deleted as boolean) || false,
  };
}

// ── Community Messages Hook ────────────────────────────────────────────────

export const useCommunityMessages = (topic?: string, msgLimit: number = 20) => {
  const [messages, setMessages] = useState<FirebaseCommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Query without where+orderBy combo to avoid composite index requirement
    // Filter and sort client-side instead
    const ref = collection(db, 'community_messages');
    const q = query(ref, orderBy('created_at', 'desc'), limit(msgLimit * 5));

    const unsub = onSnapshot(
      q,
      (snap) => {
        let msgs = snap.docs
          .map((d) => docToMessage(d.id, d.data() as Record<string, unknown>))
          .filter((m) => !m.is_deleted);
        if (topic && topic !== 'All') {
          msgs = msgs.filter((m) => m.topic === topic);
        }
        setMessages(msgs.slice(0, msgLimit));
        setLoading(false);
      },
      (err) => {
        console.error('[useCommunityMessages] Firebase error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [topic, msgLimit]);

  return { messages, loading, error };
};

// ── Community Replies Hook ─────────────────────────────────────────────────

export const useCommunityReplies = (messageId: string) => {
  const [replies, setReplies] = useState<FirebaseCommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messageId) { setLoading(false); return; }

    // Only filter by message_id server-side; sort+filter client-side to avoid composite index
    const ref = collection(db, 'community_replies');
    const q = query(ref, where('message_id', '==', messageId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const all = snap.docs
          .map((d) => docToReply(d.id, d.data() as Record<string, unknown>))
          .filter((r) => !r.is_deleted)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setReplies(all);
        setLoading(false);
      },
      (err) => {
        console.error('[useCommunityReplies] Firebase error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [messageId]);

  return { replies, loading, error };
};

// ── Post Message ───────────────────────────────────────────────────────────

export const usePostMessage = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postMessage = useCallback(async (
    userId: string,
    userName: string,
    message: string,
    topic: string,
    userAvatar?: string,
    imageUrls?: string[],
    subcategory?: string,
    communityId?: string,
  ) => {
    try {
      setPosting(true);
      setError(null);
      const payload: Record<string, unknown> = {
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        message,
        topic,
        community_id: communityId || null,
        likes_count: 0,
        reply_count: 0,
        is_pinned: false,
        is_edited: false,
        is_deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      if (imageUrls && imageUrls.length > 0) payload.image_urls = imageUrls;
      if (subcategory) payload.subcategory = subcategory;
      const docRef = await addDoc(collection(db, 'community_messages'), payload);
      return docRef;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post message';
      setError(msg);
      throw err;
    } finally {
      setPosting(false);
    }
  }, []);

  return { postMessage, posting, error };
};

// ── Post Reply ─────────────���───────────────────────────────────────────────

export const usePostReply = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postReply = useCallback(async (
    messageId: string,
    userId: string,
    userName: string,
    reply: string,
    userAvatar?: string,
  ) => {
    try {
      setPosting(true);
      setError(null);
      await addDoc(collection(db, 'community_replies'), {
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        reply,
        is_edited: false,
        is_deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Increment reply_count on the parent message
      const msgRef = doc(db, 'community_messages', messageId);
      const msgSnap = await getDoc(msgRef);
      if (msgSnap.exists()) {
        const current = (msgSnap.data().reply_count as number) || 0;
        await updateDoc(msgRef, { reply_count: current + 1 });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post reply';
      setError(msg);
      throw err;
    } finally {
      setPosting(false);
    }
  }, []);

  return { postReply, posting, error };
};

// ── Like Message ───────────────────────────────────────────────────────────

export const useLikeMessage = () => {
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeMessage = useCallback(async (messageId: string, userId: string) => {
    try {
      setLiking(true);
      setError(null);
      await addDoc(collection(db, 'community_likes'), {
        message_id: messageId,
        user_id: userId,
        created_at: serverTimestamp(),
      });
      const msgRef = doc(db, 'community_messages', messageId);
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        await updateDoc(msgRef, { likes_count: ((snap.data().likes_count as number) || 0) + 1 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like message');
    } finally {
      setLiking(false);
    }
  }, []);

  const unlikeMessage = useCallback(async (messageId: string, userId: string) => {
    try {
      setLiking(true);
      setError(null);
      const q = query(
        collection(db, 'community_likes'),
        where('message_id', '==', messageId),
        where('user_id', '==', userId)
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) await deleteDoc(d.ref);
      const msgRef = doc(db, 'community_messages', messageId);
      const msgSnap = await getDoc(msgRef);
      if (msgSnap.exists()) {
        const current = (msgSnap.data().likes_count as number) || 0;
        await updateDoc(msgRef, { likes_count: Math.max(0, current - 1) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlike message');
    } finally {
      setLiking(false);
    }
  }, []);

  return { likeMessage, unlikeMessage, liking, error };
};

// ── Delete Message ─────────────────────────────────────────────────────────

export const useDeleteMessage = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setDeleting(true);
      setError(null);
      const msgRef = doc(db, 'community_messages', messageId);
      const msgSnap = await getDoc(msgRef);

      await updateDoc(msgRef, {
        is_deleted: true,
        updated_at: serverTimestamp(),
      });

      // Decrement the community's post_count so the list stays accurate
      if (msgSnap.exists()) {
        const communityId = msgSnap.data().community_id as string | undefined;
        if (communityId) {
          await updateDoc(doc(db, 'communities', communityId), {
            post_count: increment(-1),
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteMessage, deleting, error };
};

// ── Edit Message ───────────────────────────────────────────────────────────

export const useEditMessage = () => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editMessage = useCallback(async (messageId: string, newMessage: string) => {
    try {
      setEditing(true);
      setError(null);
      await updateDoc(doc(db, 'community_messages', messageId), {
        message: newMessage,
        is_edited: true,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    } finally {
      setEditing(false);
    }
  }, []);

  return { editMessage, editing, error };
};

// ── Delete Reply ───────────────────────────────────────────────────────────

export const useDeleteReply = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteReply = useCallback(async (replyId: string) => {
    try {
      setDeleting(true);
      setError(null);
      await updateDoc(doc(db, 'community_replies', replyId), {
        is_deleted: true,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reply');
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteReply, deleting, error };
};

// ── Edit Reply ─────────────────────────────────────────────────────────────

export const useEditReply = () => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editReply = useCallback(async (replyId: string, newReply: string) => {
    try {
      setEditing(true);
      setError(null);
      await updateDoc(doc(db, 'community_replies', replyId), {
        reply: newReply,
        is_edited: true,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit reply');
    } finally {
      setEditing(false);
    }
  }, []);

  return { editReply, editing, error };
};

// ── Reactions ──────────────────────────────────────────────────────────────

export const useReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<FirebaseCommunityReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!messageId) { setLoading(false); return; }

    const q = query(
      collection(db, 'community_reactions'),
      where('message_id', '==', messageId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setReactions(
          snap.docs.map((d) => ({
            id: d.id,
            message_id: d.data().message_id as string,
            user_id: d.data().user_id as string,
            reaction_emoji: d.data().reaction_emoji as string,
            created_at: toIso(d.data().created_at),
          }))
        );
        setLoading(false);
      },
      (err) => {
        console.error('[useReactions] Firebase error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [messageId]);

  return { reactions, loading, error };
};

export const useAddReaction = () => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addReaction = useCallback(async (messageId: string, userId: string, emoji: string) => {
    try {
      setAdding(true);
      setError(null);
      const q = query(
        collection(db, 'community_reactions'),
        where('message_id', '==', messageId),
        where('user_id', '==', userId),
        where('reaction_emoji', '==', emoji)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        for (const d of existing.docs) await deleteDoc(d.ref);
      } else {
        await addDoc(collection(db, 'community_reactions'), {
          message_id: messageId,
          user_id: userId,
          reaction_emoji: emoji,
          created_at: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction');
      console.error('[useAddReaction] Firebase error:', err);
    } finally {
      setAdding(false);
    }
  }, []);

  return { addReaction, adding, error };
};

// ── Community Typing Indicator ─────────────────────────────────────────────
// Stores { users: { [userId]: { name, avatar, ts } } } in typing_indicators/{communityId}

export interface TypingUser {
  userId: string;
  name: string;
  avatar?: string;
}

export const useCommunityTyping = (communityId: string | undefined, myId: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!communityId) return;

    const typingDocRef = doc(db, 'typing_indicators', `community_${communityId}`);
    const unsub = onSnapshot(typingDocRef, (snap) => {
      if (!snap.exists()) { setTypingUsers([]); return; }
      const data = snap.data();
      const users = (data.users as Record<string, { name: string; avatar?: string; ts: number }>) || {};
      const now = Date.now();
      const active = Object.entries(users)
        .filter(([uid, info]) => uid !== myId && now - info.ts < 5000)
        .map(([uid, info]) => ({ userId: uid, name: info.name, avatar: info.avatar }));
      setTypingUsers(active);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [communityId, myId]);

  const broadcastTyping = useCallback(async (name: string, avatar?: string) => {
    if (!communityId) return;
    try {
      const { setDoc } = await import('firebase/firestore');
      const typingDocRef = doc(db, 'typing_indicators', `community_${communityId}`);
      await setDoc(
        typingDocRef,
        { users: { [myId]: { name, avatar: avatar || null, ts: Date.now() } } },
        { merge: true }
      );
    } catch {
      // Non-critical
    }
  }, [communityId, myId]);

  return { typingUsers, broadcastTyping };
};

// ── Pin Message ────────────────────────────────────────────────────────────

export const usePinMessage = () => {
  const [pinning, setPinning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePin = useCallback(async (messageId: string, currentPinStatus: boolean) => {
    try {
      setPinning(true);
      setError(null);
      await updateDoc(doc(db, 'community_messages', messageId), {
        is_pinned: !currentPinStatus,
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin message');
      console.error('[usePinMessage] Firebase error:', err);
    } finally {
      setPinning(false);
    }
  }, []);

  return { togglePin, pinning, error };
};
