import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
  where,
  getDocs,
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Community = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  topic: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  reply_count: number;
  is_pinned: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  image_url?: string;
  sticker_url?: string;
  media_type?: 'text' | 'image' | 'sticker';
  forwarded_from?: string;
  forwarded_from_user?: string;
  sub_community_id?: string;
};

export type CommunityReply = {
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
  image_url?: string;
  sticker_url?: string;
  media_type?: 'text' | 'image' | 'sticker';
};

export type SubCommunity = {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color: string;
  parent_topic: string;
  created_by: string;
  member_count: number;
  created_at: string;
  is_active: boolean;
};

export type CommunitySticker = {
  id: string;
  pack_name: string;
  name: string;
  url: string;
  emoji_tags?: string[];
};

// ─── Firestore collection names ───────────────────────────────────────────────
const MSGS      = 'community_messages';
const REPLIES   = 'community_replies';
const LIKES     = 'community_likes';
const SAVED     = 'community_saved_messages';
const SUB_COLS  = 'community_sub_communities';
const SUB_MEMS  = 'community_sub_members';
const STICKERS  = 'community_stickers';
const REACTIONS = 'community_reactions';

// ─── Converters ───────────────────────────────────────────────────────────────
const tsToStr = (ts: unknown): string => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    return (ts as { toDate: () => Date }).toDate().toISOString();
  }
  return String(ts);
};

const docToMessage = (id: string, d: Record<string, unknown>): Community => ({
  id,
  user_id: (d.user_id as string) || '',
  user_name: (d.user_name as string) || 'Unknown',
  user_avatar: (d.user_avatar as string) || undefined,
  message: (d.message as string) || '',
  topic: (d.topic as string) || 'General',
  created_at: tsToStr(d.created_at),
  updated_at: tsToStr(d.updated_at),
  likes_count: (d.likes_count as number) || 0,
  reply_count: (d.reply_count as number) || 0,
  is_pinned: (d.is_pinned as boolean) || false,
  is_edited: (d.is_edited as boolean) || false,
  is_deleted: (d.is_deleted as boolean) || false,
  image_url: (d.image_url as string) || undefined,
  sticker_url: (d.sticker_url as string) || undefined,
  media_type: (d.media_type as Community['media_type']) || 'text',
  forwarded_from: (d.forwarded_from as string) || undefined,
  forwarded_from_user: (d.forwarded_from_user as string) || undefined,
  sub_community_id: (d.sub_community_id as string) || undefined,
});

const docToReply = (id: string, d: Record<string, unknown>): CommunityReply => ({
  id,
  message_id: (d.message_id as string) || '',
  user_id: (d.user_id as string) || '',
  user_name: (d.user_name as string) || 'Unknown',
  user_avatar: (d.user_avatar as string) || undefined,
  reply: (d.reply as string) || '',
  created_at: tsToStr(d.created_at),
  updated_at: tsToStr(d.updated_at ?? d.created_at),
  is_edited: (d.is_edited as boolean) || false,
  is_deleted: (d.is_deleted as boolean) || false,
  image_url: (d.image_url as string) || undefined,
  sticker_url: (d.sticker_url as string) || undefined,
  media_type: (d.media_type as CommunityReply['media_type']) || 'text',
});

const docToSubCommunity = (id: string, d: Record<string, unknown>): SubCommunity => ({
  id,
  name: (d.name as string) || '',
  description: (d.description as string) || undefined,
  icon_url: (d.icon_url as string) || undefined,
  color: (d.color as string) || '#14b8a6',
  parent_topic: (d.parent_topic as string) || 'General',
  created_by: (d.created_by as string) || '',
  member_count: (d.member_count as number) || 0,
  created_at: tsToStr(d.created_at),
  is_active: (d.is_active as boolean) ?? true,
});

// ─── Messages ─────────────────────────────────────────────────────────────────

