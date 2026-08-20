import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import ProcessingPage from './pages/ProcessingPage';
import CandidateAnalysisPage from './pages/CandidateAnalysisPage';
import EvidenceExplorerPage from './pages/EvidenceExplorerPage';
import RankingsPage from './pages/RankingsPage';
import CandidatesPage from './pages/CandidatesPage';
import ComparisonPage from './pages/ComparisonPage';
import BulkAnalyzePage from './pages/BulkAnalyzePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

import { INITIAL_CANDIDATES, MOCK_HISTORY } from './data/mockData';
import { analyzeResume, matchCandidateProfile } from './services/analysisEngine';
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

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
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
        // Backend fallback
      }

      try {
        const fetchedHistory = await fetchHistoryApi();
        if (fetchedHistory && Array.isArray(fetchedHistory)) {
          setHistoryList(fetchedHistory);
        }
      } catch (err) {
        // Backend fallback
      }
    }
    loadBackendData();
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Start single resume analysis
  const handleStartAnalysis = (file, jobDescription) => {
    setPendingAnalysis({ file, jobDescription, mode: 'single' });
    navigate('/analyze/processing');
  };

  // Start bulk resume analysis
  const handleStartBulkAnalysis = (files, jobDescription) => {
    setPendingAnalysis({ files, jobDescription, mode: 'bulk' });
    navigate('/analyze/processing');
  };

  // Complete analysis pipeline
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
        return;
      } catch (err) {
        console.warn('Backend API unavailable, executing client engine fallback:', err.message);
      }

      // Fallback
      let updatedCandidates = [...candidates];
      const newHistoryItems = [];

      (pendingAnalysis.files || []).forEach((file) => {
        const rawExtraction = analyzeResume(file, `Resume text for ${file.name}`, pendingAnalysis.jobDescription);
        const { candidate, isExisting } = matchCandidateProfile(rawExtraction, updatedCandidates);

        if (isExisting) {
          updatedCandidates = updatedCandidates.map(c => c.id === candidate.id ? candidate : c);
        } else {
          updatedCandidates = [candidate, ...updatedCandidates];
        }

        newHistoryItems.push({
          id: "hist-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          candidateId: candidate.id,
          candidateName: candidate.name,
          role: candidate.role,
          fitScore: candidate.fitScore,
          date: new Date().toISOString().split('T')[0],
          status: isExisting ? "Profile Updated" : "Completed"
        });
      });

      setCandidates(updatedCandidates);
      setHistoryList((prev) => [...newHistoryItems, ...prev]);
      setPendingAnalysis(null);
      navigate('/rankings');
    } else {
      let resultCandidate = null;

      try {
        const apiResult = await analyzeSingleResumeApi(pendingAnalysis.file, pendingAnalysis.jobDescription);
        resultCandidate = apiResult.candidate;

        const updatedCand = await fetchCandidatesApi();
        setCandidates(updatedCand);

        const updatedHist = await fetchHistoryApi();
        setHistoryList(updatedHist);

        setPendingAnalysis(null);
        navigate(`/candidate/${resultCandidate.id}`);
        return;
      } catch (err) {
        console.warn('Backend API unavailable, executing client engine fallback:', err.message);
      }

      // Fallback
      const rawExtraction = analyzeResume(
        pendingAnalysis.file,
        `Resume content extracted from ${pendingAnalysis.file?.name || 'Resume.pdf'}`,
        pendingAnalysis.jobDescription
      );

      const { candidate, isExisting } = matchCandidateProfile(rawExtraction, candidates);

      if (isExisting) {
        setCandidates((prev) => prev.map(c => c.id === candidate.id ? candidate : c));
      } else {
        setCandidates((prev) => [candidate, ...prev]);
      }

      setHistoryList((prev) => [
        {
          id: "hist-" + Date.now(),
          candidateId: candidate.id,
          candidateName: candidate.name,
          role: candidate.role,
          fitScore: candidate.fitScore,
          date: new Date().toISOString().split('T')[0],
          status: isExisting ? "Profile Updated" : "Completed"
        },
        ...prev
      ]);

      setPendingAnalysis(null);
      navigate(`/candidate/${candidate.id}`);
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
      const isEvidence = parts[3] === 'evidence';
      return { route: isEvidence ? '/candidate/evidence' : '/candidate', candidateId, fieldParam };
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

  // Render view by route
  const renderView = () => {
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
        return <ProcessingPage pendingAnalysis={pendingAnalysis} onCompleteAnalysis={handleCompleteAnalysis} {...commonProps} />;

      case '/candidate':
        return <CandidateAnalysisPage candidate={selectedCandidate} {...commonProps} />;

      case '/candidate/evidence':
        return <EvidenceExplorerPage candidate={selectedCandidate} initialFieldId={fieldParam} {...commonProps} />;

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
      {renderView()}
    </div>
  );
}
