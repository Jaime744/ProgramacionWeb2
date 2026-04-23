// src/routes/reviews.routes.js

const { Router } = require("express");
const { getBookReviews, createReview, deleteReview } = require("../controllers/reviews.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate, createReviewSchema } = require("../schemas/validation");

const router = Router({ mergeParams: true }); // mergeParams permite acceder a :id del router padre

router.get("/",   getBookReviews);
router.post("/",  authenticate, validate(createReviewSchema), createReview);

// Ruta separada: DELETE /api/reviews/:id (no anidada en books)
module.exports = router;
