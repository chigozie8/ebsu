import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, DirectMessage, Conversation, UserProfile } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ── User Profile ─────────────────────────────────────────────────────────────

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setProfile(data || null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
};

export const useUpsertUserProfile = () => {
  const upsert = useCallback(
    async (userId: string, displayName: string, avatarUrl?: string, bio?: string) => {
      const { error } = await supabase.rpc('upsert_user_profile', {
        p_user_id: userId,
        p_display_name: displayName,
        p_avatar_url: avatarUrl ?? null,
        p_bio: bio ?? '',
      });
      if (error) console.error('[dm] upsert_user_profile:', error);
    },
    []
  );
  return { upsert };
};

// ── Conversations ─────────────────────────────────────────────────────────────

export const useConversations = (userId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const fetch = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      setConversations(data || []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { fetch(); }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [userId]);

  return { conversations, loading };
};

export const useGetOrCreateConversation = () => {
  const getOrCreate = useCallback(async (userA: string, userB: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_a: userA,
        p_user_b: userB,
      });
      if (error) throw error;
      return data as string;
    } catch (err) {
      console.error('[dm] get_or_create_conversation:', err);
      return null;
    }
  }, []);
  return { getOrCreate };
};

// ── Direct Messages ───────────────────────────────────────────────────────────

export const useDirectMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);

    const fetch = async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };
    fetch();

    channelRef.current = supabase
      .channel(`dm:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as DirectMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? (payload.new as DirectMessage) : m))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { channelRef.current?.unsubscribe(); };
  }, [conversationId]);

  return { messages, loading };
};

export const useSendDirectMessage = () => {
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    async (conversationId: string, senderId: string, receiverId: string, content: string, imageUrl?: string): Promise<DirectMessage | null> => {
      if (!content.trim() && !imageUrl) return null;
      setSending(true);
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .insert([{
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content: content.trim() || '📷',
            ...(imageUrl ? { image_url: imageUrl } : {}),
          }])
          .select()
          .single();
        if (error) throw error;
        return data as DirectMessage;
      } catch (err) {
        console.error('[dm] sendMessage:', err);
        return null;
      } finally {
        setSending(false);
      }
    },
    []
  );

  return { sendMessage, sending };
};

export const useMarkMessagesAsSeen = () => {
  const markSeen = useCallback(async (conversationId: string, receiverId: string) => {
    await supabase
      .from('direct_messages')
      .update({ is_seen: true, is_delivered: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', receiverId)
      .eq('is_seen', false);
  }, []);
  return { markSeen };
};

// ── Online presence ───────────────────────────────────────────────────────────

export const useOnlinePresence = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const setOnline = () => {
      supabase
        .from('user_profiles')
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq('user_id', userId)
        .then(() => {});
    };

    const setOffline = () => {
      supabase
        .from('user_profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('user_id', userId)
        .then(() => {});
    };

    setOnline();
    window.addEventListener('focus', setOnline);
    window.addEventListener('blur', setOffline);
    window.addEventListener('beforeunload', setOffline);

    return () => {
      setOffline();
      window.removeEventListener('focus', setOnline);
      window.removeEventListener('blur', setOffline);
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [userId]);
};

// ── Typing indicator (ephemeral via realtime broadcast) ───────────────────────

export const useTypingIndicator = (conversationId: string, myId: string) => {
  const [otherTyping, setOtherTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId || !myId) return;
    channelRef.current = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channelRef.current
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== myId) {
          setOtherTyping(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [conversationId, myId]);

  const sendTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: myId },
    });
  }, [myId]);

  return { otherTyping, sendTyping };
};

// ── All user profiles (for admin) ────────────────────────────────────────────

export const useAllUserProfiles = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('display_name');
    setProfiles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { profiles, loading, refetch };
};

export const useToggleVerification = () => {
  const toggle = useCallback(async (userId: string, current: boolean) => {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_verified: !current })
      .eq('user_id', userId);
    if (error) console.error('[dm] toggle verification:', error);
    return !error;
  }, []);
  return { toggle };
};
