import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import VoiceAssistant from "@/components/VoiceAssistant";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import WasteHistoryPage from "./pages/WasteHistoryPage";
import CityRankingPage from "./pages/CityRankingPage";
import RedeemPage from "./pages/RedeemPage";
import ReportPage from "./pages/ReportPage";
import AwarenessPage from "./pages/AwarenessPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/waste-history" element={<WasteHistoryPage />} />
            <Route path="/city-ranking" element={<CityRankingPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/awareness" element={<AwarenessPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VoiceAssistant />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
