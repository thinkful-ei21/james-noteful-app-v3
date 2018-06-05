'use strict';

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: { 
        type: String,
        required: true
    },
    content: String
    // createdAt: { 
    //     type: Date,
    //     default: Date.now()
    // }
});

noteSchema.set('timestamps', true);

noteSchema.set('toObject', {
    virtuals: true,  // include built-in virtual id
    versionKey: false,
    transform: (doc, ret) => {
        delete ret._id;
    }
});

module.exports = mongoose.model('Note', noteSchema);