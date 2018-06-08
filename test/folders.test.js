'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/notes');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Folders endpoints', function() {
    before(function () {
        return mongoose.connect(TEST_MONGODB_URI)
            .then(() => mongoose.connection.db.dropDatabase());
    });
    
    beforeEach(function (){
        return Promise.all([
            Folder.insertMany(seedFolders),
            Folder.createIndexes()
        ]);
    });
    
    afterEach(function () {
        return mongoose.connection.db.dropDatabase();
    });
    
    after(function () {
        return mongoose.disconnect();
    });
});