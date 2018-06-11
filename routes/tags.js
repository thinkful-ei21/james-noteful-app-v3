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
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }

    Tag.create(newTag)
        .then(result => {
            res.location(`${req.originalUrl}/${result.id}`)
                .status(201)
                .json(result);
        })
        .catch(err => {
            if (err.code === 11000) {
                err = new Error('Tag name already exists');
                err.status = 400;
            }
            next(err);
        });
});

router.put('/:id', (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;

    const updateTag = { name };

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }

    if(!name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }

    Tag.findByIdAndUpdate(id, updateTag, { new: true })
        .then(result => {
            if (result) {
                res.json(result);
            } else {
                next();
            }
        })
        .catch(err => {
            if (err.code === 11000) {
                err = new Error('Tag name already exists');
                err.status = 400;
            } 
            next(err);
        });
});

router.delete('/:id', (req, res, next) => {
    const { id } = req.params;

    const tagRemovePromise = Tag.findByIdAndRemove(id);

    const noteRemovePromise =  Note.updateMany(
        { tags: id },
        { $pull: { tags: id } }    
    );

    Promise.all([tagRemovePromise, noteRemovePromise])
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            next(err);
        });
        
});
module.exports = router;