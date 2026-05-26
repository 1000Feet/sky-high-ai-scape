import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClientSignup from "./pages/ClientSignup";
import SignupSuccess from "./pages/SignupSuccess";
import Admin from "./pages/Admin";
import OutboxPrivacyPolicy from "./pages/OutboxPrivacyPolicy";
import Ventures from "./pages/Ventures";
import NuoviMondi from "./pages/NuoviMondi";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<ClientSignup />} />
          <Route path="/signup/success" element={<SignupSuccess />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/outboxprivacypolicy" element={<OutboxPrivacyPolicy />} />
          <Route path="/ventures" element={<Ventures />} />
          <Route path="/nuovimondi" element={<NuoviMondi />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
