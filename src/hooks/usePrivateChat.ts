import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, PrivateChat, PrivateMessage, UserVerification } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────
// USER VERIFICATION
// ─────────────────────────────────────────────────────────

export const useUserVerification = (userId: string) => {
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_verification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      setVerification(data ?? null);
      setLoading(false);
    };

    fetch();
  }, [userId]);

  const upsertVerification = useCallback(async (
    uid: string,
    name: string,
    avatar?: string,
    bio?: string,
  ) => {
    const { data } = await supabase
      .from('user_verification')
      .upsert({ user_id: uid, user_name: name, user_avatar: avatar, bio }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();
    if (data) setVerification(data);
  }, []);

  /** Admin only: toggle is_verified */
  const toggleVerified = useCallback(async (uid: string, current: boolean) => {
    await supabase
      .from('user_verification')
      .update({ is_verified: !current, verified_at: !current ? new Date().toISOString() : null })
      .eq('user_id', uid);
  }, []);

  /** Update online presence */
  const setOnlineStatus = useCallback(async (uid: string, status: 'online' | 'offline') => {
    await supabase
      .from('user_verification')
      .upsert({ user_id: uid, online_status: status, last_seen: new Date().toISOString(), user_name: '' }, { onConflict: 'user_id' });
  }, []);

  return { verification, loading, upsertVerification, toggleVerified, setOnlineStatus };
};

/** Fetch verification for any user (for profile modal) */
export const useAnyUserVerification = (userId: string | null) => {
  const [verification, setVerification] = useState<UserVerification | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('user_verification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => { setVerification(data ?? null); setLoading(false); });
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

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('private_chats')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });
      setChats(data ?? []);
      setLoading(false);
    };

    fetch();

    const channel: RealtimeChannel = supabase
      .channel(`private_chats:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_chats' }, () => { fetch(); })
      .subscribe();

    return () => { channel.unsubscribe(); };
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
      // Try both orderings for the unique constraint
      const { data: existing } = await supabase
        .from('private_chats')
        .select('id')
        .or(
          `and(participant_1.eq.${myId},participant_2.eq.${otherId}),and(participant_1.eq.${otherId},participant_2.eq.${myId})`
        )
        .maybeSingle();

      if (existing?.id) return existing.id;

      const { data: created, error } = await supabase
        .from('private_chats')
        .insert({
          participant_1: myId,
          participant_2: otherId,
          participant_1_name: myName,
          participant_2_name: otherName,
          participant_1_avatar: myAvatar,
          participant_2_avatar: otherAvatar,
        })
        .select()
        .single();

      if (error) throw error;
      return created.id as string;
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
  // Ref so realtime callbacks always see fresh state without stale closures
  const msgRef = useRef<PrivateMessage[]>([]);

  useEffect(() => {
    msgRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!chatId) { setLoading(false); return; }

    let alive = true; // guard against setting state after unmount

    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('private_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (!alive) return;
      const rows = data ?? [];
      setMessages(rows);
      msgRef.current = rows;
      setLoading(false);
    };

    fetchAll();

    const channel: RealtimeChannel = supabase
      .channel(`pm:${chatId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          if (!alive) return;
          const incoming = payload.new as PrivateMessage;
          // Deduplicate: skip if already present (optimistic insert may have added it)
          if (msgRef.current.some((m) => m.id === incoming.id)) return;
          setMessages((prev) => {
            const next = [...prev, incoming];
            msgRef.current = next;
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'private_messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          if (!alive) return;
          const updated = payload.new as PrivateMessage;
          setMessages((prev) => {
            const next = prev.map((m) => m.id === updated.id ? updated : m);
            msgRef.current = next;
            return next;
          });
        }
      )
      .subscribe((status) => {
        // If the channel drops, re-fetch to catch any missed messages
        if (!alive) return;
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          fetchAll();
        }
      });

    return () => {
      alive = false;
      channel.unsubscribe();
    };
  }, [chatId]);

  return { messages, loading };
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
      const { error } = await supabase.from('private_messages').insert({
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        content,
        image_url: imageUrl,
      });
      if (error) throw error;

      // Update last_message on the chat
      await supabase
        .from('private_chats')
        .update({ last_message: content, last_message_at: new Date().toISOString() })
        .eq('id', chatId);
    } finally {
      setSending(false);
    }
  }, []);

  return { send, sending };
};

// ─────────────────────────────────────────────────────────
// MARK MESSAGES AS SEEN
// ─────────────────────────────────────────────────────────

export const useMarkSeen = () => {
  const markSeen = useCallback(async (chatId: string, viewerId: string) => {
    await supabase
      .from('private_messages')
      .update({ is_seen: true })
      .eq('chat_id', chatId)
      .neq('sender_id', viewerId)
      .eq('is_seen', false);
  }, []);

  return { markSeen };
};

// ─────────────────────────────────────────────────────────
// TYPING INDICATOR (ephemeral via Supabase Broadcast)
// ─────────────────────────────────────────────────────────

export const useTypingIndicator = (chatId: string | null, myId: string) => {
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const clearTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttleRef    = useRef<number>(0);
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId === myId) return;
        setOtherIsTyping(true);
        // Reset the auto-clear timer on every new event
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => setOtherIsTyping(false), 3000);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, [chatId, myId]);

  // Throttled broadcast: fires at most once every 1.5 s
  const broadcastTyping = useCallback(() => {
    if (!chatId || !channelRef.current) return;
    const now = Date.now();
    if (now - throttleRef.current < 1500) return;
    throttleRef.current = now;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: myId },
    });
  }, [chatId, myId]);

  return { otherIsTyping, broadcastTyping };
};
