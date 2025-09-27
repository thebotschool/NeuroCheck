import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from "react-i18next";
import BackButton from "@/components/BackButton"

const OfferPage = () => {
  const [markdown, setMarkdown] = useState('');

  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Определяем суффикс файла на основе текущего языка
    let langSuffix = i18n.language; // 'ru', 'en', 'az', 'he'

    // Если нужно, добавьте fallback, если язык не поддерживается
    if (!['ru', 'en', 'az', 'he'].includes(langSuffix)) {
      langSuffix = 'ru'; // Fallback на русский
    }

    // Формируем путь к файлу
    fetch(`/data/${langSuffix}/Public_Offer_Agreement_${langSuffix}.md`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('File not found');
        }
        return response.text();
      })
      .then((text) => setMarkdown(text))
      .catch((error) => {
        console.error('Error loading markdown:', error);
        setMarkdown(''); // Или загрузите fallback-файл
      });
  }, [i18n.language]); // Добавляем зависимость от i18n.language, чтобы перезагружать при смене языка


  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
        <BackButton/>
      <h1 className="text-3xl font-bold mb-6">{t("offer.public-offer")}</h1>
      <div className="space-y-6 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
};

export default OfferPage;
