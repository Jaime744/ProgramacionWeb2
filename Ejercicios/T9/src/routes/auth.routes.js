// src/routes/auth.routes.js

const { Router } = require("express");
const { register, login, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate, registerSchema, loginSchema } = require("../schemas/validation");

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.get("/me",        authenticate,             getMe);

module.exports = router;
