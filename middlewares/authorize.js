export const authorize = (roles = []) => {
    return (req, res, next) => {
      const userRole = req.user?.role;
      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({ error: "Access denied" });
      }
      next();
    };
  };
  