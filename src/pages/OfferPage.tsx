import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const OfferPage = () => {
  const [markdown, setMarkdown] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/Public_Offer_Agreement.markdown')
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Публичная оферта</h1>
      <div className="space-y-6 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default OfferPage;
