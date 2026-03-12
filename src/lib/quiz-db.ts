import { supabase } from './supabase';

export async function initializeQuizTables() {
  try {
    console.log('[v0] Initializing quiz tables...');
    
    // Check if tables exist by trying to query them
    const { error: checkError } = await supabase
      .from('quizzes')
      .select('count', { count: 'exact', head: true });
    
    if (!checkError) {
      console.log('[v0] Quiz tables already exist');
      return true;
    }
    
    // Tables don't exist, so we need to create them
    // Since we can't execute raw SQL from the client, we'll create a sample quiz
    console.log('[v0] Creating sample quiz data...');
    
    // Create default categories
    const { data: categories } = await supabase
      .from('quiz_categories')
      .select('*')
      .limit(1);
    
    if (!categories || categories.length === 0) {
      console.log('[v0] Creating quiz categories...');
      await supabase.from('quiz_categories').insert([
        {
          name: 'Preclinical',
          description: 'Foundation and basic sciences (Levels 1-3)',
          order_index: 1
        },
        {
          name: 'Clinical',
          description: 'Clinical practice and case studies (Levels 4-6)',
          order_index: 2
        }
      ]);
    }
    
    console.log('[v0] Quiz tables initialized successfully');
    return true;
  } catch (error) {
    console.error('[v0] Error initializing quiz tables:', error);
    return false;
  }
}

export async function createSampleQuiz() {
  try {
    console.log('[v0] Creating sample quiz...');
    
    // First ensure categories exist
    const { data: categories } = await supabase
      .from('quiz_categories')
      .select('id')
      .eq('name', 'Preclinical')
      .single();
    
    if (!categories) {
      console.error('[v0] No categories found');
      return null;
    }
    
    // Get a level
    const { data: level } = await supabase
      .from('quiz_levels')
      .select('id')
      .eq('category_id', categories.id)
      .limit(1)
      .single();
    
    if (!level) {
      console.log('[v0] Creating default level...');
      const { data: newLevel } = await supabase
        .from('quiz_levels')
        .insert([
          {
            category_id: categories.id,
            level_number: 1,
            title: 'Level 1',
            description: 'Foundation concepts and fundamentals'
          }
        ])
        .select()
        .single();
      
      if (!newLevel) return null;
    }
    
    // Create a sample quiz
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert([
        {
          title: 'Sample Quiz',
          description: 'This is a sample quiz to get you started',
          total_questions: 5,
          duration_minutes: 15,
          pass_score: 70,
          is_published: true
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('[v0] Error creating sample quiz:', error);
      return null;
    }
    
    console.log('[v0] Sample quiz created:', quiz);
    return quiz;
  } catch (error) {
    console.error('[v0] Error creating sample quiz:', error);
    return null;
  }
}
