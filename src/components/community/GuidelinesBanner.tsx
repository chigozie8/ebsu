import React, { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Guideline {
  id: string;
  content: string;
  created_at: string;
}

const GuidelinesBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuidelines();

    // Subscribe to guideline changes
    const channel = supabase
      .channel('community_guidelines_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_guidelines',
        },
        () => {
          fetchGuidelines();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchGuidelines = async () => {
    try {
      const { data, error } = await supabase
        .from('community_guidelines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuidelines(data || []);
    } catch (err) {
      console.error('[v0] Failed to fetch guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || guidelines.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Community Guidelines</h3>
            <p className="text-xs sm:text-sm text-gray-600">Click to view community rules</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-white border-t border-blue-200">
          <ul className="space-y-2 sm:space-y-3">
            {guidelines.map((guideline, index) => (
              <li key={guideline.id} className="flex gap-3">
                <span className="font-semibold text-blue-600 flex-shrink-0 text-sm sm:text-base">
                  {index + 1}.
                </span>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{guideline.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GuidelinesBanner;
