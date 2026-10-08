import React, { useState, useEffect, Suspense, lazy } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Lazy-load dashboard and analytical pages (Phase 5 bundle optimization)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'));
const ProcessingPage = lazy(() => import('./pages/ProcessingPage'));
const CandidateAnalysisPage = lazy(() => import('./pages/CandidateAnalysisPage'));
const EvidenceExplorerPage = lazy(() => import('./pages/EvidenceExplorerPage'));
const RankingsPage = lazy(() => import('./pages/RankingsPage'));
const CandidatesPage = lazy(() => import('./pages/CandidatesPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const BulkAnalyzePage = lazy(() => import('./pages/BulkAnalyzePage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AiAuditPage = lazy(() => import('./pages/AiAuditPage'));

import { INITIAL_CANDIDATES, MOCK_HISTORY } from './data/mockData';
import { 
  analyzeSingleResumeApi, 
  analyzeBulkResumesApi, 
  fetchCandidatesApi, 
  fetchHistoryApi 
} from './services/apiClient';

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
  const [historyList, setHistoryList] = useState(MOCK_HISTORY);
  const [pendingAnalysis, setPendingAnalysis] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [analysisError, setAnalysisError] = useState(null);

  // Router state
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPath(hash || '/');
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Firebase Auth listener + Demo user session recovery
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const isDemo = localStorage.getItem('hirelens_demo_user');
        if (isDemo) {
          setUser({
            uid: 'demo_user_recruiter_001',
            displayName: 'Demo Recruiter (Sandbox)',
            email: 'recruiter@demo.hirelens.ai',
            isDemo: true,
            getIdToken: async () => 'demo-token-recruiter'
          });
        } else {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('hirelens_demo_user');
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
    setUser(null);
    navigate('/login');
  };

  // Fetch initial candidates and history from backend REST API
  useEffect(() => {
    async function loadBackendData() {
      try {
        const fetchedCandidates = await fetchCandidatesApi();
        if (fetchedCandidates && Array.isArray(fetchedCandidates)) {
          setCandidates(fetchedCandidates);
        }
      } catch (err) {
        // Backend not yet populated
      }

      try {
        const fetchedHistory = await fetchHistoryApi();
        if (fetchedHistory && Array.isArray(fetchedHistory)) {
          setHistoryList(fetchedHistory);
        }
      } catch (err) {
        // Backend not yet populated
      }
    }
    if (user) {
      loadBackendData();
    }
  }, [user]);

  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Start single resume analysis with runId for real SSE tracking (B16 fix)
  const handleStartAnalysis = (file, jobDescription) => {
    setAnalysisError(null);
    const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setPendingAnalysis({ file, jobDescription, mode: 'single', runId });
    navigate('/analyze/processing');
  };

  // Start bulk resume analysis
  const handleStartBulkAnalysis = (files, jobDescription) => {
    setAnalysisError(null);
    const runId = 'run_bulk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    setPendingAnalysis({ files, jobDescription, mode: 'bulk', runId });
    navigate('/analyze/processing');
  };

  // Complete analysis pipeline (strictly calls real backend with runId, no fake client fallbacks)
  const handleCompleteAnalysis = async () => {
    if (!pendingAnalysis) {
      navigate('/dashboard');
      return;
    }

    if (pendingAnalysis.mode === 'bulk') {
      try {
        const apiResult = await analyzeBulkResumesApi(pendingAnalysis.files, pendingAnalysis.jobDescription);
        if (apiResult.candidates) {
          setCandidates(apiResult.candidates);
        }
        const updatedHist = await fetchHistoryApi();
        setHistoryList(updatedHist);
        setPendingAnalysis(null);
        navigate('/rankings');
      } catch (err) {
        console.error('Bulk analysis service error:', err);
        setAnalysisError(err.message || 'Unable to connect to analysis service.');
      }
    } else {
      try {
        const apiResult = await analyzeSingleResumeApi(
          pendingAnalysis.file, 
          pendingAnalysis.jobDescription, 
          null, 
          pendingAnalysis.runId
        );
        const resultCandidate = apiResult.candidate;

        const updatedCand = await fetchCandidatesApi();
        setCandidates(updatedCand);

        const updatedHist = await fetchHistoryApi();
        setHistoryList(updatedHist);

        setPendingAnalysis(null);
        navigate(`/candidate/${resultCandidate.id}`);
      } catch (err) {
        console.error('Analysis service error:', err);
        setAnalysisError(err.message || 'Unable to connect to analysis service.');
      }
    }
  };

  // Extract route parameters
  const getRouteInfo = () => {
    const raw = currentPath.split('?')[0];
    const queryStr = currentPath.split('?')[1] || '';
    const searchParams = new URLSearchParams(queryStr);
    const fieldParam = searchParams.get('field');

    if (raw.startsWith('/candidate/')) {
      const parts = raw.split('/');
      const candidateId = parts[2];
      const sub = parts[3];
      if (sub === 'evidence') {
        return { route: '/candidate/evidence', candidateId, fieldParam };
      }
      if (sub === 'audit') {
        return { route: '/candidate/audit', candidateId, fieldParam };
      }
      return { route: '/candidate', candidateId, fieldParam };
    }

    return { route: raw, candidateId: null, fieldParam };
  };

  const { route, candidateId, fieldParam } = getRouteInfo();

  // Find target candidate
  const selectedCandidate = candidates.find(c => c.id === candidateId) || candidates[0];

  // Common page props
  const commonProps = {
    onNavigate: navigate,
    mobileOpen,
    setMobileOpen,
    user,
    onSignOut: handleSignOut
  };

  // Render view by route with Route Guard (B12 fix)
  const renderView = () => {
    const publicRoutes = ['/', '/login', '/signup', '/forgot-password'];
    if (!publicRoutes.includes(route) && !user) {
      return <LoginPage onNavigate={navigate} initialMode="login" onAuthSuccess={(u) => setUser(u)} />;
    }

    switch (route) {
      case '/':
        return <LandingPage onNavigate={navigate} user={user} onSignOut={handleSignOut} />;

      case '/login':
        return <LoginPage onNavigate={navigate} initialMode="login" onAuthSuccess={(u) => setUser(u)} />;

      case '/signup':
        return <LoginPage onNavigate={navigate} initialMode="signup" onAuthSuccess={(u) => setUser(u)} />;

      case '/forgot-password':
        return <LoginPage onNavigate={navigate} initialMode="forgot" onAuthSuccess={(u) => setUser(u)} />;

      case '/dashboard':
        return <DashboardPage candidates={candidates} {...commonProps} />;

      case '/analyze':
        return <AnalyzePage onStartAnalysis={handleStartAnalysis} {...commonProps} />;

      case '/analyze/processing':
        return (
          <ProcessingPage 
            pendingAnalysis={pendingAnalysis} 
            onCompleteAnalysis={handleCompleteAnalysis} 
            analysisError={analysisError}
            onClearError={() => setAnalysisError(null)}
            {...commonProps} 
          />
        );

      case '/candidate':
        return <CandidateAnalysisPage candidate={selectedCandidate} {...commonProps} />;

      case '/candidate/evidence':
        return <EvidenceExplorerPage candidate={selectedCandidate} initialFieldId={fieldParam} {...commonProps} />;

      case '/candidate/audit':
        return <AiAuditPage candidate={selectedCandidate} {...commonProps} />;

      case '/candidates':
        return <CandidatesPage candidates={candidates} {...commonProps} />;

      case '/rankings':
        return <RankingsPage candidates={candidates} {...commonProps} />;

      case '/comparison':
        return <ComparisonPage candidates={candidates} {...commonProps} />;

      case '/bulk-analyze':
        return <BulkAnalyzePage onStartBulkAnalysis={handleStartBulkAnalysis} {...commonProps} />;

      case '/history':
        return <HistoryPage historyList={historyList} {...commonProps} />;

      case '/settings':
        return <SettingsPage {...commonProps} />;

      default:
        return <LandingPage onNavigate={navigate} user={user} onSignOut={handleSignOut} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-slate-500">Loading HireLens...</span>
          </div>
        </div>
      }>
        {renderView()}
      </Suspense>
    </div>
  );
}
