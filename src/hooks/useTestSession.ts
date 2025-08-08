import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestSession, TestStep, CPTResult, GoNoGoResult, MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

export const useTestSession = () => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentStep, setCurrentStep] = useState<TestStep>('promo-check');
  const [loading, setLoading] = useState(false);

  const createSession = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: userId,
          current_step: 1,
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: TestSession = {
        id: data.id,
        userId: data.user_id,
        currentStep: data.current_step,
        handUsed: 'left',
        startedAt: new Date(data.started_at),
        isCompleted: data.is_completed,
      };

      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать сессию тестирования',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (updates: Partial<TestSession>) => {
    if (!session) return;

    try {
      setLoading(true);
      // Prepare update payload by sending only defined fields, mapping to DB columns
      const payload: Record<string, unknown> = {};
      if (typeof updates.currentStep !== 'undefined') payload.current_step = updates.currentStep;
      if (typeof updates.cptResults !== 'undefined') payload.cpt_results = updates.cptResults as unknown;
      if (typeof updates.gonogoResults !== 'undefined') payload.gonogo_results = updates.gonogoResults as unknown;
      if (typeof updates.memoryResults !== 'undefined') payload.memory_results = updates.memoryResults as unknown;
      if (typeof updates.completedAt !== 'undefined') payload.completed_at = updates.completedAt ? updates.completedAt.toISOString() : null;
      if (typeof updates.isCompleted !== 'undefined') payload.is_completed = updates.isCompleted;

      const { error } = await supabase
        .from('test_sessions')
        .update(payload)
        .eq('id', session.id);

      if (error) throw error;

      setSession({ ...session, ...updates });
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить сессию',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [session]);

  const saveCPTResults = useCallback(async (results: CPTResult) => {
    await updateSession({ cptResults: results });
  }, [updateSession]);

  const saveGoNoGoResults = useCallback(async (results: GoNoGoResult) => {
    await updateSession({ gonogoResults: results });
  }, [updateSession]);

  const saveMemoryResults = useCallback(async (results: MemoryResult) => {
    await updateSession({ memoryResults: results });
  }, [updateSession]);

  const completeSession = useCallback(async () => {
    await updateSession({
      isCompleted: true,
      completedAt: new Date(),
    });
  }, [updateSession]);

  return {
    session,
    currentStep,
    setCurrentStep,
    loading,
    createSession,
    updateSession,
    saveCPTResults,
    saveGoNoGoResults,
    saveMemoryResults,
    completeSession,
  };
};