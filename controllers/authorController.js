const async = require('async');

const Author = require('../models/author');
const Book = require('../models/book');

exports.author_list = (req, res, next) => {
    Author.find()
        .sort([['family_name', 'ascending']])
        .exec((err, list_authors) => {
            if (err) { return next(err); }
            //Successful, so render
            res.render('author/author_list', { title: 'Author List', author_list: list_authors });
        });
};

exports.author_detail = (req, res, next) => {
    const id = req.params.id;

    async.parallel({
        author: (callback) => {
            Author.findById(id)
                .exec(callback);
        },
        books: (callback) => {
            Book.find({ author: id }, 'title')
                .exec(callback);
        }
    }, (err, results) => {
        if (err || results.author == null) {
            const err = new Error('Author not found');
            err.status = 404
            return next(err);
        }

        res.render('author/author_detail', { title: results.author.name, author: results.author, books: results.books })
    })
};

exports.author_create_get = (req, res) => {
    res.send('No');
};

exports.author_create_post = (req, res) => {
    res.send('No');
};

exports.author_delete_get = (req, res) => {
    res.send('No');
};

exports.author_delete_post = (req, res) => {
    res.send('No');
};

exports.author_update_get = (req, res) => {
    res.send('No');
};

exports.author_update_post = (req, res) => {
    res.send('No');
};