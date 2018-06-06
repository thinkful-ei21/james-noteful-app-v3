'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Note = require('../models/note');

/* ========== GET/READ ALL ITEM ========== */
router.get('/', (req, res, next) => {
    const { searchTerm } = req.query;

    let filter = {};
    if (searchTerm) {
        filter.title = { $regex: searchTerm };
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

    const { title, content } = req.body;

    if (!title) {
        const err = new Error('Missing `title` in request body');
        err.status = 400;
        return next(err);
    }

    const newNote = { title, content };

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
    const { title, content } = req.body;

    if (!title) {
        const err = new Error('Missing `title` in request body');
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

    Note.findByIdAndRemove(id)
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            next(err);
        });
});

module.exports = router;