const express = require("express");
const router = express.Router();
const tenantController = require("../controllers/tenantController");
const { auth } = require("../middlewares/auth");
const TenantMiddleware = require("../middlewares/tenantMiddleware");

// Test route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Tenant routes working",
    timestamp: new Date().toISOString()
  });
});

// Tenant management routes
router.post("/register", tenantController.register);
router.get("/current", tenantController.getCurrentTenant);
router.put("/current", auth, TenantMiddleware.tenantPermissions("admin"), tenantController.updateTenant);
router.put("/current/plan", auth, TenantMiddleware.tenantPermissions("admin"), tenantController.updatePlan);
router.get("/current/usage", auth, tenantController.getTenantUsage);
router.get("/", auth, tenantController.getAllTenants);

module.exports = router;
