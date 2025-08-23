import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const OfferPage = () => {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch('/Public_Offer_Agreement.markdown')
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Публичная оферта</h1>
      <div className="space-y-6 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default OfferPage;
