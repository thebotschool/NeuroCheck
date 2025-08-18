import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Test, TCPResult, GoNoGoResult, MemoryResult, TestRow } from '@/types/test';
import { toast } from '@/hooks/use-toast';

// Helper to convert a DB row to the app-level Test type
const fromRow = (row: TestRow): Test => {
  const parseJsonField = (field: unknown) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        // Return null or undefined if parsing fails, or log the error
        console.error('Failed to parse JSON field:', field, e);
        return undefined;
      }
    }
    // If it's not a string, assume it's already a parsed object or null/undefined
    return field as any;
  };

  return {
    ...row,
    tcp_results: parseJsonField(row.tcp_results),
    gonogo_results: parseJsonField(row.gonogo_results),
    memory_results: parseJsonField(row.memory_results),
  };
};

export const useTestSession = () => {
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(false);

  const updateTestWithUserData = useCallback(async (token: string, name: string, age: number, email: string) => {
    try {
      setLoading(true);
      // Note: The 'name' field is not in the DB schema and is only held in local state.
      const { data, error } = await supabase
        .from('tests')
        .update({ age, email })
        .eq('token', token)
        .select()
        .single();

      if (error) throw error;

      const updatedTest = fromRow(data);
      // Manually add the app-specific fields to the local state
      updatedTest.name = name;

      setTest(updatedTest);
      return updatedTest;
    } catch (error) {
      console.error('Error updating test with user data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные сессии',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTest = useCallback(async (updates: Partial<TestRow>) => {
    if (!test) return;

    try {
      setLoading(true);
      
      // Create a payload with only the fields that exist in the DB
      const payload: Partial<TestRow> = {};
      if (updates.current_step !== undefined) payload.current_step = updates.current_step;
      if (updates.tcp_results !== undefined) payload.tcp_results = updates.tcp_results;
      if (updates.gonogo_results !== undefined) payload.gonogo_results = updates.gonogo_results;
      if (updates.memory_results !== undefined) payload.memory_results = updates.memory_results;
      if (updates.completed_at !== undefined) payload.completed_at = updates.completed_at;
      if (updates.is_completed !== undefined) payload.is_completed = updates.is_completed;

      const { error } = await supabase
        .from('tests')
        .update(payload)
        .eq('id', test.id);

      if (error) throw error;

      // Update local state optimistically
      setTest(prevTest => ({ ...prevTest!, ...updates } as Test));

    } catch (error) {
      console.error('Error updating test:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить сессию',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [test]);

  const saveTCPResults = useCallback(async (results: TCPResult) => {
    await updateTest({ tcp_results: results as any }); // Cast to any to match Json type
  }, [updateTest]);

  const saveGoNoGoResults = useCallback(async (results: GoNoGoResult) => {
    await updateTest({ gonogo_results: results as any });
  }, [updateTest]);

  const saveMemoryResults = useCallback(async (results: MemoryResult) => {
    await updateTest({ memory_results: results as any });
  }, [updateTest]);

  const completeTest = useCallback(async () => {
    await updateTest({
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
  }, [updateTest]);

  const getTestByToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;
      if (!data) return null;

      const existingTest = fromRow(data);

      setTest(existingTest);
      return existingTest;
    } catch (error) {
      console.error('Error getting test by token:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    test,
    loading,
    updateTestWithUserData,
    updateTest,
    saveTCPResults,
    saveGoNoGoResults,
    saveMemoryResults,
    completeTest,
    getTestByToken,
    setTest, // Exposed for dev bypass
  };
};