import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── Types ──────────────────────────────────────────────────────────────────

export type CommunityGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  banner_url?: string;
  member_count: number;
  post_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Community = {
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
};

// ── Helpers ────────────────────────────────────────────────────────────────

function toIso(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToGroup(id: string, data: Record<string, unknown>): CommunityGroup {
  return {
    id,
    name: (data.name as string) || '',
    slug: (data.slug as string) || '',
    description: (data.description as string) || '',
    icon: (data.icon as string) || '🎓',
    color: (data.color as string) || '#075E54',
    banner_url: (data.banner_url as string | undefined),
    member_count: (data.member_count as number) || 0,
    post_count: (data.post_count as number) || 0,
    is_active: (data.is_active as boolean) ?? true,
    created_at: toIso(data.created_at),
    updated_at: toIso(data.updated_at),
  };
}

function docToCommunity(id: string, data: Record<string, unknown>): Community {
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

// ── Fetch all active communities ───────────────────────────────────────────

export const useCommunities = () => {
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const ref = collection(db, 'communities');
      const q = query(ref, where('is_active', '==', true), orderBy('member_count', 'desc'));
      const snap = await getDocs(q);
      const groups = snap.docs.map((d) => docToGroup(d.id, d.data() as Record<string, unknown>));
      setCommunities(groups);
    } catch (err) {
      console.error('[useCommunities] fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { communities, loading, error, refetch: fetch };
};

// ── Fetch a single community by slug ──────────────────────────────────────

export const useCommunityBySlug = (slug: string) => {
  const [community, setCommunity] = useState<CommunityGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const ref = collection(db, 'communities');
        const q = query(ref, where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
          setError('Community not found');
          setCommunity(null);
        } else {
          const d = snap.docs[0];
          setCommunity(docToGroup(d.id, d.data() as Record<string, unknown>));
        }
      } catch (err) {
        console.error('[useCommunityBySlug] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Community not found');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [slug]);

  return { community, loading, error };
};

// ── Check + toggle membership ─────────────────────────────────────────────

export const useCommunityMembership = (communityId: string, userId: string) => {
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!communityId || !userId || userId === 'anonymous') {
      setLoading(false);
      return;
    }

    const check = async () => {
      const ref = collection(db, 'community_memberships');
      const q = query(
        ref,
        where('community_id', '==', communityId),
        where('user_id', '==', userId),
        limit(1)
      );
      const snap = await getDocs(q);
      setIsMember(!snap.empty);
      setLoading(false);
    };

    check();
  }, [communityId, userId]);

  const toggle = useCallback(async () => {
    if (!communityId || !userId || userId === 'anonymous') return;
    setToggling(true);
    try {
      if (isMember) {
        const ref = collection(db, 'community_memberships');
        const q = query(
          ref,
          where('community_id', '==', communityId),
          where('user_id', '==', userId),
          limit(1)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) await deleteDoc(d.ref);
        setIsMember(false);
      } else {
        await addDoc(collection(db, 'community_memberships'), {
          community_id: communityId,
          user_id: userId,
          joined_at: serverTimestamp(),
        });
        setIsMember(true);
      }
    } catch (err) {
      console.error('[useCommunityMembership] toggle error:', err);
    } finally {
      setToggling(false);
    }
  }, [communityId, userId, isMember]);

  return { isMember, loading, toggling, toggle };
};

// ── Posts within a community ──────────────────────────────────────────────

export const useCommunityPosts = (communityId: string | null) => {
  const [posts, setPosts] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = collection(db, 'community_messages');
    const q = query(
      ref,
      where('community_id', '==', communityId),
      where('is_deleted', '==', false),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPosts(snap.docs.map((d) => docToCommunity(d.id, d.data() as Record<string, unknown>)));
        setLoading(false);
      },
      (err) => {
        console.error('[useCommunityPosts] Firebase error:', err);
        setError(err.message || 'Failed to load posts');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [communityId]);

  return { posts, loading, error };
};

// ── Post a message into a community ──────────────────────────────────────

export const usePostToCommunity = () => {
  const [posting, setPosting] = useState(false);

  const post = useCallback(async (params: {
    communityId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    message: string;
    imageUrls?: string[];
  }) => {
    setPosting(true);
    try {
      const payload: Record<string, unknown> = {
        community_id: params.communityId,
        user_id: params.userId,
        user_name: params.userName,
        user_avatar: params.userAvatar || null,
        message: params.message,
        topic: 'General',
        likes_count: 0,
        reply_count: 0,
        is_pinned: false,
        is_edited: false,
        is_deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      if (params.imageUrls && params.imageUrls.length > 0) {
        payload.image_urls = params.imageUrls;
      }
      await addDoc(collection(db, 'community_messages'), payload);
    } finally {
      setPosting(false);
    }
  }, []);

  return { post, posting };
};

// ── Fetch a single community by ID ────────────────────────────────────────

export const useCommunityById = (communityId: string) => {
  const [community, setCommunity] = useState<CommunityGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) { setLoading(false); return; }

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const snap = await getDoc(doc(db, 'communities', communityId));
        if (snap.exists()) {
          setCommunity(docToGroup(snap.id, snap.data() as Record<string, unknown>));
        } else {
          setError('Community not found');
        }
      } catch (err) {
        console.error('[useCommunityById] fetch error:', err);
        setError(err instanceof Error ? err.message : 'Community not found');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [communityId]);

  return { community, loading, error };
};
