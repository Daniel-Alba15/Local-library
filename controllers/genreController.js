const { body, validationResult } = require('express-validator');

const Genre = require('../models/genre');
const Book = require('../models/book');

// Display list of all Genre.
exports.genre_list = async (req, res, next) => {
    const result = await Genre.find({}).sort([['name', 'ascending']]);

    res.render('genre/genre_list', { title: 'Genre List', list_genre: result });
};

// Display detail page for a specific Genre.
exports.genre_detail = async (req, res, next) => {
    try {
        const result = await Promise.all([
            Genre.findById(req.params.id),
            Book.find({ 'genre': req.params.id })
        ])

        const genre = result[0];
        const genreBooks = result[1];

        if (genre == null) {
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        res.render('genre/genre_detail', { title: 'Genre Detail', genre, genre_books: genreBooks });
    } catch (err) {
        return next(err);
    }
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
    res.render('genre/genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [
    // Validate and santize the name field.
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a genre object with escaped and trimmed data.
        const genre = new Genre({ name: req.body.name });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre/genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }

        // Data from form is valid.
        // Check if Genre with same name already exists.
        const result = await Genre.findOne({ 'name': req.body.name });

        if (result) {
            res.redirect(result.url);
            return;
        }

        const resutlSave = await genre.save();

        res.redirect(genre.url);
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = async (req, res, next) => {
    const result = await Promise.all([
        Genre.findById(req.params.id),
        Book.find({ genre: req.params.id })
    ]);

    const genre = result[0];
    const books = result[1];

    if (genre == null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }

    res.render('genre/genre_delete', { title: 'Genre Delete', genre, books })
};

// Handle Genre delete on POST.
exports.genre_delete_post = async (req, res, next) => {
    const result = await Promise.all([
        Genre.findById(req.params.id),
        Book.find({ genre: req.params.id })
    ]);

    const genre = result[0];
    const books = result[1];

    if (genre == null) {
        const err = new Error('Genre not found');
        err.status = 404;
        return next(err);
    }

    if (books.length > 0) {
        res.render('genre/genre_delete', { title: 'Genre Delete', genre, books });
        return;
    }

    const deleteGenre = await Genre.findByIdAndDelete(req.params.id);

    res.redirect('/catalog/genres');
};

// Display Genre update form on GET.
exports.genre_update_get = async (req, res) => {
    const result = await Genre.findById(req.params.id);

    res.render('genre/genre_form', { title: 'Genre Update', genre: result });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    body('name', 'Genre name required').trim().isLength({ min: 1 }).escape(),

    // Process request after validation and sanitization.
    async (req, res) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a genre object with escaped and trimmed data.
        const genre = { name: req.body.name };

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre/genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }

        // Data from form is valid.
        // Check if Genre with same name already exists.
        const result = await Genre.findByIdAndUpdate(req.params.id, genre);

        res.redirect(result.url)
    }
];