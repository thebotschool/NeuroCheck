import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const navigate = useNavigate();

  const start = () => {
    // navigate to the test flow (promo/payment step)
    navigate('/test');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-12 space-y-24">
      {/* Hero Section */}
      <section className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-bold leading-tight">
          NeuroCheck — цифровая диагностика учебных функций
        </h1>
        <p className="text-lg text-gray-600">
          Повышаем продуктивность: внимание, самоконтроль и память — всего за 6 минут, без специалистов.
        </p>
        <Button className="text-lg px-6 py-4" onClick={start}>Начать тест — бесплатно</Button>
      </section>

      {/* Who it's for */}
      <section className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Кому это поможет</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Родителям, которые не понимают, почему учеба идёт тяжело.</li>
            <li>Семьям, стремящимся сделать обучение продуктивнее и спокойнее.</li>
            <li>Тем, кто хочет понять, как работает внимание, самоконтроль и память у ребёнка.</li>
          </ul>
        </div>
        <Card>
          <CardContent className="p-6 text-gray-600">
            Короткий тест покажет зоны силы и развития — и даст PDF‑отчёт с персональными рекомендациями.
          </CardContent>
        </Card>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto space-y-6 text-center">
        <h2 className="text-2xl font-semibold">Как проходит диагностика</h2>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <Card><CardContent className="p-6">3 задания по 2 минуты: внимание, контроль, память</CardContent></Card>
          <Card><CardContent className="p-6">Между ними — короткие паузы на отдых</CardContent></Card>
          <Card><CardContent className="p-6">Ребёнок проходит самостоятельно, всё онлайн</CardContent></Card>
        </div>
      </section>

      {/* Report Example */}
      <section className="max-w-4xl mx-auto space-y-4 text-center">
        <h2 className="text-2xl font-semibold">Что будет в отчёте</h2>
        <p className="text-gray-600">
          Вы получите понятный PDF с обратной связью от психолога и чёткими советами:
        </p>
        <ul className="list-disc list-inside text-left mx-auto max-w-xl text-gray-700 space-y-2">
          <li>Для дома — как организовать задания и рутину</li>
          <li>Для школы — как лучше взаимодействовать и развивать навыки</li>
          <li>Сильные и уязвимые стороны ребёнка</li>
        </ul>
      </section>

      {/* Final CTA */}
      <section className="text-center">
        <Button className="text-lg px-8 py-4" onClick={start}>Пройти диагностику сейчас</Button>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm mt-16">
        <p>© 2025 NeuroCheck. Все права защищены.</p>
        <p>support@neurocheck.app</p>
      </footer>
    </div>
  );
}