export const useCommunityMessages = (topic?: string, limitCount = 40, subCommunityId?: string) => {
  const [messages, setMessages] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(
      collection(db, MSGS),
      orderBy('created_at', 'desc'),
      firestoreLimit(limitCount)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        let all = snap.docs
          .map((d) => docToMessage(d.id, d.data() as Record<string, unknown>))
          .filter((m) => !m.is_deleted);

        if (topic && topic !== 'All') {
          all = all.filter((m) => m.topic === topic);
        }
        if (subCommunityId) {
          all = all.filter((m) => m.sub_community_id === subCommunityId);
        }

        all.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setMessages(all);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [topic, limitCount, subCommunityId]);

  return { messages, loading };
};

// ─── Replies ──────────────────────────────────────────────────────────────────

export const useCommunityReplies = (messageId: string) => {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messageId) return;
    const q = query(
      collection(db, REPLIES),
      where('message_id', '==', messageId),
      orderBy('created_at', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReplies(
          snap.docs
            .map((d) => docToReply(d.id, d.data() as Record<string, unknown>))
            .filter((r) => !r.is_deleted)
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [messageId]);

  return { replies, loading };
};

// ─── Post message ─────────────────────────────────────────────────────────────

export const usePostMessage = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postMessage = useCallback(async (
    userId: string,
    userName: string,
    message: string,
    topic: string,
    userAvatar?: string,
    imageUrl?: string,
    stickerUrl?: string,
    subCommunityId?: string,
  ) => {
    setPosting(true);
    setError(null);
    try {
      const mediaType = stickerUrl ? 'sticker' : imageUrl ? 'image' : 'text';
      await addDoc(collection(db, MSGS), {
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        message: message || '',
        topic: topic === 'All' ? 'General' : topic,
        likes_count: 0,
        reply_count: 0,
        is_pinned: false,
        is_edited: false,
        is_deleted: false,
        image_url: imageUrl || null,
        sticker_url: stickerUrl || null,
        media_type: mediaType,
        forwarded_from: null,
        forwarded_from_user: null,
        sub_community_id: subCommunityId || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to post';
      setError(msg);
      throw err;
    } finally {
      setPosting(false);
    }
  }, []);

  return { postMessage, posting, error };
};

// ─── Post reply ───────────────────────────────────────────────────────────────

export const usePostReply = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postReply = useCallback(async (
    messageId: string,
    userId: string,
    userName: string,
    reply: string,
    userAvatar?: string,
    imageUrl?: string,
    stickerUrl?: string,
  ) => {
    setPosting(true);
    setError(null);
    try {
      const mediaType = stickerUrl ? 'sticker' : imageUrl ? 'image' : 'text';
      await addDoc(collection(db, REPLIES), {
        message_id: messageId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        reply: reply || '',
        image_url: imageUrl || null,
        sticker_url: stickerUrl || null,
        media_type: mediaType,
        is_edited: false,
        is_deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      await updateDoc(doc(db, MSGS, messageId), { reply_count: increment(1) });
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

// ─── Like / Unlike ────────────────────────────────────────────────────────────

export const useLikeMessage = () => {
  const [liking, setLiking] = useState(false);

  const toggleLike = useCallback(async (messageId: string, userId: string, isLiked: boolean) => {
    setLiking(true);
    try {
      const likeId = `${messageId}_${userId}`;
      const likeRef = doc(db, LIKES, likeId);
      const msgRef  = doc(db, MSGS, messageId);

      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(msgRef, { likes_count: increment(-1) });
      } else {
        const batch = writeBatch(db);
        batch.set(likeRef, { message_id: messageId, user_id: userId, created_at: serverTimestamp() });
        batch.update(msgRef, { likes_count: increment(1) });
        await batch.commit();
      }
    } finally {
      setLiking(false);
    }
  }, []);

  const getUserLikes = useCallback(async (userId: string): Promise<string[]> => {
    const snap = await getDocs(query(collection(db, LIKES), where('user_id', '==', userId)));
    return snap.docs.map((d) => (d.data() as { message_id: string }).message_id);
  }, []);

  return { toggleLike, getUserLikes, liking };
};

// ─── Save / Unsave ────────────────────────────────────────────────────────────

export const useSaveMessage = () => {
  const [saving, setSaving] = useState(false);

  const toggleSave = useCallback(async (messageId: string, userId: string, isSaved: boolean) => {
    setSaving(true);
    try {
      const saveId  = `${userId}_${messageId}`;
      const saveRef = doc(db, SAVED, saveId);
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await writeBatch(db).set(saveRef, {
          user_id: userId,
          message_id: messageId,
          saved_at: serverTimestamp(),
        }), await writeBatch(db).commit();
        // simpler:
        const batch = writeBatch(db);
        batch.set(saveRef, { user_id: userId, message_id: messageId, saved_at: serverTimestamp() });
        await batch.commit();
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const getUserSaved = useCallback(async (userId: string): Promise<string[]> => {
    const snap = await getDocs(query(collection(db, SAVED), where('user_id', '==', userId)));
    return snap.docs.map((d) => (d.data() as { message_id: string }).message_id);
  }, []);

  return { toggleSave, getUserSaved, saving };
};

// ─── Forward ──────────────────────────────────────────────────────────────────

export const useForwardMessage = () => {
  const [forwarding, setForwarding] = useState(false);

  const forwardMessage = useCallback(async (
    originalMessage: Community,
    toTopic: string,
    userId: string,
    userName: string,
    userAvatar?: string,
  ) => {
    setForwarding(true);
    try {
      await addDoc(collection(db, MSGS), {
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || null,
        message: originalMessage.message,
        topic: toTopic === 'All' ? 'General' : toTopic,
        likes_count: 0,
        reply_count: 0,
        is_pinned: false,
        is_edited: false,
        is_deleted: false,
        image_url: originalMessage.image_url || null,
        sticker_url: originalMessage.sticker_url || null,
        media_type: originalMessage.media_type || 'text',
        forwarded_from: originalMessage.id,
        forwarded_from_user: originalMessage.user_name,
        sub_community_id: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    } finally {
      setForwarding(false);
    }
  }, []);

  return { forwardMessage, forwarding };
};

// ─── Delete ───────────────────────────────────────────────────────────────────

export const useDeleteMessage = () => {
  const [deleting, setDeleting] = useState(false);

  const deleteMessage = useCallback(async (messageId: string) => {
    setDeleting(true);
    try {
      await updateDoc(doc(db, MSGS, messageId), { is_deleted: true });
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteMessage, deleting };
};

export const useDeleteReply = () => {
  const [deleting, setDeleting] = useState(false);

  const deleteReply = useCallback(async (replyId: string, messageId: string) => {
    setDeleting(true);
    try {
      await updateDoc(doc(db, REPLIES, replyId), { is_deleted: true });
      await updateDoc(doc(db, MSGS, messageId), { reply_count: increment(-1) });
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteReply, deleting };
};

// ─── Edit ─────────────────────────────────────────────────────────────────────

export const useEditMessage = () => {
  const [editing, setEditing] = useState(false);

  const editMessage = useCallback(async (messageId: string, newMessage: string) => {
    setEditing(true);
    try {
      await updateDoc(doc(db, MSGS, messageId), {
        message: newMessage,
        is_edited: true,
        updated_at: serverTimestamp(),
      });
    } finally {
      setEditing(false);
    }
  }, []);

  return { editMessage, editing };
};

export const useEditReply = () => {
  const [editing, setEditing] = useState(false);

  const editReply = useCallback(async (replyId: string, newReply: string) => {
    setEditing(true);
    try {
      await updateDoc(doc(db, REPLIES, replyId), {
        reply: newReply,
        is_edited: true,
        updated_at: serverTimestamp(),
      });
    } finally {
      setEditing(false);
    }
  }, []);

  return { editReply, editing };
};

// ─── Pin ──────────────────────────────────────────────────────────────────────

export const usePinMessage = () => {
  const [pinning, setPinning] = useState(false);

  const togglePin = useCallback(async (messageId: string, currentPinStatus: boolean) => {
    setPinning(true);
    try {
      await updateDoc(doc(db, MSGS, messageId), { is_pinned: !currentPinStatus });
    } finally {
      setPinning(false);
    }
  }, []);

  return { togglePin, pinning };
};

// ─── Reactions ────────────────────────────────────────────────────────────────

export type CommunityReaction = {
  id: string;
  message_id: string;
  user_id: string;
  reaction_emoji: string;
  created_at: string;
};

export const useReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<CommunityReaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messageId) return;
    const q = query(collection(db, REACTIONS), where('message_id', '==', messageId));
    const unsub = onSnapshot(q, (snap) => {
      setReactions(snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CommunityReaction, 'id'>),
      })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [messageId]);

  return { reactions, loading };
};

export const useAddReaction = () => {
  const addReaction = useCallback(async (messageId: string, userId: string, emoji: string) => {
    const reactionId = `${messageId}_${userId}_${emoji}`;
    const reactionRef = doc(db, REACTIONS, reactionId);
    const snap = await getDoc(reactionRef);
    if (snap.exists()) {
      await deleteDoc(reactionRef);
    } else {
      await writeBatch(db)
        .set(reactionRef, { message_id: messageId, user_id: userId, reaction_emoji: emoji, created_at: serverTimestamp() })
        .commit();
    }
  }, []);

  return { addReaction };
};

// ─── Image Upload ─────────────────────────────────────────────────────────────

export const useUploadCommunityImage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      setUploading(true);
      setProgress(0);
      const path = `community-media/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      const task = uploadBytesResumable(ref, file);

      task.on(
        'state_changed',
        (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (err) => { setUploading(false); reject(err); },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setUploading(false);
          resolve(url);
        }
      );
    });
  }, []);

  return { uploadImage, uploading, progress };
};

// ─── Stickers ─────────────────────────────────────────────────────────────────

const BUILTIN_STICKERS: CommunitySticker[] = [
  { id: 's1',  pack_name: 'Reactions', name: 'Thumbs Up',  url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/emoji.svg', emoji_tags: ['like','good'] },
  { id: 's2',  pack_name: 'Reactions', name: 'Heart',      url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/emoji.svg', emoji_tags: ['love','heart'] },
  { id: 's3',  pack_name: 'Reactions', name: 'Fire',       url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/emoji.svg', emoji_tags: ['fire','hot'] },
  { id: 's4',  pack_name: 'Reactions', name: 'Clap',       url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/emoji.svg', emoji_tags: ['clap','bravo'] },
  { id: 's5',  pack_name: 'Reactions', name: 'Laugh',      url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/emoji.svg', emoji_tags: ['funny','haha'] },
  { id: 's6',  pack_name: 'Reactions', name: 'Wow',        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62e/emoji.svg', emoji_tags: ['wow','amazed'] },
  { id: 's7',  pack_name: 'Reactions', name: 'Sad',        url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f622/emoji.svg', emoji_tags: ['sad','cry'] },
  { id: 's8',  pack_name: 'Reactions', name: 'Angry',      url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f621/emoji.svg', emoji_tags: ['angry','mad'] },
  { id: 's9',  pack_name: 'Study',     name: 'Books',      url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/emoji.svg', emoji_tags: ['books','study'] },
  { id: 's10', pack_name: 'Study',     name: 'Graduation', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f393/emoji.svg', emoji_tags: ['graduation','school'] },
  { id: 's11', pack_name: 'Study',     name: 'Pencil',     url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/270f_fe0f/emoji.svg', emoji_tags: ['write','notes'] },
  { id: 's12', pack_name: 'Study',     name: 'Bulb',       url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4a1/emoji.svg', emoji_tags: ['idea','think'] },
  { id: 's13', pack_name: 'Campus',    name: 'Wave',       url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/emoji.svg', emoji_tags: ['hi','hello'] },
  { id: 's14', pack_name: 'Campus',    name: 'Party',      url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/emoji.svg', emoji_tags: ['party','celebrate'] },
  { id: 's15', pack_name: 'Campus',    name: 'Coffee',     url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/emoji.svg', emoji_tags: ['coffee','break'] },
];

export const useStickers = () => {
  const [stickers, setStickers] = useState<CommunitySticker[]>(BUILTIN_STICKERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to load from Firestore, fall back to built-ins
    const q = query(collection(db, STICKERS), where('is_active', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const loaded = snap.docs.map((d) => ({
          id: d.id,
          pack_name: (d.data().pack_name as string) || 'General',
          name: (d.data().name as string) || '',
          url: (d.data().url as string) || '',
          emoji_tags: (d.data().emoji_tags as string[]) || [],
        }));
        setStickers(loaded);
      }
      setLoading(false);
    }, () => {
      setStickers(BUILTIN_STICKERS);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const packs = [...new Set(stickers.map((s) => s.pack_name))];

  return { stickers, packs, loading };
};

// ─── Sub-communities ──────────────────────────────────────────────────────────

export const useSubCommunities = () => {
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, SUB_COLS), where('is_active', '==', true), orderBy('member_count', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setSubCommunities(snap.docs.map((d) => docToSubCommunity(d.id, d.data() as Record<string, unknown>)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  return { subCommunities, loading };
};

export const useSubCommunityActions = () => {
  const [loading, setLoading] = useState(false);

  const joinSubCommunity = useCallback(async (
    subCommunityId: string,
    userId: string,
    userName: string,
    userAvatar?: string,
  ) => {
    setLoading(true);
    try {
      const memberId = `${subCommunityId}_${userId}`;
      const memberRef = doc(db, SUB_MEMS, memberId);
      const snap = await getDoc(memberRef);
      if (!snap.exists()) {
        const batch = writeBatch(db);
        batch.set(memberRef, {
          sub_community_id: subCommunityId,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar || null,
          joined_at: serverTimestamp(),
        });
        batch.update(doc(db, SUB_COLS, subCommunityId), { member_count: increment(1) });
        await batch.commit();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveSubCommunity = useCallback(async (subCommunityId: string, userId: string) => {
    setLoading(true);
    try {
      const memberId = `${subCommunityId}_${userId}`;
      const memberRef = doc(db, SUB_MEMS, memberId);
      const snap = await getDoc(memberRef);
      if (snap.exists()) {
        const batch = writeBatch(db);
        batch.delete(memberRef);
        batch.update(doc(db, SUB_COLS, subCommunityId), { member_count: increment(-1) });
        await batch.commit();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createSubCommunity = useCallback(async (
    name: string,
    description: string,
    color: string,
    parentTopic: string,
    createdBy: string,
  ) => {
    setLoading(true);
    try {
      await addDoc(collection(db, SUB_COLS), {
        name,
        description,
        color,
        parent_topic: parentTopic,
        created_by: createdBy,
        member_count: 0,
        is_active: true,
        created_at: serverTimestamp(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserMemberships = useCallback(async (userId: string): Promise<string[]> => {
    const snap = await getDocs(query(collection(db, SUB_MEMS), where('user_id', '==', userId)));
    return snap.docs.map((d) => (d.data() as { sub_community_id: string }).sub_community_id);
  }, []);

  return { joinSubCommunity, leaveSubCommunity, createSubCommunity, getUserMemberships, loading };
};

// ─── Saved messages list ──────────────────────────────────────────────────────

export const useSavedMessages = (userId: string) => {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(collection(db, SAVED), where('user_id', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      setSavedIds(snap.docs.map((d) => (d.data() as { message_id: string }).message_id));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [userId]);

  return { savedIds, loading };
};
