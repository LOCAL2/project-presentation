import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const TestConnection = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*');

      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*');

      setResult({
        success: !catError && !docError,
        categories: {
          data: categories,
          error: catError,
          count: categories?.length || 0
        },
        documents: {
          data: documents,
          error: docError,
          count: documents?.length || 0
        }
      });
    } catch (error) {
      setResult({
        success: false,
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <h1>Supabase Connection Test</h1>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: '1rem'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>

      {result && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: result.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '6px'
        }}>
          <h2>Result:</h2>
          <pre style={{
            background: '#f8f9fa',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '0.85rem'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
