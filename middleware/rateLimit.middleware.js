const clients = new Map();

export const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 3; // 3 requests per minute per client

  if (!clients.has(ip)) {
    clients.set(ip, []);
  }

  const requests = clients.get(ip).filter(ts => now - ts < windowMs);
  requests.push(now);
  clients.set(ip, requests);

  if (requests.length > limit) {
    return res.status(429).json({ message: "Rate limit exceeded." });
  }

  next();
};
