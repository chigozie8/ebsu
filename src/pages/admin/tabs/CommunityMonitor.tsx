import React, { useState, useEffect } from 'react';
import { supabase, Community, CommunityReport } from '../../../lib/supabase';
import { MessageCircle, AlertTriangle, Trash2, Eye, Search } from 'lucide-react';

interface ExtendedMessage extends Community {
  report_count?: number;
  reported?: boolean;
}

const CommunityMonitor: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'reported'>('all');
  const [, setSelectedMessage] = useState<ExtendedMessage | null>(null);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalReports: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin:community')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [payload.new as ExtendedMessage, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? (payload.new as ExtendedMessage) : msg))
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch messages
      const { data: msgData, error: msgErr } = await supabase
        .from('community_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (msgErr) throw msgErr;

      // Fetch reports
      const { data: reportData, error: reportErr } = await supabase
        .from('community_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportErr) throw reportErr;

      setMessages((msgData || []) as ExtendedMessage[]);
      setReports(reportData || []);

      // Calculate stats
      const uniqueUsers = new Set((msgData || []).map((msg: any) => msg.user_id));
      setStats({
        totalMessages: msgData?.length || 0,
        totalReports: reportData?.length || 0,
        activeUsers: uniqueUsers.size,
      });
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('community_reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)));
    } catch (err) {
      console.error('Failed to resolve report:', err);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.user_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'reported') {
      return matchesSearch && reports.some((r) => r.message_id === msg.id && r.status === 'pending');
    }

    return matchesSearch;
  });

  const topicColors: Record<string, string> = {
    'General': 'bg-purple-100 text-purple-700',
    'Academics': 'bg-blue-100 text-blue-700',
    'Campus Life': 'bg-pink-100 text-pink-700',
    'Tech': 'bg-green-100 text-green-700',
    'Events': 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalMessages}</p>
            </div>
            <MessageCircle className="w-10 h-10 text-teal-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Reported</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalReports}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'reported')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Messages</option>
          <option value="reported">Reported Only</option>
        </select>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No messages found</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const messageReports = reports.filter((r) => r.message_id === msg.id);
            const hasUnresolvedReports = messageReports.some((r) => r.status === 'pending');

            return (
              <div
                key={msg.id}
                className={`bg-white rounded-xl border-2 p-4 ${
                  hasUnresolvedReports ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="flex gap-3">
                  {msg.user_avatar ? (
                    <img src={msg.user_avatar} alt={msg.user_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {msg.user_name.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{msg.user_name}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {msg.topic && msg.topic !== 'General' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${topicColors[msg.topic] || 'bg-gray-100'}`}>
                            {msg.topic}
                          </span>
                        )}
                        {hasUnresolvedReports && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {messageReports.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mt-2">{msg.message}</p>

                    {hasUnresolvedReports && (
                      <div className="mt-3 bg-orange-100 rounded-lg p-3 text-sm">
                        <p className="font-semibold text-orange-900 mb-2">Reports:</p>
                        {messageReports
                          .filter((r) => r.status === 'pending')
                          .map((report) => (
                            <div key={report.id} className="flex justify-between items-start mb-2 last:mb-0">
                              <div>
                                <p className="text-orange-800">{report.reason || 'No reason provided'}</p>
                                <p className="text-xs text-orange-700">Reported by: {report.reported_by}</p>
                              </div>
                              <button
                                onClick={() => handleResolveReport(report.id)}
                                className="text-xs bg-orange-200 text-orange-900 px-2 py-1 rounded hover:bg-orange-300 transition-colors whitespace-nowrap ml-2"
                              >
                                Resolve
                              </button>
                            </div>
                          ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setSelectedMessage(msg)}
                        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 transition-colors ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommunityMonitor;
