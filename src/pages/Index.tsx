import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">PROdetej — экспресс‑скрининг</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Современные когнитивные тесты: внимание (CPT), самоконтроль (Go/No-Go), рабочая память
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-white font-semibold shadow hover:opacity-90 transition"
        >
          Начать
        </Link>
      </div>
    </div>
  );
};

export default Index;
