import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Utility Functions ──────────────────────────────────────────────────────

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface UserVerification {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  bio?: string;
  online_status: 'online' | 'offline' | 'away';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface PrivateChat {
  id: string;
  participant_1: string;
  participant_2: string;
  participant_1_name: string;
  participant_2_name: string;
  participant_1_avatar?: string;
  participant_2_avatar?: string;
  last_message?: string;
  last_message_at: string;
  created_at: string;
}

export interface PrivateMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  image_url?: string;
  is_seen: boolean;
  is_delivered: boolean;
  created_at: string;
}

// ─────────────────────────────────────────────────────────
// USER VERIFICATION
// ─────────────────────────────────────────────────────────

export const useUserVerification = (userId: string) => {
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const q = query(
      collection(db, 'user_verification'),
      where('user_id', '==', userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        setVerification({
          id: d.id,
          user_id: data.user_id as string,
          user_name: (data.user_name as string) || '',
          user_avatar: data.user_avatar as string | undefined,
          is_verified: (data.is_verified as boolean) || false,
          verified_at: data.verified_at as string | undefined,
          verified_by: data.verified_by as string | undefined,
          bio: data.bio as string | undefined,
          online_status: (data.online_status as 'online' | 'offline' | 'away') || 'offline',
          last_seen: toIso(data.last_seen),
          created_at: toIso(data.created_at),
          updated_at: toIso(data.updated_at),
        });
      } else {
        setVerification(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const upsertVerification = useCallback(async (
    uid: string,
    name: string,
    avatar?: string,
    bio?: string,
  ) => {
    const q = query(collection(db, 'user_verification'), where('user_id', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        user_name: name,
        user_avatar: avatar || null,
        bio: bio || '',
        updated_at: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'user_verification'), {
        user_id: uid,
        user_name: name,
        user_avatar: avatar || null,
        bio: bio || '',
        is_verified: false,
        online_status: 'online',
        last_seen: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
  }, []);

  const toggleVerified = useCallback(async (uid: string, current: boolean) => {
    const q = query(collection(db, 'user_verification'), where('user_id', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        is_verified: !current,
        verified_at: !current ? new Date().toISOString() : null,
        updated_at: serverTimestamp(),
      });
    }
  }, []);

  const setOnlineStatus = useCallback(async (uid: string, status: 'online' | 'offline') => {
    const q = query(collection(db, 'user_verification'), where('user_id', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, {
        online_status: status,
        last_seen: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
  }, []);

  return { verification, loading, upsertVerification, toggleVerified, setOnlineStatus };
};

export const useAnyUserVerification = (userId: string | null) => {
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(
      collection(db, 'user_verification'),
      where('user_id', '==', userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        setVerification({
          id: d.id,
          user_id: data.user_id as string,
          user_name: (data.user_name as string) || '',
          user_avatar: data.user_avatar as string | undefined,
          is_verified: (data.is_verified as boolean) || false,
          verified_at: data.verified_at as string | undefined,
          verified_by: data.verified_by as string | undefined,
          bio: data.bio as string | undefined,
          online_status: (data.online_status as 'online' | 'offline' | 'away') || 'offline',
          last_seen: toIso(data.last_seen),
          created_at: toIso(data.created_at),
          updated_at: toIso(data.updated_at),
        });
      } else {
        setVerification(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { verification, loading };
};

// ─────────────────────────────────────────────────────────
// PRIVATE CHATS LIST
// ─────────────────────────────────────────────────────────

export const useMyChats = (userId: string) => {
  const [chats, setChats] = useState<PrivateChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    // Query chats where user is participant_1 or participant_2.
    // No orderBy to avoid requiring a composite Firestore index — sort client-side.
    const q1 = query(
      collection(db, 'private_chats'),
      where('participant_1', '==', userId)
    );
    const q2 = query(
      collection(db, 'private_chats'),
      where('participant_2', '==', userId)
    );

    const allChats: Map<string, PrivateChat> = new Map();
    // Track which of the two listeners have fired at least once
    const fired = { q1: false, q2: false };

    const mapDoc = (d: { id: string; data: () => Record<string, unknown> }): PrivateChat => ({
      id: d.id,
      participant_1: d.data().participant_1 as string,
      participant_2: d.data().participant_2 as string,
      participant_1_name: (d.data().participant_1_name as string) || '',
      participant_2_name: (d.data().participant_2_name as string) || '',
      participant_1_avatar: d.data().participant_1_avatar as string | undefined,
      participant_2_avatar: d.data().participant_2_avatar as string | undefined,
      last_message: d.data().last_message as string | undefined,
      last_message_at: toIso(d.data().last_message_at),
      created_at: toIso(d.data().created_at),
    });

    const sortAndSet = () => {
      // Only stop loading once both listeners have responded at least once
      const sorted = Array.from(allChats.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      setChats(sorted);
      if (fired.q1 && fired.q2) setLoading(false);
    };

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        fired.q1 = true;
        snap.docs.forEach((d) => allChats.set(d.id, mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> })));
        sortAndSet();
      },
      (err) => {
        console.error('[useMyChats] q1 error:', err.code, err.message);
        fired.q1 = true;
        if (fired.q1 && fired.q2) setLoading(false);
      }
    );

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        fired.q2 = true;
        snap.docs.forEach((d) => allChats.set(d.id, mapDoc({ id: d.id, data: () => d.data() as Record<string, unknown> })));
        sortAndSet();
      },
      (err) => {
        console.error('[useMyChats] q2 error:', err.code, err.message);
        fired.q2 = true;
        if (fired.q1 && fired.q2) setLoading(false);
      }
    );

    return () => { unsub1(); unsub2(); };
  }, [userId]);

  return { chats, loading };
};

// ─────────────────────────────────────────────────────────
// GET OR CREATE CHAT
// ─────────────────────────────────────────────────────────

export const useGetOrCreateChat = () => {
  const [loading, setLoading] = useState(false);

  const getOrCreate = useCallback(async (
    myId: string,
    myName: string,
    myAvatar: string | undefined,
    otherId: string,
    otherName: string,
    otherAvatar: string | undefined,
  ): Promise<string> => {
    setLoading(true);
    try {
      // Check both orderings
      const q1 = query(
        collection(db, 'private_chats'),
        where('participant_1', '==', myId),
        where('participant_2', '==', otherId)
      );
      const q2 = query(
        collection(db, 'private_chats'),
        where('participant_1', '==', otherId),
        where('participant_2', '==', myId)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      if (!snap1.empty) return snap1.docs[0].id;
      if (!snap2.empty) return snap2.docs[0].id;

      const docRef = await addDoc(collection(db, 'private_chats'), {
        participant_1: myId,
        participant_2: otherId,
        participant_1_name: myName,
        participant_2_name: otherName,
        participant_1_avatar: myAvatar || null,
        participant_2_avatar: otherAvatar || null,
        last_message: null,
        last_message_at: serverTimestamp(),
        created_at: serverTimestamp(),
      });
      return docRef.id;
    } finally {
      setLoading(false);
    }
  }, []);

  return { getOrCreate, loading };
};

// ─────────────────────────────────────────────────────────
// PRIVATE MESSAGES IN A CHAT
// ─────────────────────────────────────────────────────────

export const usePrivateMessages = (chatId: string | null) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state whenever chatId changes (including to null)
    setMessages([]);
    setError(null);

    if (!chatId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Query only on chat_id to avoid composite index requirement.
    // Sort client-side by created_at ascending so newest is at bottom.
    const q = query(
      collection(db, 'private_messages'),
      where('chat_id', '==', chatId)
    );

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        const mapped: PrivateMessage[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            chat_id: data.chat_id as string,
            sender_id: data.sender_id as string,
            sender_name: (data.sender_name as string) || '',
            sender_avatar: data.sender_avatar as string | undefined,
            content: (data.content as string) || '',
            image_url: data.image_url as string | undefined,
            is_seen: (data.is_seen as boolean) || false,
            is_delivered: (data.is_delivered as boolean) || false,
            created_at: toIso(data.created_at),
          };
        });
        mapped.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        setMessages(mapped);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[usePrivateMessages] snapshot error:', err.code, err.message);
        setError(err.message || 'Failed to load messages');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [chatId]);

  return { messages, loading, error };
};

// ─────────────────────────────────────────────────────────
// SEND A MESSAGE
// ─────────────────────────────────────────────────────────

export const useSendPrivateMessage = () => {
  const [sending, setSending] = useState(false);

  const send = useCallback(async (
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    senderAvatar?: string,
    imageUrl?: string,
  ) => {
    setSending(true);
    try {
      await addDoc(collection(db, 'private_messages'), {
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar || null,
        content,
        image_url: imageUrl || null,
        is_seen: false,
        is_delivered: true,
        created_at: serverTimestamp(),
      });

      // Update last_message on the chat document
      await updateDoc(doc(db, 'private_chats', chatId), {
        last_message: content,
        last_message_at: serverTimestamp(),
      });
    } finally {
      setSending(false);
    }
  }, []);

  return { send, sending };
};

// ─────────────────────────────────────────────────────────
// MARK MESSAGES AS SEEN
// ──────────────────────────────────────────���──────────────

export const useMarkSeen = () => {
  const markSeen = useCallback(async (chatId: string, viewerId: string) => {
    if (!chatId || !viewerId) return;
    try {
      // Only filter on chat_id + is_seen to avoid needing a composite index.
      // Then filter out messages sent by the viewer client-side.
      const q = query(
        collection(db, 'private_messages'),
        where('chat_id', '==', chatId),
        where('is_seen', '==', false)
      );
      const snap = await getDocs(q);
      const updates = snap.docs.filter((d) => d.data().sender_id !== viewerId);
      await Promise.all(
        updates.map((d) => updateDoc(d.ref, { is_seen: true, is_delivered: true }))
      );
    } catch (err) {
      // markSeen failures are non-critical — log and continue
      console.error('[useMarkSeen] error:', err);
    }
  }, []);

  return { markSeen };
};

// ───────────────────────────────���─────────────────────────
// TYPING INDICATOR (ephemeral via Firestore doc)
// ─────────────────────────────────────────────────────────

export const useTypingIndicator = (chatId: string | null, myId: string) => {
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const typingDocRef = doc(db, 'typing_indicators', chatId);
    const unsub = onSnapshot(typingDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const typingUsers = (data.users as Record<string, number>) || {};
      const now = Date.now();
      const otherTyping = Object.entries(typingUsers).some(
        ([uid, ts]) => uid !== myId && now - ts < 4000
      );
      setOtherIsTyping(otherTyping);
      if (otherTyping) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setOtherIsTyping(false), 4000);
      }
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [chatId, myId]);

  const broadcastTyping = useCallback(async () => {
    if (!chatId) return;
    try {
      const typingDocRef = doc(db, 'typing_indicators', chatId);
      const snap = await getDoc(typingDocRef);
      if (snap.exists()) {
        await updateDoc(typingDocRef, { [`users.${myId}`]: Date.now() });
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(typingDocRef, { users: { [myId]: Date.now() } });
      }
    } catch {
      // Typing indicator failures are non-critical
    }
  }, [chatId, myId]);

  return { otherIsTyping, broadcastTyping };
};

