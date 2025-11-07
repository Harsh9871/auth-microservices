import jwt from 'jsonwebtoken';

// ⚠️ CRITICAL: This must be the same everywhere
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-123';

console.log('JWT_SECRET loaded:', JWT_SECRET ? 'YES' : 'NO');

export const generateToken = (payload, expiresIn = '1h') => {
  console.log('🔐 Generating token with payload:', payload);
  try {
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn,
      algorithm: 'HS256' // Explicitly set algorithm
    });
    console.log('✅ Token generated successfully');
    return token;
  } catch (error) {
    console.error('❌ JWT Generation Error:', error);
    throw new Error('Token generation failed');
  }
};

export const verifyToken = (token) => {
  console.log('🔍 Verifying token:', token?.slice(0, 50) + '...');
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    console.log('✅ Token verified successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('❌ JWT Verification Error:', error.message);
    throw new Error('Invalid or expired token');
  }
};

export default { generateToken, verifyToken };