import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/AuthProvider';
import { ScrollToTop } from '@/components/ScrollToTop';
import { EcomLayout } from '@/components/EcomLayout';
import { Toaster } from '@/components/ui/toaster';

/* Authentification */
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

/* Accueil, réglages, erreur */
import Home from '@/pages/Home';
import Settings from '@/pages/Settings';
import PageNotFound from '@/pages/PageNotFound';

/* Antoine · Responsable */
import Roadmap from '@/pages/Roadmap';
import MilestoneTracker from '@/pages/MilestoneTracker';
import DailyChallenge from '@/pages/DailyChallenge';
import Diagnosis from '@/pages/Diagnosis';
import ScaleChecker from '@/pages/ScaleChecker';

/* Rémi · Marketing */
import WinningProducts from '@/pages/WinningProducts';
import CompetitorSpy from '@/pages/CompetitorSpy';
import ShopifyScanner from '@/pages/ShopifyScanner';
import AdAngles from '@/pages/AdAngles';
import AdAnalyser from '@/pages/AdAnalyser';
import AdBudgetPlanner from '@/pages/AdBudgetPlanner';
import PromoOffers from '@/pages/PromoOffers';
import UpsellOffers from '@/pages/UpsellOffers';

/* Claire · Contenu & Rédaction */
import AdCopy from '@/pages/AdCopy';
import CreativeBriefs from '@/pages/CreativeBriefs';
import EmailSequence from '@/pages/EmailSequence';
import ProductOptimizer from '@/pages/ProductOptimizer';
import BrandName from '@/pages/BrandName';

/* Samuel · Service Client */
import CommunicationAssistant from '@/pages/CommunicationAssistant';
import TrustBuilder from '@/pages/TrustBuilder';
import CustomerAvatar from '@/pages/CustomerAvatar';
import StoreTips from '@/pages/StoreTips';

/* Camille · Réseaux Sociaux */
import ContentPlanner from '@/pages/ContentPlanner';
import InfluencerScripts from '@/pages/InfluencerScripts';

/* Maxime · Comptabilité */
import ProfitCalculator from '@/pages/ProfitCalculator';
import ProductFinance from '@/pages/ProductFinance';
import PricingRecommender from '@/pages/PricingRecommender';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function AuthenticatedApp() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Application */}
      <Route element={<EcomLayout />}>
        <Route path="/" element={<Home />} />

        {/* Antoine */}
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/etapes" element={<MilestoneTracker />} />
        <Route path="/defi-du-jour" element={<DailyChallenge />} />
        <Route path="/diagnostic" element={<Diagnosis />} />
        <Route path="/scale-checker" element={<ScaleChecker />} />

        {/* Rémi */}
        <Route path="/produits-gagnants" element={<WinningProducts />} />
        <Route path="/espionnage-concurrents" element={<CompetitorSpy />} />
        <Route path="/scanner-shopify" element={<ShopifyScanner />} />
        <Route path="/angles-publicitaires" element={<AdAngles />} />
        <Route path="/analyseur-pubs" element={<AdAnalyser />} />
        <Route path="/budget-publicitaire" element={<AdBudgetPlanner />} />
        <Route path="/offres-promos" element={<PromoOffers />} />
        <Route path="/offres-supplementaires" element={<UpsellOffers />} />

        {/* Claire */}
        <Route path="/textes-publicitaires" element={<AdCopy />} />
        <Route path="/briefs-creatifs" element={<CreativeBriefs />} />
        <Route path="/emails" element={<EmailSequence />} />
        <Route path="/optimiseur-produit" element={<ProductOptimizer />} />
        <Route path="/generateur-marque" element={<BrandName />} />

        {/* Samuel */}
        <Route path="/communication" element={<CommunicationAssistant />} />
        <Route path="/trust-builder" element={<TrustBuilder />} />
        <Route path="/avatar-client" element={<CustomerAvatar />} />
        <Route path="/conseils-boutique" element={<StoreTips />} />

        {/* Camille */}
        <Route path="/contenu-organique" element={<ContentPlanner />} />
        <Route path="/influenceurs-ugc" element={<InfluencerScripts />} />

        {/* Maxime */}
        <Route path="/calculateur-benefices" element={<ProfitCalculator />} />
        <Route path="/marge-produit" element={<ProductFinance />} />
        <Route path="/prix-livraison" element={<PricingRecommender />} />

        <Route path="/parametres" element={<Settings />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  // Thème sombre permanent.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <AuthenticatedApp />
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
