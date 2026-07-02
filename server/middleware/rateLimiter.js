const ipRequests = new Map();

// Clean up expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000); // run clean up every 5 minutes

export const resetPasswordRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const timeframe = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  if (!ipRequests.has(ip)) {
    ipRequests.set(ip, { count: 1, resetTime: now + timeframe });
    return next();
  }

  const record = ipRequests.get(ip);
  
  if (now > record.resetTime) {
    // Reset window
    record.count = 1;
    record.resetTime = now + timeframe;
    return next();
  }

  record.count++;
  
  if (record.count > maxRequests) {
    const minutesLeft = Math.ceil((record.resetTime - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many password reset requests. Please try again in ${minutesLeft} minutes.`
    });
  }

  next();
};
