'use strict';

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Folder = require('../models/folder');
const Note = require('../models/note');

// get all folders endpoint
router.get('/', (req, res, next) => {

    Folder.find()
        .sort({ name: 'asc' })
        .then(results => {
            res.json(results);
        })
        .catch(err => {
            next(err);
        });
});

// get folder by id endpoint
router.get('/:id', (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }
    
    Folder.findById(id)
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

    const newFolder = { name };

    if (!name) {
        const err = new Error('Missing `name` in request body');
        err.status = 400;
        return next(err);
    }

    Folder.create(newFolder)
        .then(result => {
            res.location(`${req.originalUrl}/${result.id}`)
                .status(201)
                .json(result);
        })
        .catch(err => {
            if (err.code === 11000) {
                err = new Error('Folder name already exists');
                err.status = 400;
            }
            next(err);
        });
});

router.put('/:id', (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;
    const updateFolder = { name };

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

    Folder.findByIdAndUpdate(id, updateFolder, { new: true })
        .then(result => {
            if (result) {
                res.json(result);
            } else {
                next();
            }
        })
        .catch(err => {
            if (err.code === 11000) {
                err = new Error('Folder name already exists');
                err.status = 400;
            } 
            next(err);
        });
});

router.delete('/:id', (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
    }

    // // ON DELETE CASCADE SOLUTION

    // Note.deleteMany({ folderId: id })
    //     .then(() => {
    //         Folder.findByIdAndRemove({ id: id });
    //         res.status(204).end();
    //     })
    //     .catch(err => {
    //         next(err);
    //     });

    const folderRemovePromise = Folder.findByIdAndRemove(id);

    const noteRemovePromise = Note.updateMany(
        { folderId: id },
        { $unset: { folderId: '' } }
    );

    Promise.all([folderRemovePromise, noteRemovePromise])
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            next(err);
        });

});

module.exports = router;