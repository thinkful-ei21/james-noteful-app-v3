'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
    const { searchTerm, folderId } = req.query;

    let filter = {};
    if (searchTerm) {
        filter.title = { $regex: searchTerm, $options: 'i' };

        const re = new RegExp(searchTerm, 'i');
        filter.$or = [{ 'title': re }, { 'content': re }];
    }

    if (folderId) {
        filter.folderId = folderId;
    }

    Note.find(filter)
        .sort({ updatedAt: 'desc' })
        .then(results => {
            res.json(results);
        })
        .catch(err => {
            next(err);
        });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/:id', (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }
    


    Note.findById(id)
        .then(result => {
            if (result) {
                res.json(result);
            } else {
                next();
            }
        })
        .catch(err => {
            next(err);
        });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/', (req, res, next) => {

    const { title, content, folderId } = req.body;

    if (!title) {
        const err = new Error('Missing `title` in request body');
        err.status = 400;
        return next(err);
    }

    if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
        const err = new Error('The `folderId` is not valid');
        err.status = 400;
        return next(err);
    }

    const newNote = { title, content, folderId };

    Note.create(newNote)
        .then(result => {
            res.location(`${req.originalUrl}/${result.id}`)
                .status(201)
                .json(result);
        })
        .catch(err => {
            next(err);
        });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/:id', (req, res, next) => {
    const { id } = req.params;
    const { title, content, folderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }

    if (!title) {
        const err = new Error('Missing `title` in request body');
        err.status = 400;
        return next(err);
    }

    if (folderId && !mongoose.Types.ObjectId.isValid(folderId)) {
        const err = new Error('The `folderId` is not valid');
        err.status = 400;
        return next(err);
    }

    const updateNote = { title, content };

    Note.findByIdAndUpdate(id, updateNote, { new: true })
        .then(result => {
            if (result) {
                res.json(result);
            } else {
                next();
            }
        })
        .catch(err => {
            next(err);
        });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/:id', (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }

    Note.findByIdAndRemove(id)
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            next(err);
        });
});

module.exports = router;