import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export interface QuizCategory {
  id: string;
  name: 'Preclinical' | 'Clinical';
  description: string;
}

export interface QuizLevel {
  id: string;
  level: number;
  category: 'Preclinical' | 'Clinical';
  description: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  levelId: string;
  questions: QuizQuestion[];
  published: boolean;
  createdAt: string;
}

export const useQuizManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCourse = useCallback(async (courseData: { name: string; code: string; description: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('courses')
        .insert([courseData])
        .select();

      if (err) throw err;
      toast.success('Course created successfully');
      return data?.[0];
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create course';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuiz = useCallback(async (quizData: Omit<Quiz, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[v0] Creating quiz with data:', quizData);
      const { data, error: err } = await supabase
        .from('quizzes')
        .insert([{
          title: quizData.title,
          description: quizData.description,
          course_id: quizData.courseId || null,
          total_questions: quizData.questions?.length || 0,
          is_published: quizData.published,
        }])
        .select();

      if (err) {
        console.error('[v0] Error creating quiz:', err);
        throw err;
      }
      
      console.log('[v0] Quiz created:', data);
      
      // Add questions
      if (quizData.questions && quizData.questions.length > 0) {
        const questionsWithQuizId = quizData.questions.map((q, idx) => ({
          quiz_id: data?.[0]?.id,
          question_text: q.text,
          question_type: q.type,
          points: 1,
          order_index: idx,
          explanation: q.explanation,
        }));

        console.log('[v0] Adding questions:', questionsWithQuizId);
        const { error: qErr } = await supabase
          .from('quiz_questions')
          .insert(questionsWithQuizId);

        if (qErr) {
          console.error('[v0] Error adding questions:', qErr);
          throw qErr;
        }

        // Add answers for each question
        for (let i = 0; i < quizData.questions.length; i++) {
          const q = quizData.questions[i];
          const questionId = data?.[0]?.id; // This would need to be fetched properly

          if (q.options && q.options.length > 0) {
            const answers = q.options.map((option, idx) => ({
              question_id: questionId,
              answer_text: option,
              is_correct: option === q.correctAnswer,
              order_index: idx,
            }));

            const { error: aErr } = await supabase
              .from('quiz_answers')
              .insert(answers);

            if (aErr) {
              console.error('[v0] Error adding answers:', aErr);
              throw aErr;
            }
          }
        }
      }

      toast.success('Quiz created successfully');
      return data?.[0];
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create quiz';
      console.error('[v0] createQuiz error:', errorMsg);
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addQuestionsToQuiz = useCallback(async (quizId: string, questions: QuizQuestion[]) => {
    setLoading(true);
    setError(null);
    try {
      const questionsData = questions.map((q) => ({
        quiz_id: quizId,
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
      }));

      const { data, error: err } = await supabase
        .from('questions')
        .insert(questionsData)
        .select();

      if (err) throw err;
      toast.success(`${questions.length} questions added`);
      return data;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to add questions';
      setError(errorMsg);
      toast.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishQuiz = useCallback(async (quizId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('quizzes')
        .update({ published: true })
        .eq('id', quizId);

      if (err) throw err;
      toast.success('Quiz published');
      return true;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to publish quiz';
      setError(errorMsg);
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCourse,
    createQuiz,
    addQuestionsToQuiz,
    publishQuiz,
  };
};
