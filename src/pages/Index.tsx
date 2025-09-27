import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t('index.title')}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('index.subtitle')}
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-white font-semibold shadow hover:opacity-90 transition"
        >
          {t('index.start')}
        </Link>
      </div>
    </div>
  );
};

export default Index;
