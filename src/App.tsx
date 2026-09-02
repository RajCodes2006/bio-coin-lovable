import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import VoiceAssistant from "@/components/VoiceAssistant";
import ProtectedRoute from "@/components/ProtectedRoute";
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
            <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/waste-history" element={<ProtectedRoute><WasteHistoryPage /></ProtectedRoute>} />
            <Route path="/city-ranking" element={<ProtectedRoute><CityRankingPage /></ProtectedRoute>} />
            <Route path="/redeem" element={<ProtectedRoute><RedeemPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/awareness" element={<ProtectedRoute><AwarenessPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <VoiceAssistant />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
