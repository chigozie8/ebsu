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
      const { data, error: err } = await supabase
        .from('quizzes')
        .insert([{
          title: quizData.title,
          description: quizData.description,
          course_id: quizData.courseId,
          level_id: quizData.levelId,
          published: quizData.published,
        }])
        .select();

      if (err) throw err;
      
      // Add questions
      if (quizData.questions.length > 0) {
        const questionsWithQuizId = quizData.questions.map((q) => ({
          quiz_id: data?.[0]?.id,
          text: q.text,
          type: q.type,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
        }));

        const { error: qErr } = await supabase
          .from('questions')
          .insert(questionsWithQuizId);

        if (qErr) throw qErr;
      }

      toast.success('Quiz created successfully');
      return data?.[0];
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to create quiz';
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
