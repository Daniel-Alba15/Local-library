const moongose = require('mongoose');
const { body, validationResult } = require('express-validator');


const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');


// Display list of all BookInstances.
exports.bookinstance_list = (req, res, next) => {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err) { return next(err); }
            // Successful, so render

            res.render('bookinstance/bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res, next) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, data) => {
            if (err || data == null) {
                const err = new Error('Book instance not found');
                err.status = 404;
                return next(err);
            }

            res.render('bookinstance/bookinstance_detail', { title: 'Copy: ' + data.book.title, bookinstance: data });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res, next) => {
    Book.find({}, 'title')
        .exec((err, books) => {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('bookinstance/bookinstance_form', { title: 'Create BookInstance', book_list: books });
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance create POST');
};

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res) => {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec((err, data) => {
            if (err || data == null) {
                const err = new Error('Book instance not found');
                err.status = 404;
                return next(404);
            }

            res.render('bookinstance/bookinstance_delete', { title: 'Delete Book Instance', bookinstance: data });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async (req, res, next) => {
    try {
        const result = await BookInstance.findByIdAndDelete(req.params.id);
        res.redirect('/catalog/bookinstances');
    } catch (e) {
        return next(e);
    }
    // BookInstance.findById(req.params.id)
    //     .populate('book')
    //     .exec((err, data) => {
    //         if (err || data == null) {
    //             const err = new Error('Book instance not found');
    //             err.status = 404;
    //             return next(404);
    //         }

    //         BookInstance.findByIdAndDelete(req.params.id, (err, data) => {
    //             if (err) { return next(err); }

    //             res.redirect('/catalog/bookinstances');
    //         })
    //     });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance update GET');
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = (req, res) => {
    res.send('NOT IMPLEMENTED: BookInstance update POST');
};