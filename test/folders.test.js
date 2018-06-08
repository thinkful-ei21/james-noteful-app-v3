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

    describe('GET /api/folder/:id endpoint', function(){
       
        it('should return correct folder', function(){
            let data;
            return Folder.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).get(`/api/folders/${data.id}`);
                })
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.all.keys('id', 'name', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.name).to.equal(data.name);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });  
        });

        it('should return a 400 error for an invalid id', function(){
            return chai.request(app)
                .get('/api/folders/NOT-A-VALID-ID')
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.eql('The `id` is not valid');
                });
        });

        it('should respond with a 404 for an ID that does not exist', function () {
            // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
            return chai.request(app)
                .get('/api/folders/DOESNOTEXIST')
                .then(res => {
                    expect(res).to.have.status(404);
                });
        });
    });

    describe('POST /api/folders endpoint', function(){
        it('should create a new folder when provided correct data', function(){
            const newFolder = { name: 'new folder' };

            let res;
            return chai.request(app)
                .post('/api/folders')
                .send(newFolder)
                .then(function(_res){
                    res = _res;

                    expect(res).to.have.status(201);
                    expect(res).to.have.header('location');
                    expect(res).to.be.json;
                    expect(res.body).to.a('object');
                    expect(res.body).to.include.all.keys('id', 'name', 'createdAt', 'updatedAt');
                    return Folder.findById(res.body.id);
                })
                .then(data => {
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.name).to.equal(data.name);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
                
        });

        it('should return an error if missing "title" field', function () {
            const newFolder = {
                notName: 'this folder has no title'
            };
            return chai.request(app)
                .post('/api/folders')
                .send(newFolder)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `name` in request body');
                });
        });

        it('should return an error when given a duplicate name', function () {
            return Folder.findOne()
                .then(data => {
                    const newItem = { 'name': data.name };
                    return chai.request(app).post('/api/folders').send(newItem);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Folder name already exists');
                });
        });

    });

    describe('PUT api/folders/:id endpoint', function(){


        it('should update the folder when given update data', function () {
            const updateItem = { name: 'Updated Name' };

            let data;

            return Folder.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/folders/${data.id}`)
                        .send(updateItem);
                })
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.name).to.equal(updateItem.name);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    // expect item to have been updated
                    expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
                });
        });

        it('should respond with a 400 for an invalid id', function () {
            const updateFolder = { 'name': 'Blah' };
            return chai.request(app)
                .put('/api/folders/NOT-A-VALID-ID')
                .send(updateFolder)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.eq('The `id` is not valid');
                });
        });

        it('should respond with a 404 for an id that does not exist', function () {
            const updateItem = { 'name': 'Blah' };
            // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
            return chai.request(app)
                .put('/api/folders/DOESNOTEXIST')
                .send(updateItem)
                .then(res => {
                    expect(res).to.have.status(404);
                });
        });
        

        it('should return an error if missing "name" field', function () {
            const updateFolder = {};

            let data;
            return Folder.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/folders/${data.id}`)
                        .send(updateFolder);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `name` in request body');
                });
        });

        it('should return an error when given a duplicate name', function () {
            return Folder.find().limit(2)
                .then(results => {
                    const [item1, item2] = results;
                    item1.name = item2.name;
                    return chai.request(app)
                        .put(`/api/folders/${item1.id}`)
                        .send(item1);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Folder name already exists');
                });
        });
    });

    describe('DELETE /api/folders/:id', function () {

        it('should delete an existing folder and respond with 204', function () {
            let data;
            return Folder.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).delete(`/api/folders/${data.id}`);
                })
                .then(function (res) {
                    expect(res).to.have.status(204);
                    expect(res.body).to.be.empty;
                    return Folder.count({ _id: data.id });
                })
                .then(count => {
                    expect(count).to.equal(0);
                });
        });
    
    
    
    });
    
});

