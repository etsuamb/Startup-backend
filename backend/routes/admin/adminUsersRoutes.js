const router = require("express").Router();

const {
	authenticate,
	authorizeRoles,
} = require("../../middleware/authMiddleware");
const adminController = require("../../controllers/adminController");

router.get(
	"/users/pending",
	authenticate,
	authorizeRoles("Admin"),
	adminController.listPendingUsers,
);

router.get(
	"/users/pending/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getPendingUser,
);

router.put(
	"/users/reject/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.rejectUser,
);

router.put(
	"/users/approve/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.approveUser,
);

router.get(
	"/users",
	authenticate,
	authorizeRoles("Admin"),
	adminController.searchUsers,
);

router.get(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.getUser,
);

router.delete(
	"/users/:userId",
	authenticate,
	authorizeRoles("Admin"),
	adminController.deleteUser,
);

router.post(
	"/create-admin",
	authenticate,
	authorizeRoles("Admin"),
	adminController.createAdmin,
);

module.exports = router;
