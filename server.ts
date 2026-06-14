import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Firebase Config to verify tokens in production
let hasRealFirebase = false;
let firebaseProjectId = '';
try {
  const configPath = path.join(process.cwd(), 'src', 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const apiKey = process.env.VITE_FIREBASE_API_KEY || config.apiKey;
    firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || config.projectId;
    if (apiKey && !apiKey.includes('placeholder') && !apiKey.includes('mock') && apiKey !== '') {
      hasRealFirebase = true;
    }
  }
} catch (e) {
  console.error('Failed to load firebase config on server:', e);
}

// In-memory cache for Google public certificates to avoid fetching on every request
let googleCertificates: Record<string, string> | null = null;
let certsExpiryTime = 0;

async function getGooglePublicKeys(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (googleCertificates && now < certsExpiryTime) {
    return googleCertificates;
  }
  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    const data = await res.json() as Record<string, string>;
    googleCertificates = data;
    // Cache for 1 hour
    certsExpiryTime = now + 3600 * 1000;
    return googleCertificates;
  } catch (error) {
    console.error('Failed to fetch Google public keys:', error);
    return null;
  }
}

// Verify Firebase ID Token cryptographically using Node's native crypto module
async function verifyFirebaseToken(token: string, projectId: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header & payload using base64url decoding (native in Node.js 14+)
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Check expiration
    const nowInSecs = Math.floor(Date.now() / 1000);
    if (payload.exp < nowInSecs) {
      console.warn('Firebase Token verification warning: Token has expired.');
      return null;
    }

    // Check audience
    if (payload.aud !== projectId) {
      console.warn('Firebase Token verification warning: Audience mismatch.');
      return null;
    }

    // Check issuer
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
      console.warn('Firebase Token verification warning: Issuer mismatch.');
      return null;
    }

    // Verify signature
    const keys = await getGooglePublicKeys();
    if (!keys) return null;

    const kid = header.kid;
    const cert = keys[kid];
    if (!cert) {
      console.warn('Firebase Token verification warning: Valid signature certificate index not found.');
      return null;
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    
    const isValid = verifier.verify(cert, signatureB64, 'base64url');
    if (!isValid) {
      console.warn('Firebase Token verification warning: Cryptographic signature mismatch.');
      return null;
    }

    return payload; 
  } catch (e) {
    console.error('Error during token decoding/verification:', e);
    return null;
  }
}

