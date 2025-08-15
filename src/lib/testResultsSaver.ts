import { supabase } from '@/integrations/supabase/client';
import { CPTResult, GoNoGoResult, MemoryResult, UserData } from '@/types/test';
import { buildSummaryKey, buildFeedbackMarkdown, buildFeedbackHtml, scoreCPT, scoreGoNoGo, scoreMemory } from '@/lib/scoring';

export interface SaveTestResultsParams {
  userData: UserData;
  cptResults: CPTResult;
  gonogoResults: GoNoGoResult;
  memoryResults: MemoryResult;
  testSessionId?: string;
}

/**
 * Сохраняет полные результаты тестирования в таблицу test_results
 */
export async function saveTestResults({
  userData,
  cptResults,
  gonogoResults,
  memoryResults,
  testSessionId
}: SaveTestResultsParams): Promise<{ success: boolean; summaryKey?: string; error?: string }> {
  try {
    // Вычисляем scores и summary key
    const x = scoreCPT(cptResults, userData.age);
    const y = scoreGoNoGo(gonogoResults, userData.age);
    const z = scoreMemory(memoryResults, userData.age);
    const summaryKey = buildSummaryKey(x, y, z);
    
  // Генерируем Markdown и HTML feedback: сохраняем HTML в feedback_html (sanitized) и Markdown в feedback_md
  const feedbackMd = buildFeedbackMarkdown(summaryKey, cptResults, gonogoResults, memoryResults);
  const feedbackHtml = buildFeedbackHtml(summaryKey, cptResults, gonogoResults, memoryResults);
    
    // Подготавливаем данные для вставки
    const insertData = {
      user_id: userData.userId,
      user_data_id: userData.id,
      age: userData.age,
      email: userData.email,
      summary_key: summaryKey,
  feedback_html: feedbackHtml,
  feedback_md: feedbackMd,
      // supabase client expects Json-like values; cast to `any` to satisfy types
      cpt_result: cptResults as any,
      gonogo_result: gonogoResults as any,
      memory_result: memoryResults as any,
      test_session_id: testSessionId || null,
      sent_to_telegram: false
    };

    // Вставляем результаты в базу данных
    const { data, error } = await supabase
      .from('test_results')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving test results:', error);
      return { success: false, error: error.message };
    }

    console.log('Test results saved successfully:', data);
    return { success: true, summaryKey };

  } catch (error) {
    console.error('Unexpected error saving test results:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Проверяет, существуют ли уже результаты для данного пользователя
 */
export async function checkExistingResults(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error checking existing results:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Unexpected error checking existing results:', error);
    return false;
  }
}

/**
 * Обновляет результаты тестирования (если нужно перезаписать)
 */
export async function updateTestResults(
  userId: string,
  params: Omit<SaveTestResultsParams, 'userData'> & { userData: UserData }
): Promise<{ success: boolean; summaryKey?: string; error?: string }> {
  try {
    const { userData, cptResults, gonogoResults, memoryResults, testSessionId } = params;
    
    // Вычисляем новые scores
    const x = scoreCPT(cptResults, userData.age);
    const y = scoreGoNoGo(gonogoResults, userData.age);
    const z = scoreMemory(memoryResults, userData.age);
    const summaryKey = buildSummaryKey(x, y, z);
    
  const feedbackMd = buildFeedbackMarkdown(summaryKey, cptResults, gonogoResults, memoryResults);
  const feedbackHtml = buildFeedbackHtml(summaryKey, cptResults, gonogoResults, memoryResults);
    
    const updateData = {
      age: userData.age,
      email: userData.email,
      summary_key: summaryKey,
  feedback_html: feedbackHtml,
  feedback_md: feedbackMd,
      cpt_result: cptResults as any,
      gonogo_result: gonogoResults as any,
      memory_result: memoryResults as any,
      test_session_id: testSessionId || null,
      sent_to_telegram: false
    };

    const { data, error } = await supabase
      .from('test_results')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating test results:', error);
      return { success: false, error: error.message };
    }

    console.log('Test results updated successfully:', data);
    return { success: true, summaryKey };

  } catch (error) {
    console.error('Unexpected error updating test results:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
