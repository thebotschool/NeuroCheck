import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18next";
import LandingPage from "./pages/LandingPage";
import NeuroCheck from "./pages/NeuroCheck";
import PaymentPage from "./pages/PaymentPage";
import SuccessPage from "./pages/SuccessPage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AdminPage from "./pages/AdminPage";
import AccessPage from "./pages/AccessPage";
import OfferPage from "./pages/OfferPage";
import ReportPage from "./pages/ReportPage";
import ExampleReportPage from "./pages/ExampleReportPage";
import ValidationPage from "./pages/ValidationPage";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/test" element={<NeuroCheck />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/report/:id" element={<ReportPage />} />
            <Route path="/example-report" element={<ExampleReportPage />} />
            <Route path="/validation" element={<ValidationPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nextProvider>
  </QueryClientProvider>
);

export default App;