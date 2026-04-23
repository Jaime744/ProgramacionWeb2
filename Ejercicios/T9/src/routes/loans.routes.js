// src/routes/loans.routes.js

const { Router } = require("express");
const { getMyLoans, getAllLoans, createLoan, returnLoan } = require("../controllers/loans.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate, createLoanSchema } = require("../schemas/validation");

const router = Router();

// IMPORTANTE: "/all" debe ir antes de "/:id" para que Express no lo confunda
router.get("/all", authenticate, authorize("LIBRARIAN", "ADMIN"), getAllLoans);
router.get("/",    authenticate, getMyLoans);

router.post("/",           authenticate, validate(createLoanSchema), createLoan);
router.put("/:id/return",  authenticate, returnLoan);

module.exports = router;
