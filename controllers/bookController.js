const { body, validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

exports.index = async (req, res) => {
    const results = await Promise.all([
        Book.countDocuments({}),
        BookInstance.countDocuments({}),
        BookInstance.countDocuments({ status: 'Available' }),
        Author.countDocuments({}),
        Genre.countDocuments({})
    ]);

    res.render('index', { title: 'Local Library Home', data: results });
};

// Display list of all books.
exports.book_list = async (req, res, next) => {
    // retorna solo el titulo y el autor de todos los libros
    const book_list = await Book.find({}, 'title author').populate('author');

    res.render('book/book_list', { title: 'Book List', book_list });
};

// Display detail page for a specific book.
exports.book_detail = async (req, res, next) => {
    const id = req.params.id;

    const results = await Promise.all([
        Book.findById(id).populate('author').populate('genre'),
        BookInstance.find({ 'book': id })
    ]);

    const book = results[0];
    const book_instances = results[1];

    res.render('book/book_detail', { title: book.title, book, book_instances });
};

// Display book create form on GET.
exports.book_create_get = async (req, res, next) => {
    const results = await Promise.all([
        Author.find(),
        Genre.find()
    ]);

    const authors = results[0];
    const genres = results[1];

    res.render('book/book_form', { title: 'Create Book', authors, genres });
};

// Handle book create on POST.
exports.book_create_post = [
    // Convert the genre to an array.
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped and trimmed data.
        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            const results = await Promise.all([
                Author.find(),
                Genre.find()
            ]);

            const authors = results[0];
            const genres = results[1];

            for (let i = 0; i < genres.length; i++) {
                if (book.genre.indexOf(genres[i]._id) > -1) {
                    genres[i].checked = 'true';
                }
            }

            res.render('book/book_form', { title: 'Create Book', authors, genres, book, errors: errors.array() });
            return;
        }

        await book.save();
        res.redirect(book.url);
    }
]

// Display book delete form on GET.
exports.book_delete_get = async (req, res, next) => {
    const results = await Promise.all([
        Book.findById(req.params.id).populate('genre').populate('author'),
        BookInstance.find({ book: req.params.id })
    ]);

    const book = results[0];
    const bookInstance = results[1];

    if (book == null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    res.render('book/book_delete', { title: 'Book Delete', book, book_instance: bookInstance });
};

// Handle book delete on POST.
exports.book_delete_post = async (req, res) => {
    const results = await Promise.all([
        Book.findById(req.params.id),
        BookInstance.find({ book: req.params.id })
    ]);

    const book = results[0];
    const bookInstance = results[1];

    if (bookInstance.length > 0) {
        res.render('book/book_delete', { title: 'Delete Book', book, book_instance: bookInstance });
        return;
    }

    await Book.findByIdAndDelete(req.body.bookid);
    res.redirect('/catalog/books');
};

// Display book update form on GET.
exports.book_update_get = async (req, res) => {
    const results = await Promise.all([
        Book.findById(req.params.id).populate('author').populate('genre'),
        Author.find(),
        Genre.find()
    ]);

    if (results[0] == null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
    }

    for (let all_g_iter = 0; all_g_iter < results[2].length; all_g_iter++) {
        for (let book_g_iter = 0; book_g_iter < results[0].genre.length; book_g_iter++) {
            if (results[2][all_g_iter]._id.toString() === results[0].genre[book_g_iter]._id.toString()) {
                results[2][all_g_iter].checked = 'true';
            }
        }
    }

    res.render('book/book_form', { title: 'Update Book', authors: results[1], genres: results[2], book: results[0] });
};

// Handle book update on POST.
exports.book_update_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitise fields.
    body('title', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        const book = {
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
        };

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            // Get all authors and genres for form.
            const results = await Promise.all([
                Author.find(),
                Genre.find()
            ])

            for (let i = 0; i < results[1].length; i++) {
                if (book.genre.indexOf(results[1][i]._id) > -1) {
                    results[1][i].checked = 'true';
                }
            }

            res.render('book_form', { title: 'Update Book', authors: results[0], genres: results[1], book, errors: errors.array() });
            return;
        }

        // Data from form is valid. Update the record.
        const updateBook = await Book.findByIdAndUpdate(req.params.id, book, { new: true });
        res.redirect(updateBook.url);
    }
];