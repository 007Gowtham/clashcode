import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Authentication required: No token provided' });
    
    const token = header.replace('Bearer ', '').trim();
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'Authentication required: Invalid token format' });
    }

    const user = await User.findOne({ token });
    if (!user) return res.status(401).json({ error: 'Authentication failed: Session expired or invalid' });
    
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Auth error' });
  }
};