// Lazy-loaded Gemini AI client
let aiClient: any = null;
function getGeminiClient(): any {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// AI Recommendation proxy endpoint
// ----------------------------------------------------
app.post('/api/recommendations', async (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  let isAuthorized = false;
  let userPayload: any = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (hasRealFirebase && firebaseProjectId) {
      userPayload = await verifyFirebaseToken(token, firebaseProjectId);
      if (userPayload) {
        isAuthorized = true;
      }
    } else {
      // In local development or guest bypass mode, allow guest credentials securely
      if (token === 'guest' || token.length > 10) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    return res.status(401).json({
      error: 'Unsecured connection blocked. Compliance login token required to retrieve automated advisory reports.',
      recommendations: []
    });
  }

  const { transportKm, transportType, electricityKwh, dietType, shoppingLevel } = req.body;

  const kwh = Number(electricityKwh) || 0;
  const km = Number(transportKm) || 0;

  // Formulate a robust response model
  try {
    const ai = getGeminiClient();

    const prompt = `You are a world-class smart environmental sustainability advisor for EcoTrack AI.
Given the following user daily carbon inputs:
- Transportation: ${km} km per day by ${transportType}
- Household/Utility: ${kwh} kWh of electricity per week
- Diet Choice: ${dietType}
- Shopping & Consumer Style: ${shoppingLevel}

Generate exactly 4 highly personalized, specific recommendations (one for each category: 'Transport', 'Electricity', 'Diet', 'Shopping').
Include actual practical alternatives. For example, instead of "Use public transport", say "Swap your gasoline car for public transit ${Math.ceil(km * 0.6)} km per day".
Calculate actual calculated estimates for:
1. co2Savings: Annual CO2 saved (in kg)
2. moneySavings: Annual money saved in rupees (e.g. ₹12,000 basis, return as a number)
3. impactText: Brief ecological reason (e.g. 1-2 sentences on how it affects forests/gases).

You MUST return your output strictly of a JSON array wrapping objects matching this TypeScript interface, without standard wrapping markdown or backticks:
interface AIRecommendation {
  category: string; // 'Transport' | 'Electricity' | 'Diet' | 'Shopping'
  headline: string; // Specific short recommendation title
  currentUsage: string; // e.g., "You currently travel ${km} km daily on petrol."
  actionableAlternative: string; // Clear behavioral swap suggestion
  co2Savings: number; // annual CO2 savings in kg (number)
  moneySavings: number; // annual financial savings in INR (integer number)
  impactText: string; // ecological context
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/^```json/, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(cleanJson);
    return res.json({ recommendations: parsed, isRealAI: true });

  } catch (error: any) {
    // Graceful fallback if GEMINI_API_KEY is not defined or the service has a glitch.
    // This allows the hackathon project to run perfectly out of the box!
    const mockRecommendations = [
      {
        category: 'Transport',
        headline: 'Optimize Commutes with Hybrid Modes',
        currentUsage: `You travel ${km} km daily by ${transportType.replace('_', ' ')}.`,
        actionableAlternative: `Switching to public transit or self-powered walking for just 3 days a week saves massive carbon debt.`,
        co2Savings: Math.round(km * 365 * 0.15 * 0.4),
        moneySavings: Math.round(km * 365 * 4.5 * 0.4),
        impactText: 'This directly minimizes regional nitrogen dioxide emissions and cuts down atmospheric smog particulate levels.'
      },
      {
        category: 'Electricity',
        headline: 'Audit Standby Appliance Loads',
        currentUsage: `Your household draws ${kwh} kWh of grid power weekly.`,
        actionableAlternative: 'Transitioning to smart plug strips and LED fixtures reduces household grid draw by 15%.',
        co2Savings: Math.round((kwh * 52 * 0.82) * 0.15),
        moneySavings: Math.round(kwh * 52 * 8 * 0.15),
        impactText: 'Relieves pressure on metropolitan thermal coal grids, preventing coal combustion ash emissions.'
      },
      {
        category: 'Diet',
        headline: 'Embrace Green Plant-to-Protein Substitutions',
        currentUsage: `You follow a ${dietType.replace('_', ' ')} diet plan.`,
        actionableAlternative: dietType === 'meat_heavy' 
          ? 'Swapping 3 beef/pork meals per week for plant-protein legumes cuts your agriculture impact by 40%.'
          : 'Further incorporating local seasonal vegetables prevents long-distance aviation transport footprint.',
        co2Savings: dietType === 'meat_heavy' ? 420 : 150,
        moneySavings: dietType === 'meat_heavy' ? 8400 : 3000,
        impactText: 'Substantially reduces farm methane gas release and decreases agricultural pesticide runoff into vital freshwater ways.'
      },
      {
        category: 'Shopping',
        headline: 'Support Circular and Pre-Owned Markets',
        currentUsage: `You have an active '${shoppingLevel}' consumption footprint.`,
        actionableAlternative: 'Rent or buy tech/fashion pre-owned. Extending appliance lifecycle by 2 years cuts resource harvesting.',
        co2Savings: shoppingLevel === 'extreme' ? 680 : 180,
        moneySavings: shoppingLevel === 'extreme' ? 24000 : 7000,
        impactText: 'Prevents industrial plastic dye dumps and landfills overflowing with hazardous electronic wastes.'
      }
    ];

    return res.json({ 
      recommendations: mockRecommendations, 
      isRealAI: false,
      tip: 'To activate live real-time Gemini recommendations, please set your GEMINI_API_KEY secret in AI Studio Settings > Secrets.' 
    });
  }
});

// Serve health status
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Configure Vite or Static delivery depending on environment
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev environment middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Serving compiled static assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupViteOrStatic().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoTrack AI Server] running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[EcoTrack AI Server] Failed to start:', err);
});
