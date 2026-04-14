const prisma = require("../db/client");

// Generic RBAC Gatekeeper
const authorize = (...roles) => {
  return (req, res, next) => {
    // We check req.userRole assigned by resolveProjectRole
    // Or magically req.user.role if it was ever formatted as an object later
    const userRole = req.userRole || (req.user && req.user.role);
    
    if (!userRole) {
      return res.status(403).json({ error: "Forbidden: No role found for this user in this context" });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden: You do not have the required permissions" });
    }
    
    next();
  };
};

// Resource-specific Role Resolver for Projects
const resolveProjectRole = async (req, res, next) => {
  try {
    const projectId = req.params?.id || req.body?.projectId || req.params?.projectId || req.query?.projectId;
    // req.user is a string in the current state of protect middleware
    const userId = typeof req.user === 'object' ? req.user.id : req.user;
    
    if (!projectId || !userId) {
       // Proceed blindly; let the controller or generic validation handle missing fields instead of throwing an unhandled auth error
       return next();
    }

    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId }
    });

    // We securely attach the role to the request object uniquely
    req.userRole = membership ? membership.role : null;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authorize, resolveProjectRole };
