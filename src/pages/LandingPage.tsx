import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useTranslation } from "react-i18next";

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header />
      <main className="flex-grow px-6 py-12 space-y-24">
        {/* Hero Section */}
        <section className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            {t("landing.title")}
          </h1>
          <p className="text-lg text-gray-600">{t("landing.slogan")}</p>
          <Button
            className="text-lg px-6 py-4"
            onClick={() => navigate("/access")}
          >
            {t("landing.start-test")}
          </Button>
        </section>

        {/* Для кого */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            {t("landing.for-whom.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">
                  {t("landing.for-whom.parents.title")}
                </h3>
                <p className="text-gray-700">
                  {t("landing.for-whom.parents.text")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">
                  {t("landing.for-whom.teachers.title")}
                </h3>
                <p className="text-gray-700">
                  {t("landing.for-whom.teachers.text")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">
                  {t("landing.for-whom.psychologists.title")}
                </h3>
                <p className="text-gray-700">
                  {t("landing.for-whom.psychologists.text")}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Как это работает */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            {t("landing.how-it-works.title")}
          </h2>
          <p className="text-center text-gray-600">
            {t("landing.how-it-works.description")}
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <Card>
              <CardContent className="p-6">
                <b>{t("landing.how-it-works.attention.title")}</b>{" "}
                {t("landing.how-it-works.attention.text")}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <b>{t("landing.how-it-works.selfcontrol.title")}</b>{" "}
                {t("landing.how-it-works.selfcontrol.text")}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <b>{t("landing.how-it-works.memory.title")}</b>{" "}
                {t("landing.how-it-works.memory.text")}
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-sm text-gray-500">
            {t("landing.how-it-works.smalltext")}
          </p>
        </section>

        {/* Что вы получите */}
        <section className="max-w-4xl mx-auto space-y-6 text-center">
          <h2 className="text-2xl font-semibold">
            {t("landing.what-you-get.title")}
          </h2>
          <p className="text-gray-600">{t("landing.what-you-get.description")}</p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xl text-gray-700 space-y-2">
            <li>{t("landing.what-you-get.item1")}</li>
            <li>
              {t("landing.what-you-get.item2")}
              <ul className="list-disc list-inside ml-6 mt-2">
                <li>{t("landing.what-you-get.item2-1")}</li>
                <li>{t("landing.what-you-get.item2-2")}</li>
                <li>{t("landing.what-you-get.item2-3")}</li>
              </ul>
            </li>
            <li>{t("landing.what-you-get.item3")}</li>
          </ul>
          <div className="flex justify-center gap-4 mt-6">
            <Button asChild variant="outline">
              <Link to="/example-report">{t("landing.buttons.example-report")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/validation">
                {t("landing.buttons.scientific-validation")}
              </Link>
            </Button>
          </div>
        </section>

        {/* Почему это важно */}
        <section className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold text-center">
            {t("landing.why-important.title")}
          </h2>
          <p className="text-center text-gray-600">
            {t("landing.why-important.description")}
          </p>
          <ul className="list-disc list-inside text-left mx-auto max-w-xl text-gray-700 space-y-2">
            <li>
              <strong>{t("landing.why-important.parents.label")}</strong> — {t("landing.why-important.parents.text")}
            </li>
            <li>
              <strong>{t("landing.why-important.teachers.label")}</strong> — {t("landing.why-important.teachers.text")}
            </li>
            <li>
              <strong>{t("landing.why-important.specialists.label")}</strong> — {t("landing.why-important.specialists.text")}
            </li>
          </ul>
        </section>


        {/* Final CTA */}
        <section className="text-center">
          <Button
            className="text-lg px-8 py-4"
            onClick={() => navigate("/access")}
          >
            {t("landing.final-cta")}
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
