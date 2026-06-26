const getAuditContext = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
});

export { getAuditContext };