// ─────────────────────────────────────────────────────────
// ALL USER PROFILES (for admin / directory)
// ─────────────────────────────────────────────────────────

export const useAllUserProfiles = () => {
  const [profiles, setProfiles] = useState<UserVerification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // No orderBy to avoid requiring a composite Firestore index — sort client-side
      const snap = await getDocs(collection(db, 'user_verification'));
      const profiles: UserVerification[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: data.user_id as string,
          user_name: (data.user_name as string) || '',
          user_avatar: data.user_avatar as string | undefined,
          is_verified: (data.is_verified as boolean) || false,
          verified_at: data.verified_at as string | undefined,
          verified_by: data.verified_by as string | undefined,
          bio: data.bio as string | undefined,
          online_status: (data.online_status as 'online' | 'offline' | 'away') || 'offline',
          last_seen: toIso(data.last_seen),
          created_at: toIso(data.created_at),
          updated_at: toIso(data.updated_at),
        };
      });
      // Sort client-side to avoid Firestore index requirement
      profiles.sort((a, b) => a.user_name.localeCompare(b.user_name));
      setProfiles(profiles);
    } catch (err) {
      console.error('[useAllUserProfiles] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { profiles, loading, refetch };
};

export const useToggleVerification = () => {
  const toggle = useCallback(async (userId: string, current: boolean) => {
    try {
      const q = query(collection(db, 'user_verification'), where('user_id', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          is_verified: !current,
          updated_at: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      console.error('[useToggleVerification] Firebase error:', err);
      return false;
    }
  }, []);
  return { toggle };
};

// ─────────────────────────────────────────────────────────
// VERIFY USER BY EMAIL (admin only)
// Looks up userInfo by email, then upserts/updates user_verification
// ─────────────────────────────────────────────────────────
export interface VerifyByEmailResult {
  userId: string;
  userName: string;
  userAvatar?: string;
  email: string;
  is_verified: boolean;
}

export const useVerifyByEmail = () => {
  const [searching, setSearching] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const findByEmail = useCallback(async (email: string): Promise<VerifyByEmailResult | null> => {
    setSearching(true);
    try {
      // Look up in userInfo collection
      const q = query(collection(db, 'userInfo'), where('email', '==', email.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) return null;

      const d = snap.docs[0];
      const data = d.data() as Record<string, unknown>;
      const userId = data.userID as string;
      const firstName = (data.firstName as string) || '';
      const lastName = (data.lastName as string) || '';
      const userName = `${firstName} ${lastName}`.trim() || email;
      const userAvatar = (data.profileImageURL as string) || undefined;

      // Check current verification status
      const vq = query(collection(db, 'user_verification'), where('user_id', '==', userId));
      const vSnap = await getDocs(vq);
      const is_verified = vSnap.empty ? false : ((vSnap.docs[0].data().is_verified as boolean) || false);

      return { userId, userName, userAvatar, email, is_verified };
    } catch (err) {
      console.error('[useVerifyByEmail] search error:', err);
      return null;
    } finally {
      setSearching(false);
    }
  }, []);

  const verifyUser = useCallback(async (result: VerifyByEmailResult, adminId: string): Promise<boolean> => {
    setVerifying(true);
    try {
      const vq = query(collection(db, 'user_verification'), where('user_id', '==', result.userId));
      const vSnap = await getDocs(vq);

      if (!vSnap.empty) {
        await updateDoc(vSnap.docs[0].ref, {
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          updated_at: serverTimestamp(),
        });
      } else {
        // Create a new verification record if one doesn't exist
        await addDoc(collection(db, 'user_verification'), {
          user_id: result.userId,
          user_name: result.userName,
          user_avatar: result.userAvatar || null,
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          bio: '',
          online_status: 'offline',
          last_seen: serverTimestamp(),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      console.error('[useVerifyByEmail] verify error:', err);
      return false;
    } finally {
      setVerifying(false);
    }
  }, []);

  const revokeVerification = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const vq = query(collection(db, 'user_verification'), where('user_id', '==', userId));
      const vSnap = await getDocs(vq);
      if (!vSnap.empty) {
        await updateDoc(vSnap.docs[0].ref, {
          is_verified: false,
          verified_at: null,
          verified_by: null,
          updated_at: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      console.error('[useVerifyByEmail] revoke error:', err);
      return false;
    }
  }, []);

  return { findByEmail, verifyUser, revokeVerification, searching, verifying };
};

// ─────────────────────────────────────────────────────────
// CHAT PARTICIPANTS
// ─────────────────────────────────────────────────────────

export interface ChatParticipant {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  online_status: 'online' | 'offline' | 'away';
  last_seen: string;
  is_verified?: boolean;
}

export const useChatParticipants = (chatId: string) => {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) { 
      setLoading(false); 
      return; 
    }

    try {
      const chatRef = doc(db, 'private_chats', chatId);
      
      const unsub = onSnapshot(
        chatRef,
        async (snap) => {
          if (!snap.exists()) { 
            setParticipants([]); 
            setLoading(false); 
            return; 
          }
          
          const chatData = snap.data();
          const participant1Id = chatData.participant_1 as string;
          const participant2Id = chatData.participant_2 as string;
          const participant1Name = chatData.participant_1_name as string;
          const participant2Name = chatData.participant_2_name as string;
          const participant1Avatar = chatData.participant_1_avatar as string | undefined;
          const participant2Avatar = chatData.participant_2_avatar as string | undefined;

          try {
            const q1 = query(collection(db, 'user_verification'), where('user_id', '==', participant1Id));
            const q2 = query(collection(db, 'user_verification'), where('user_id', '==', participant2Id));
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

            const p1Data = snap1.empty ? null : snap1.docs[0].data();
            const p2Data = snap2.empty ? null : snap2.docs[0].data();

            setParticipants([
              {
                id: `${chatId}_p1`,
                user_id: participant1Id,
                user_name: participant1Name,
                user_avatar: participant1Avatar,
                online_status: (p1Data?.online_status as 'online' | 'offline' | 'away') || 'offline',
                last_seen: toIso(p1Data?.last_seen),
                is_verified: (p1Data?.is_verified as boolean) || false,
              },
              {
                id: `${chatId}_p2`,
                user_id: participant2Id,
                user_name: participant2Name,
                user_avatar: participant2Avatar,
                online_status: (p2Data?.online_status as 'online' | 'offline' | 'away') || 'offline',
                last_seen: toIso(p2Data?.last_seen),
                is_verified: (p2Data?.is_verified as boolean) || false,
              },
            ]);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load participants');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set up participants');
      setLoading(false);
    }
  }, [chatId]);

  return { participants, loading, error };
};
