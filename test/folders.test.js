'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Note = require('../models/note');
const Folder = require('../models/folder');

const seedNotes = require('../db/seed/notes');
const seedFolders = require('../db/seed/folders');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Folders endpoints', function() {
    before(function () {
        return mongoose.connect(TEST_MONGODB_URI)
            .then(() => mongoose.connection.db.dropDatabase());
    });
    
    beforeEach(function (){
        return Promise.all([
            Note.insertMany(seedNotes),
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
    describe('GET api/folders/ endpoint', function(){
        it('should return all folders sorted by name', function() {
            return Promise.all([
                Folder.find().sort('name'),
                chai.request(app).get('/api/folders')
            ])
                .then(([data, res]) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(data.length);
                });
        });

        it('should return a list of folders with correct fields', function(){
            return Promise.all([
                Folder.find().sort('name'),
                chai.request(app).get('/api/folders')
            ])
                .then(([data, res]) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(data.length);
                    res.body.forEach(function(item, i){
                        expect(item).to.be.a('object');
                        expect(item).to.include.all.keys(
                            'id', 'name', 'createdAt', 'updatedAt');
                        expect(item.id).to.equal(data[i].id);
                        expect(item.name).to.equal(data[i].name);
                        expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
                        expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
                    });
                });
        });

    });
});