'use strict';

const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config');

const Note = require('../models/note');

// // Find/Search for notes using Note.find
// mongoose.connect(MONGODB_URI)
//     .then(() => {
//         const searchTerm = 'lady gaga';
//         let filter = {};

//         if (searchTerm) {
//             filter.title = { $regex: searchTerm };
//         }

//         return Note.find(filter).sort({ updatedAt: 'desc' });
//     })    
//     .then(results => {
//         console.log(results);
//     })
//     .then(() => {
//         return mongoose.disconnect();
//     })
//     .catch(err => {
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//     });
// // Find note by id using Note.findById
// mongoose.connect(MONGODB_URI)
//     .then(() => {
//         const tempId = '000000000000000000000001';

//         return Note.findById(tempId);
//     })
//     .then(results => {
//         console.log(results);
//     })
//     .then(() => {
//         return mongoose.disconnect();
//     })
//     .catch(err => {
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//     });
// // Create a new note
// mongoose.connect(MONGODB_URI)
//     .then(() => {
//         const note = {
//             title: 'Random note',
//             content: 'content'
//         };

//         return Note.create(note);
//     })
//     .then(results  => {
//         console.log(results);
//     })
//     .then(() => {
//         return mongoose.disconnect();
//     })
//     .catch(err => {
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//     });

// // Update a note by id
// // usng findByIdAndUpdate

// mongoose.connect(MONGODB_URI)
//     .then(() => {
//         const noteId = '5b16e7004d0c2a20360700c2';

//         return Note.findByIdAndUpdate(noteId, 
//             { title: 'updated note' }, 
//             { new: true });
//     })
//     .then(results => {
//         console.log(results);
//     })
//     .then(() => {
//         mongoose.disconnect();
//     })
//     .catch(err => {
//         console.error(`ERROR: ${err.message}`);
//         console.error(err);
//     });


mongoose.connect(MONGODB_URI)
    .then(() => {
        const id = '5b16e7004d0c2a20360700c2';
        
        //return must be here or it won't work
        return Note.findByIdAndRemove(id);
    })
    .then(results => {
        console.log('Note removed');
    })
    .then(() => {
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(`ERROR: ${err.message}`);
        console.error(err);
    });