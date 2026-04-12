const router = require("express").Router();
const invoiceController = require("./invoice.controller");
const { Role } = require("../../config/constant.config");
const attachSchool = require("../../middleware/attachSchool.middleware");
const loginCheck = require("../../middleware/auth.middlewares");
const hasPermission = require("../../middleware/rbac.middlewares");

const roles = [Role.PRINCIPAL, Role.ACCOUNTANT, Role.ADMIN_STAFF];

router.use(loginCheck, attachSchool);


router.route("/")
  .get(hasPermission(roles), invoiceController.listPending);


router.route("/generate")
  .post(hasPermission(roles), invoiceController.generateForStudent);


router.route("/generate-bulk")
  .post(hasPermission(roles), invoiceController.generateBulk);


router.route("/:id/approve")
  .put(hasPermission(roles), invoiceController.approve);


router.route("/:id/send")
  .post(hasPermission(roles), invoiceController.send);

module.exports = router;
