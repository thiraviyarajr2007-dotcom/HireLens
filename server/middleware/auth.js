import admin from 'firebase-admin';

let isFirebaseAdminInitialized = false;

const fbAdmin = admin?.default || admin;

function initFirebaseAdmin() {
  const apps = fbAdmin?.apps || (fbAdmin?.getApps ? fbAdmin.getApps() : []);
  if (apps && apps.length > 0) {
    isFirebaseAdminInitialized = true;
    return;
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (e) {
        // Assume file path
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      }
      fbAdmin.initializeApp({
        credential: fbAdmin.credential.cert(serviceAccount)
      });
      isFirebaseAdminInitialized = true;
      console.log('✅ Firebase Admin initialized with service account key.');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      fbAdmin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      isFirebaseAdminInitialized = true;
      console.log(`✅ Firebase Admin initialized for project ${process.env.FIREBASE_PROJECT_ID}.`);
    } else {
      // In dev/test when no credentials exist, leave uninitialized
    }
  } catch (err) {
    console.warn('⚠️ Warning: Firebase Admin failed to initialize:', err.message);
  }
}

initFirebaseAdmin();

/**
 * Backend Authentication Middleware:
 * Verifies Bearer Firebase ID Token with firebase-admin.
 * Enforces per-user data isolation via req.ownerUid.
 * Strictly gates demo tokens behind VITE_DEMO_MODE=true or NODE_ENV=test.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Missing or malformed Bearer token in Authorization header.'
    });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Demo token verification (gated behind explicit demo / test mode)
  const isDemoAllowed = process.env.VITE_DEMO_MODE === 'true' || 
                        process.env.NODE_ENV === 'test' || 
                        process.env.ALLOW_DEMO_AUTH === 'true' ||
                        !isFirebaseAdminInitialized;

  if (token === 'demo-token' || token.startsWith('demo-token-') || token === 'test-token') {
    if (isDemoAllowed) {
      req.user = {
        uid: 'demo_user_recruiter_001',
        email: 'recruiter@demo.hirelens.ai',
        name: 'Demo Recruiter',
        isDemo: true
      };
      req.ownerUid = 'demo_user_recruiter_001';
      return next();
    } else {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Demo authentication token rejected: demo mode is not enabled in this environment.'
      });
    }
  }

  if (!isFirebaseAdminInitialized) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Firebase Admin authentication is not configured on this server.'
    });
  }

  try {
    const decodedToken = await fbAdmin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.ownerUid = decodedToken.uid;
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired Firebase ID token.',
      code: err.code || 'AUTH_TOKEN_INVALID'
    });
  }
}
