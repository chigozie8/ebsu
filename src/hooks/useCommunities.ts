/**
 * useCommunities — Firebase-backed community groups.
 *
 * Communities are defined locally (no Supabase table needed).
 * Message & member counts are derived live from Firebase.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ── CommunityGroup type (mirrors what CommunitiesListPage expects) ──────────
export interface CommunityGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  member_count: number;
  post_count: number;
  is_active: boolean;
  topic: string; // maps to the `topic` field on community_messages
}

// ── Static community definitions ──────────────────────────────────────────
const STATIC_COMMUNITIES: Omit<CommunityGroup, 'member_count' | 'post_count'>[] = [
  {
    id: 'general',
    slug: 'general',
    name: 'General',
    description: 'Open discussions for all EBSU students',
    icon: '💬',
    color: '#00875a',
    is_active: true,
    topic: 'General',
  },
  {
    id: 'academics',
    slug: 'academics',
    name: 'Academics',
    description: 'Course work, study tips, exams and results',
    icon: '📚',
    color: '#1d4ed8',
    is_active: true,
    topic: 'Academics',
  },
  {
    id: 'campus-life',
    slug: 'campus-life',
    name: 'Campus Life',
    description: 'Campus news, hostels, food and social life',
    icon: '🏫',
    color: '#be185d',
    is_active: true,
    topic: 'Campus Life',
  },
  {
    id: 'health-wellness',
    slug: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Medical tips, mental health and student wellness',
    icon: '🏥',
    color: '#dc2626',
    is_active: true,
    topic: 'Health',
  },
  {
    id: 'tech',
    slug: 'tech',
    name: 'Tech & Innovation',
    description: 'Coding, gadgets, startups and tech trends',
    icon: '💻',
    color: '#7c3aed',
    is_active: true,
    topic: 'Tech',
  },
  {
    id: 'events',
    slug: 'events',
    name: 'Events',
    description: 'EBSUMSA events, hangouts and announcements',
    icon: '🎉',
    color: '#d97706',
    is_active: true,
    topic: 'Events',
  },
];

// ── useCommunities ────────────────────────────────────────────────────────
export const useCommunities = () => {
  const [communities, setCommunities] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const enriched: CommunityGroup[] = await Promise.all(
        STATIC_COMMUNITIES.map(async (c) => {
          let post_count = 0;
          try {
            const q = query(
              collection(db, 'community_messages'),
              where('is_deleted', '==', false),
              where('topic', '==', c.topic)
            );
            const snap = await getCountFromServer(q);
            post_count = snap.data().count;
          } catch {
            // getCountFromServer may not be supported — fall back to 0
            post_count = 0;
          }
          return { ...c, post_count, member_count: 0 };
        })
      );

      setCommunities(enriched);
    } catch (err) {
      console.error('[useCommunities] error:', err);
      // Even on error, show the static communities so the UI is never broken
      setCommunities(
        STATIC_COMMUNITIES.map((c) => ({ ...c, post_count: 0, member_count: 0 }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  return { communities, loading, error, refetch: fetchCounts };
};

// ── useCommunityBySlug ────────────────────────────────────────────────────
export const useCommunityBySlug = (slug: string) => {
  const community = slug
    ? STATIC_COMMUNITIES.find((c) => c.slug === slug) ?? null
    : null;

  return {
    community: community
      ? { ...community, post_count: 0, member_count: 0 }
      : null,
    loading: false,
    error: community ? null : 'Community not found',
  };
};

// ── useCommunityMembership (Firebase localStorage-backed) ─────────────────
// Since there is no Supabase memberships table, we track join state in
// localStorage so it persists across page reloads without a backend table.
export const useCommunityMembership = (communityId: string, userId: string) => {
  const key = `community_member_${userId}_${communityId}`;
  const [isMember, setIsMember] = useState<boolean>(() => {
    try { return localStorage.getItem(key) === '1'; } catch { return false; }
  });
  const [loading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toggle = useCallback(async () => {
    if (!communityId || !userId || userId === 'anonymous') return;
    setToggling(true);
    try {
      const next = !isMember;
      setIsMember(next);
      try { localStorage.setItem(key, next ? '1' : '0'); } catch { /* noop */ }
    } finally {
      setToggling(false);
    }
  }, [communityId, userId, isMember, key]);

  return { isMember, loading, toggling, toggle };
};

// ── useCommunityPosts — reads from Firebase community_messages ────────────
import {
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import type { FirebaseCommunityMessage } from './useCommunity';

export const useCommunityPosts = (communityId: string | null) => {
  const [posts, setPosts] = useState<FirebaseCommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!communityId) { setLoading(false); return; }

    // communityId is the slug (e.g. "general") which matches `topic` in Firebase
    const community = STATIC_COMMUNITIES.find((c) => c.id === communityId);
    const topicFilter = community?.topic ?? communityId;

    const q = query(
      collection(db, 'community_messages'),
      where('is_deleted', '==', false),
      where('topic', '==', topicFilter),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setPosts(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const ts = (v: unknown) => {
              if (!v) return new Date().toISOString();
              if (v && typeof (v as any).toDate === 'function') return (v as any).toDate().toISOString();
              if (typeof v === 'string') return v;
              return new Date().toISOString();
            };
            return {
              id: d.id,
              user_id: (data.user_id as string) || '',
              user_name: (data.user_name as string) || 'Unknown',
              user_avatar: (data.user_avatar as string | undefined),
              message: (data.message as string) || '',
              topic: (data.topic as string) || 'General',
              community_id: (data.community_id as string | undefined),
              image_urls: (data.image_urls as string[] | undefined),
              sticker_url: (data.sticker_url as string | undefined),
              created_at: ts(data.created_at),
              updated_at: ts(data.updated_at),
              likes_count: (data.likes_count as number) || 0,
              reply_count: (data.reply_count as number) || 0,
              is_pinned: (data.is_pinned as boolean) || false,
              is_edited: (data.is_edited as boolean) || false,
              is_deleted: (data.is_deleted as boolean) || false,
            } as FirebaseCommunityMessage;
          })
        );
        setLoading(false);
      },
      (err) => {
        console.error('[useCommunityPosts]', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [communityId]);

  return { posts, loading, error };
};

// ── usePostToCommunity ────────────────────────────────────────────────────
import {
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

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
      const community = STATIC_COMMUNITIES.find((c) => c.id === params.communityId);
      const topic = community?.topic ?? 'General';
      const payload: Record<string, unknown> = {
        user_id: params.userId,
        user_name: params.userName,
        user_avatar: params.userAvatar || null,
        message: params.message,
        topic,
        community_id: params.communityId,
        likes_count: 0,
        reply_count: 0,
        is_pinned: false,
        is_edited: false,
        is_deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      if (params.imageUrls && params.imageUrls.length > 0) payload.image_urls = params.imageUrls;
      return await addDoc(collection(db, 'community_messages'), payload);
    } finally {
      setPosting(false);
    }
  }, []);

  return { post, posting };
};
