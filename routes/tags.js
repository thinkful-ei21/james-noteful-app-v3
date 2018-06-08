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

