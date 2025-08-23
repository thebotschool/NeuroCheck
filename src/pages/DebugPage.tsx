import React, { useState } from 'react';

export default function DebugPage() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Testing connection with:', { SUPABASE_URL, SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY });
      
      // Сначала попробуем получить все колонки с помощью select=*
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tests?select=*&limit=5`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        setResult({ error: 'Request failed', status: response.status, errorText });
        return;
      }
      
      const data = await response.json();
      setResult({ 
        success: true, 
        data,
        message: 'All columns from tests table',
        columns: data.length > 0 ? Object.keys(data[0]) : 'No data to show columns'
      });
      
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: 'Exception', message: error instanceof Error ? error.message : 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  const testSpecificToken = async () => {
    setLoading(true);
    try {
      const token = 'a682313ba427b6c4ccca968b';
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=*`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        setResult({ error: 'Token query failed', status: response.status, errorText });
        return;
      }
      
      const data = await response.json();
      setResult({ success: true, token, found: data.length > 0, data });
      
    } catch (error) {
      setResult({ error: 'Token test exception', message: error instanceof Error ? error.message : 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Supabase Connection</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testConnection} disabled={loading}>
          Test Connection (Last 5 records)
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testSpecificToken} disabled={loading}>
          Test Specific Token (a682313ba427b6c4ccca968b)
        </button>
      </div>
      
      {loading && <div>Loading...</div>}
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Result:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}