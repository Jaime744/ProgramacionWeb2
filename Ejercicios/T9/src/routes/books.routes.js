// src/routes/books.routes.js

const { Router } = require("express");
const { getBooks, getBookById, createBook, updateBook, deleteBook } = require("../controllers/books.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { validate, createBookSchema, updateBookSchema } = require("../schemas/validation");

const router = Router();

router.get("/",    getBooks);
router.get("/:id", getBookById);

router.post("/",    authenticate, authorize("LIBRARIAN", "ADMIN"), validate(createBookSchema), createBook);
router.put("/:id",  authenticate, authorize("LIBRARIAN", "ADMIN"), validate(updateBookSchema), updateBook);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBook);

module.exports = router;
