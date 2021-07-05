const { body, validationResult } = require('express-validator');

const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

// Display list of all BookInstances.
exports.bookinstance_list = async (req, res, next) => {
    const bookInstance = await BookInstance.find().populate('book');

    res.render('bookinstance/bookinstance_list', { title: 'Book Instance List', bookinstance_list: bookInstance });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book');

    if (bookInstance == null) {
        const err = new Error('Book instance not found');
        err.status = 404;
        return next(err);
    }

    res.render('bookinstance/bookinstance_detail', { title: 'Copy: ' + bookInstance.title, bookinstance: bookInstance }); 
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async (req, res, next) => {
    const books = await Book.find({}, 'title');
    const status = ['Maintenance', 'Available', 'Loaned', 'Reserved'];

    res.render('bookinstance/bookinstance_form', { title: 'Create BookInstance', book_list: books, status });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('imprint', 'Imprint must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('due_back', 'Invalid due back').optional({ checkFalsy: true }).isISO8601().toDate(),

    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const result = await Book.find({}, 'title')
            res.render('bookinstance/bookinstance_form', { title: 'Create Bookinstance', book_list: result, errors: errors.array() });
            return;
        }

        const newBookInstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        await newBookInstance.save();
        res.redirect('/catalog/bookinstances');
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async (req, res) => {
    const bookInstance = await BookInstance.findById(req.params.id).populate('book');

    if (bookInstance == null) {
        const err = new Error('Book instance not found');
        err.status = 404;
        return next(404);
    }

    res.render('bookinstance/bookinstance_delete', { title: 'Delete Book Instance', bookinstance: bookInstance });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async (req, res, next) => {
    try {
        const result = await BookInstance.findByIdAndDelete(req.params.id);
        res.redirect('/catalog/bookinstances');
    } catch (e) {
        return next(e);
    }
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id).lean();

    if (bookInstance == null) {
        const err = new Erro(404);
        err.status = 404;
        return next(404);
    }

    if (bookInstance.due_back != null) {
        bookInstance.due_back = bookInstance.due_back.toISOString().slice(0, 10);
    }

    const books = await Book.find({});
    const status = ['Maintenance', 'Available', 'Loaned', 'Reserved'];

    res.render('bookinstance/bookinstance_form', { title: 'Update Book Instance', bookinstance: bookInstance, book_list: books, status });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('imprint', 'Imprint must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('due_back', 'Invalid due back').optional({ checkFalsy: true }).isISO8601().toDate(),

    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const result = await Book.find({}, 'title')
            res.render('bookinstance/bookinstance_form', { title: 'Create Bookinstance', book_list: result, errors: errors.array() });
            return;
        }

        const newBookInstance = {
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        };

        const result = await BookInstance.findByIdAndUpdate(req.params.id, newBookInstance);
        
        res.redirect('/catalog/bookinstances');
    }
];