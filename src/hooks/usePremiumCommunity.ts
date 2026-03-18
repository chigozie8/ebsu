import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type PremiumMessage = {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  image_url?: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
};

export type PremiumReply = {
  id: string;
  message_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
};

// ── Messages ──────────────────────────────────────────────
export const usePremiumMessages = (limit = 50) => {
  const [messages, setMessages] = useState<PremiumMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('premium_community_messages')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      setMessages(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('premium_community_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'premium_community_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [payload.new as PremiumMessage, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map((m) => m.id === payload.new.id ? payload.new as PremiumMessage : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      })
      .subscribe();

    setSubscription(channel);
    return () => { channel.unsubscribe(); };
  }, [limit]);

  return { messages, loading, subscription };
};

// ── Replies ───────────────────────────────────────────────
export const usePremiumReplies = (messageId: string) => {
  const [replies, setReplies] = useState<PremiumReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messageId) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('premium_community_replies')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });
      setReplies(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`premium_replies:${messageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'premium_community_replies', filter: `message_id=eq.${messageId}` }, (payload) => {
        if (payload.eventType === 'INSERT') setReplies((prev) => [...prev, payload.new as PremiumReply]);
        else if (payload.eventType === 'DELETE') setReplies((prev) => prev.filter((r) => r.id !== payload.old.id));
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [messageId]);

  return { replies, loading };
};

// ── Post message ──────────────────────────────────────────
export const usePostPremiumMessage = () => {
  const [posting, setPosting] = useState(false);

  const post = useCallback(async (userId: string, userName: string, content: string, userAvatar?: string, isAnnouncement = false) => {
    setPosting(true);
    try {
      const { error } = await supabase.from('premium_community_messages').insert([{
        user_id: userId, user_name: userName, user_avatar: userAvatar, content, is_announcement: isAnnouncement,
      }]);
      if (error) throw error;
    } finally {
      setPosting(false);
    }
  }, []);

  return { post, posting };
};

// ── Post reply ────────────────────────────────────────────
export const usePostPremiumReply = () => {
  const [posting, setPosting] = useState(false);

  const postReply = useCallback(async (messageId: string, userId: string, userName: string, content: string, userAvatar?: string) => {
    setPosting(true);
    try {
      const { error } = await supabase.from('premium_community_replies').insert([{
        message_id: messageId, user_id: userId, user_name: userName, user_avatar: userAvatar, content,
      }]);
      if (error) throw error;
      // Manual replies_count increment
      const { data: msg } = await supabase.from('premium_community_messages').select('replies_count').eq('id', messageId).single();
      if (msg) {
        await supabase.from('premium_community_messages').update({ replies_count: (msg.replies_count || 0) + 1 }).eq('id', messageId);
      }
    } finally {
      setPosting(false);
    }
  }, []);

  return { postReply, posting };
};

// ── Like / Unlike ─────────────────────────────────────────
export const usePremiumLike = () => {
  const toggle = useCallback(async (messageId: string, userId: string, liked: boolean) => {
    if (liked) {
      await supabase.from('premium_community_likes').delete().eq('message_id', messageId).eq('user_id', userId);
      const { data: msg } = await supabase.from('premium_community_messages').select('likes_count').eq('id', messageId).single();
      if (msg) await supabase.from('premium_community_messages').update({ likes_count: Math.max(0, (msg.likes_count || 1) - 1) }).eq('id', messageId);
    } else {
      await supabase.from('premium_community_likes').insert([{ message_id: messageId, user_id: userId }]);
      const { data: msg } = await supabase.from('premium_community_messages').select('likes_count').eq('id', messageId).single();
      if (msg) await supabase.from('premium_community_messages').update({ likes_count: (msg.likes_count || 0) + 1 }).eq('id', messageId);
    }
  }, []);

  const getUserLikes = useCallback(async (userId: string): Promise<string[]> => {
    const { data } = await supabase.from('premium_community_likes').select('message_id').eq('user_id', userId);
    return (data || []).map((l) => l.message_id);
  }, []);

  return { toggle, getUserLikes };
};

// ── Admin: delete, pin, announce ──────────────────────────
export const useAdminPremiumActions = () => {
  const deleteMsg = useCallback(async (id: string) => {
    await supabase.from('premium_community_messages').delete().eq('id', id);
  }, []);

  const togglePin = useCallback(async (id: string, current: boolean) => {
    await supabase.from('premium_community_messages').update({ is_pinned: !current }).eq('id', id);
  }, []);

  const toggleAnnouncement = useCallback(async (id: string, current: boolean) => {
    await supabase.from('premium_community_messages').update({ is_announcement: !current }).eq('id', id);
  }, []);

  const deleteReply = useCallback(async (id: string, messageId: string) => {
    await supabase.from('premium_community_replies').delete().eq('id', id);
    const { data: msg } = await supabase.from('premium_community_messages').select('replies_count').eq('id', messageId).single();
    if (msg) await supabase.from('premium_community_messages').update({ replies_count: Math.max(0, (msg.replies_count || 1) - 1) }).eq('id', messageId);
  }, []);

  return { deleteMsg, togglePin, toggleAnnouncement, deleteReply };
};
