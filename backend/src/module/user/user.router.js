const express = require("express");
const router  = express.Router();

const { Role, FileFilterType } = require("../../config/constant.config");

const loginCheck    = require("../../middleware/auth.middlewares");
const attachSchool  = require("../../middleware/attachSchool.middleware");
const hasPermission = require("../../middleware/rbac.middlewares");
const { bodyValidator }    = require("../../middleware/validator.middlewares");
const { setPath, uplaodFile, persistAllToS3 } = require("../../middleware/aws.middlware");

const { loadTargetUser } = require("../../middleware/loadTargetUser.middleware");
const { canManageUser }  = require("../../middleware/canManageUser.middleware");

const userController = require("./user.controller");
const {
    updatePrincipalStatusDTO,
    userCreateDTO,
    userUpdateDTO,
    userSelfUpdateDTO,
} = require("./user.request");


// ──────────────────────────────────────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────────────────────────────────────

router.post(
    "/admin-team",
    loginCheck,
    attachSchool,
    hasPermission(Role.PRINCIPAL),
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userCreateDTO),
    userController.createAdminStaff
);

router.post(
    "/accountant",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userCreateDTO),
    userController.createAccountant
);

// ──────────────────────────────────────────────────────────────────────────────
// SELF UPDATE  ← must be declared BEFORE /:id so Express doesn't treat
//                "me" as an id param
// ──────────────────────────────────────────────────────────────────────────────


router.put(
    "/me",
    loginCheck,
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userSelfUpdateDTO),
    userController.updateSelf
);

// ──────────────────────────────────────────────────────────────────────────────
// LIST USERS
// ──────────────────────────────────────────────────────────────────────────────

router.get(
    "/",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    userController.listUsers
);

// ──────────────────────────────────────────────────────────────────────────────
// GET / UPDATE / DELETE USER BY ID
// ──────────────────────────────────────────────────────────────────────────────

router.get(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    userController.getUserById
);

router.put(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    setPath("user"),
    uplaodFile(FileFilterType.IMAGE).fields([{ name: "profileImage", maxCount: 1 }]),
    persistAllToS3,
    bodyValidator(userUpdateDTO),
    userController.updateUser
);

router.delete(
    "/:id",
    loginCheck,
    attachSchool,
    hasPermission([Role.PRINCIPAL, Role.ADMIN_STAFF]),
    loadTargetUser,
    canManageUser,
    userController.deleteUser
);

// ──────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN → activate / deactivate a principal
// ──────────────────────────────────────────────────────────────────────────────

router.put(
    "/:id/status",
    loginCheck,
    hasPermission(Role.SUPER_ADMIN),
    loadTargetUser,
    bodyValidator(updatePrincipalStatusDTO),
    userController.updatePrincipalStatus
);


module.exports = router;
