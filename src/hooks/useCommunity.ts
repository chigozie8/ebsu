import { useCallback, useEffect, useState } from 'react';
import { supabase, Community, CommunityReply } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useCommunityMessages = (topic?: string, limit: number = 20) => {
  const [messages, setMessages] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('community_messages')
          .select('*')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (topic && topic !== 'All') {
          query = query.eq('topic', topic);
        }

        const { data, error: err } = await query;
        if (err) throw err;
        setMessages(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:community_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [payload.new as Community, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Community) : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    setSubscription(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [topic, limit]);

  return { messages, loading, error, subscription };
};

export const useCommunityReplies = (messageId: string) => {
  const [replies, setReplies] = useState<CommunityReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReplies = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('community_replies')
          .select('*')
          .eq('message_id', messageId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (err) throw err;
        setReplies(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch replies');
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();

    // Subscribe to realtime updates for replies
    const channel = supabase
      .channel(`public:community_replies:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_replies',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReplies((prev) => [...prev, payload.new as CommunityReply]);
          } else if (payload.eventType === 'UPDATE') {
            setReplies((prev) =>
              prev.map((reply) => (reply.id === payload.new.id ? (payload.new as CommunityReply) : reply))
            );
          } else if (payload.eventType === 'DELETE') {
            setReplies((prev) => prev.filter((reply) => reply.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [messageId]);

  return { replies, loading, error };
};

export const usePostMessage = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postMessage = useCallback(async (userId: string, userName: string, message: string, topic: string, userAvatar?: string) => {
    try {
      setPosting(true);
      setError(null);
      const { data, error: err } = await supabase.from('community_messages').insert([
        {
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          message,
          topic,
        },
      ]);

      if (err) throw err;
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to post message';
      setError(errorMsg);
      throw err;
    } finally {
      setPosting(false);
    }
  }, []);

  return { postMessage, posting, error };
};

export const usePostReply = () => {
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postReply = useCallback(async (messageId: string, userId: string, userName: string, reply: string, userAvatar?: string) => {
    try {
      setPosting(true);
      setError(null);
      const { data, error: err } = await supabase.from('community_replies').insert([
        {
          message_id: messageId,
          user_id: userId,
          user_name: userName,
          user_avatar: userAvatar,
          reply,
        },
      ]);

      if (err) throw err;
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to post reply';
      setError(errorMsg);
      throw err;
    } finally {
      setPosting(false);
    }
  }, []);

  return { postReply, posting, error };
};

export const useLikeMessage = () => {
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeMessage = useCallback(async (messageId: string, userId: string) => {
    try {
      setLiking(true);
      setError(null);
      const { data, error: err } = await supabase.from('community_likes').insert([
        {
          message_id: messageId,
          user_id: userId,
        },
      ]);

      if (err) throw err;
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to like message';
      setError(errorMsg);
    } finally {
      setLiking(false);
    }
  }, []);

  const unlikeMessage = useCallback(async (messageId: string, userId: string) => {
    try {
      setLiking(true);
      setError(null);
      const { error: err } = await supabase
        .from('community_likes')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (err) throw err;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to unlike message';
      setError(errorMsg);
    } finally {
      setLiking(false);
    }
  }, []);

  return { likeMessage, unlikeMessage, liking, error };
};

export const useDeleteMessage = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      setDeleting(true);
      setError(null);
      const { error: err } = await supabase
        .from('community_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (err) throw err;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete message';
      setError(errorMsg);
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteMessage, deleting, error };
};

export const useEditMessage = () => {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editMessage = useCallback(async (messageId: string, newMessage: string) => {
    try {
      setEditing(true);
      setError(null);
      const { error: err } = await supabase
        .from('community_messages')
        .update({ message: newMessage, is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (err) throw err;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMsg);
    } finally {
      setEditing(false);
    }
  }, []);

  return { editMessage, editing, error };
};
