'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Folder = require('../models/folder');
const Note = require('../models/note');
const Tag = require('../models/tag');

/* ========== GET/READ ALL ITEM ========= */ 
router.get('/', (req, res, next) => {

    Tag.find()
        .sort({ name: 'asc' })
        .then(results => {
            res.json(results);
        })
        .catch(err => {
            next(err);
        });
});

router.get('/:id', (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }

    Tag.findById(id)
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

router.post('/', (req, res, next) => {
    const { name } = req.body;

    const newTag = { name };

    if (!name) {
        const err = new Error('Missing `title` in request body');
        err.status = 400;
        return next(err);
    }
});

module.exports = router;