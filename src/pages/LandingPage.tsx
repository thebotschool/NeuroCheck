import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <main className="flex-grow px-6 py-12 space-y-24">
        {/* Hero Section */}
        <section className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            NeuroCheck — цифровое исследование учебных функций школьника
          </h1>
          <p className="text-lg text-gray-600">
            Помогаем понять, как работают внимание, самоконтроль и память — за 15 минут, без сложного оборудования и без присутствия специалистов.
          </p>
          <Button className="text-lg px-6 py-4" onClick={() => navigate('/access')}>Начать тест</Button>
          
        </section>

        {/* Для кого */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">Для кого</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Родителям</h3>
                <p className="text-gray-700">Которые хотят разобраться, почему учёба даётся легко или трудно, и как поддержать ребёнка.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Учителям и школам</h3>
                <p className="text-gray-700">Которые ищут способы повысить учебную продуктивность класса или отдельных учеников.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Психологам и тьюторам</h3>
                <p className="text-gray-700">Которые используют данные о когнитивных функциях для индивидуальной работы с детьми.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Как это работает */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">Как это работает</h2>
          <p className="text-center text-gray-600">В основе — три научно обоснованных задания, изучающих ключевые механизмы, необходимые для успешной учёбы:</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card><CardContent className="p-6"><b>Внимание</b> — способность сосредотачиваться и удерживать фокус.</CardContent></Card>
            <Card><CardContent className="p-6"><b>Самоконтроль</b> — умение сдерживать импульсы и действовать обдуманно.</CardContent></Card>
            <Card><CardContent className="p-6"><b>Рабочая память</b> — возможность удерживать и использовать информацию в процессе решения задач.</CardContent></Card>
          </div>
          <p className="text-center text-sm text-gray-500">Всего 3 задания по 2 минуты, с короткими паузами между ними. Всё проходит онлайн, ребёнок выполняет самостоятельно.</p>
        </section>

        {/* Что вы получите */}
        <section className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-2xl font-semibold">Что вы получите</h2>
          <p className="text-gray-600">После прохождения вы получите PDF-отчёт, в котором:</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xl text-gray-700 space-y-2">
            <li>Чётко описаны сильные стороны и зоны для развития ребёнка.</li>
            <li>Даны персональные рекомендации для дома и школы:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>как организовать учебную среду;</li>
                <li>какие упражнения и игры помогут укрепить навыки;</li>
                <li>как поддерживать мотивацию и внимание.</li>
              </ul>
            </li>
            <li>Отмечены особенности, которые стоит учитывать в учёбе и повседневной жизни.</li>
          </ul>
          <div className="flex justify-center gap-4 mt-6">
            <Button asChild variant="outline">
              <Link to="/example-report">Пример отчета</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/validation">Научное подтверждение</Link>
            </Button>
          </div>
        </section>

        

        {/* Почему это важно */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">Почему это важно</h2>
          <p className="text-center text-gray-600">Учебный успех напрямую связан с качеством работы внимания, самоконтроля и памяти. Понимание этих процессов позволяет:</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xl text-gray-700 space-y-2">
            <li><b>родителям</b> — создать комфортные условия для учёбы дома;</li>
            <li><b>учителям</b> — эффективнее взаимодействовать с учеником;</li>
            <li><b>специалистам</b> — строить целевые программы развития.</li>
          </ul>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <Button className="text-lg px-8 py-4" onClick={() => navigate('/access')}>Пройти диагностику</Button>
          
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}