const { body, validationResult } = require('express-validator');

const Author = require('../models/author');
const Book = require('../models/book');

exports.author_list = async (req, res) => {
    const author_list = await Author.find().sort([['family_name', 'ascending']]);

    res.render('author/author_list', { title: 'Author List', author_list });
};

exports.author_detail = async (req, res, next) => {
    const id = req.params.id;

    const results = await Promise.all([
        Author.findById(id),
        Book.find({ author: id }, 'title')
    ]);

    const author = results[0];
    const books = results[1];

    if (author == null) {
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
    }

    res.render('author/author_detail', { title: author.name, author, books });
};

exports.author_create_get = (req, res) => {
    res.render('author/author_form', { title: 'Create Author' });
};

exports.author_create_post = [
    body('first_name').trim().isLength({ min: 1 })
        .escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 })
        .escape().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),

    async (req, res) => {
        const errors = validationResult(req);

        // Form is invalid
        if (!errors.isEmpty()) {
            res.render('author/author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }

        // Form is valid
        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death,
        });

        await author.save();
        res.redirect(author.url);
    }
];

exports.author_delete_get = async (req, res) => {
    const results = await Promise.all([
        Author.findById(req.params.id),
        Book.find({ 'author': req.params.id })
    ]);

    const author = results[0];
    const author_books = results[1];

    if (author == null) {
        res.redirect('/catalog/authors');
        return;
    }

    res.render('author/author_delete', { title: 'Delete Author', author, author_books });
};

exports.author_delete_post = async (req, res, next) => {
    const results = await Promise.all([
        Author.findById(req.body.authorid),
        Book.find({ 'author': req.body.authorid })
    ]);

    const author = results[0];
    const author_books = results[1];

    if (author == null) {
        const err = new Error(404);
        err.status = 404;
        return next(err);
    }

    if (author_books.length > 0) {
        res.render('author/author_delete', { title: 'Delete Author', author, author_books });
        return;
    }

    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect('/catalog/authors');
};

exports.author_update_get = async (req, res, next) => {
    try {
        // lean() convierte en el objeto moongose devuelto a un objeto js
        // para poder asignar el formato de la fecha de nacimiento
        const result = await Author.findById(req.params.id).lean();

        if (result == null) {
            const err = new Error(404);
            err.status = 404;
            return next(err);
        }

        if (result.date_of_birth != null) {
            result.date_of_birth = result.date_of_birth.toISOString().slice(0, 10);
        }

        if (result.date_of_death != null) {
            result.date_of_death = result.date_of_death.toISOString().slice(0, 10);
        }

        res.render('author/author_form', { title: 'Author', author: result });
    } catch (err) {
        return next(err);
    }
};

exports.author_update_post = [
    body('first_name').trim().isLength({ min: 1 })
        .escape().withMessage('First name must be specified')
        .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
    body('family_name').trim().isLength({ min: 1 })
        .escape().withMessage('Family name must be specified')
        .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
    body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(),

    async (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('author/author_form', { title: 'Edit Author', author: req.body, errors: errors.array() });
            return;
        }

        const author = {
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        };

        try {
            const result = await Author.findByIdAndUpdate(req.params.id, author);

            if (result == null) {
                const err = new Error(404);
                err.status = 404;
                return next(err);
            }

            res.redirect(result.url);
        } catch (err) {
            return next(err);
        }
    }
];