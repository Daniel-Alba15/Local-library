const { body, validationResult } = require('express-validator');
const async = require('async');

const Genre = require('../models/genre');
const Book = require('../models/book');


// Display list of all Genre.
exports.genre_list = (req, res) => {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec((err, genre_list) => {
            if (err) { return next(err); }

            res.render('genre/genre_list', { title: 'Genre List', list_genre: genre_list });
        });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: (callback) => {
            Book.find({ 'genre': req.params.id })
                .exec(callback);
        },

    }, (err, results) => {
        if (err || results.genre == null) { // No results.
            const err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        // Successful, so render
        res.render('genre/genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });
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
    (req, res, next) => {

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
        Genre.findOne({ 'name': req.body.name })
            .exec((err, found_genre) => {
                if (err) { return next(err); }

                if (found_genre) {
                    // Genre exists, redirect to its detail page.
                    res.redirect(found_genre.url);
                    return;
                }

                genre.save((err) => {
                    if (err) { return next(err); }
                    // Genre saved. Redirect to genre detail page.
                    res.redirect(genre.url);
                });
            });
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        book: (callback) => {
            Book.find({ genre: req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err || results.genre == null) {
            const err = new Error('No genre found');
            err.status = 404;
            return next(err);
        }

        res.render('genre/genre_delete', { title: 'Genre Delete', genre: results.genre, books: results.book })
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = (req, res, next) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback);
        },
        book: (callback) => {
            Book.find({ genre: req.params.id }).exec(callback);
        }
    }, (err, results) => {
        if (err || results.genre == null) {
            const err = new Error('No genre found');
            err.status = 404;
            return next(err);
        }

        if (results.book.length > 0) {
            res.render('genre/genre_delete', { title: 'Genre Delete', genre: results.genre, books: results.book })
            return;
        }

        Genre.findByIdAndDelete(req.params.id).exec((err, data) => {
            if (err) { return next(err); }

            res.redirect('/catalog/genres');
        })
    });
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: Genre update POST');
};