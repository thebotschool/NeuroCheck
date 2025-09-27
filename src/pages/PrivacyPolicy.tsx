import React from 'react';
import { useTranslation } from 'react-i18next';
import BackButton from "@/components/BackButton"

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <BackButton />

      <h1 className="text-3xl font-bold mb-6">{t('privacyPolicy.title')}</h1>

      <div className="space-y-6 text-gray-800">
        <p>
          {t('privacyPolicy.section1.text')}
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>{t('privacyPolicy.section1.item1')}</li>
            <li>{t('privacyPolicy.section1.item2')}</li>
          </ul>
        </p>

        <p>
          {t('privacyPolicy.section2.text')}
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>{t('privacyPolicy.section2.item1')}</li>
            <li>{t('privacyPolicy.section2.item2')}</li>
            <li>{t('privacyPolicy.section2.item3')}</li>
            <li>{t('privacyPolicy.section2.item4')}</li>
          </ul>
        </p>

        <p>{t('privacyPolicy.section3.text')}</p>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            {t('privacyPolicy.section4.title')}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{t('privacyPolicy.section4.item1')}</li>
            <li>{t('privacyPolicy.section4.item2')}</li>
            <li>{t('privacyPolicy.section4.item3')}</li>
            <li>{t('privacyPolicy.section4.item4')}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            {t('privacyPolicy.section5.title')}
          </h2>
          <p>
            {t('privacyPolicy.section5.text1')}
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>{t('privacyPolicy.section5.item1')}</li>
              <li>{t('privacyPolicy.section5.item2')}</li>
              <li>{t('privacyPolicy.section5.item3')}</li>
              <li>{t('privacyPolicy.section5.item4')}</li>
            </ul>
          </p>
          <p className="mt-4">{t('privacyPolicy.section5.text2')}</p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">
            {t('privacyPolicy.sources.title')}
          </h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Barkley, R. A. (1997). Behavioral inhibition, sustained attention, and executive functions. Psychological Bulletin.</li>
            <li>Conners, C. K. (2015). Conners' Continuous Performance Test II.</li>
            <li>Epstein, J. N., et al. (2003). Variability in ADHD: A meta-analysis of EEG power. Journal of Attention Disorders.</li>
            <li>Rubia, K., et al. (2001). The role of inferior frontal cortex in Go/No-Go tasks. NeuroImage.</li>
            <li>Liddle, P. F., et al. (2009). Functional connectivity and cognitive control. Cerebral Cortex.</li>
            <li>Baddeley, A. D., & Hitch, G. (1974). Working memory. Psychology of Learning and Motivation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
