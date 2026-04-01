import { supabase, Opportunity, UserApplication } from '../lib/supabase';

export const opportunitiesService = {
  // Get all opportunities with filters
  async getOpportunities(filters?: {
    type?: 'scholarship' | 'internship';
    search?: string;
    sortBy?: 'newest' | 'deadline-soon' | 'popular';
  }) {
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'active');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'deadline-soon':
        query = query.order('deadline', { ascending: true });
        break;
      case 'popular':
        query = query.order('views_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Get featured opportunities
  async getFeaturedOpportunities() {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true)
      .limit(6);

    if (error) throw error;
    return data || [];
  },

  // Get single opportunity details
  async getOpportunityById(opportunityId: string) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error) throw error;

    // Update view count
    if (data) {
      await supabase
        .from('opportunities')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', opportunityId);
    }

    return data;
  },

  // Apply for opportunity
  async applyForOpportunity(userId: string, opportunityId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .upsert(
        {
          user_id: userId,
          opportunity_id: opportunityId,
          status: 'pending',
        },
        { onConflict: 'user_id,opportunity_id' }
      )
      .select()
      .single();

    if (error) throw error;

    // Increment applications count
    await supabase
      .rpc('increment_applications_count', { opp_id: opportunityId });

    return data;
  },

  // Get user applications
  async getUserApplications(userId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .select('*, opportunities(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get application status
  async getApplicationStatus(userId: string, opportunityId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .select('*')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  // Get user's saved opportunities
  async getSavedOpportunities(userId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .select('opportunities(*)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data?.map((item: any) => item.opportunities) || [];
  },

  // Check if user has applied
  async hasUserApplied(userId: string, opportunityId: string) {
    const { data, error } = await supabase
      .from('user_applications')
      .select('id')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (error && error.code === 'PGRST116') return false;
    if (error) throw error;
    return !!data;
  },
};

export default opportunitiesService;
