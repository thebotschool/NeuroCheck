import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function PublicOfferPage() {
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    fetch('/Public_Offer_Agreement.markdown')
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="prose max-w-4xl mx-auto p-8">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
