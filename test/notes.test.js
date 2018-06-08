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

describe('Notes endpoints', function() {
    before(function () {
        return mongoose.connect(TEST_MONGODB_URI)
            .then(() => mongoose.connection.db.dropDatabase());
    });
    
    beforeEach(function () {
        return Promise.all([
            Note.insertMany(seedNotes),
            Folder.insertMany(seedFolders)
        ])
            .then(() => {
                return Note.createIndexes();
            });
    });
    
    afterEach(function () {
        return mongoose.connection.db.dropDatabase();
    });
    
    after(function () {
        return mongoose.disconnect();
    });

    // get all notes or filter by search tests
    describe('GET /api/notes', function(){
        
        it('should return all notes', function(){

            let res; 
            return chai.request(app)
                .get('/api/notes')
                .then(function(_res) {
                    // so subsequent .then() blocks will have access to res object
                    res = _res;
                    // console.log(res.body);
                    expect(res).to.have.status(200);
                    // if length not greater than 1 seeding did not work
                    expect(res.body).to.have.lengthOf.at.least(1);
                    return Note.count();
                })
                .then(function(count) {
                    expect(res.body).to.have.lengthOf(count);
                });
        });

        it('should return notes with correct fields', function() {
            
            let resNote;
            return chai.request(app)
                .get('/api/notes')
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.lengthOf.at.least(1);

                    res.body.forEach(function(note) {
                        expect(note).to.be.a('object');
                        expect(note).to.include.all.keys(
                            'id', 'title', 'createdAt', 'updatedAt');
                    });
                    resNote = res.body[0];
                    return Note.findById(resNote.id);
                })
                .then(function(note) {
                    expect(resNote.id).to.equal(note.id);
                    expect(resNote.title).to.equal(note.title);
                    expect(resNote.content).to.equal(note.content);
                    expect(new Date(resNote.createdAt)).to.eql(note.createdAt);
                    expect(new Date(resNote.updatedAt)).to.eql(note.updatedAt);
                });
        });

        it('should return correct search results for a query', function(){
            const searchTerm = 'gaga';

            const dbPromise = Note.find({
                title: { $regex: searchTerm, $options: 'i' }
            });

            const apiPromise = chai.request(app)
                .get(`/api/notes?searchTerm=${searchTerm}`);

            return Promise.all([dbPromise, apiPromise])
                .then(([data, res]) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.lengthOf(1);
                    res.body.forEach(function(item, i){
                        expect(item).to.be.a('object');
                        expect(item).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
                        expect(item.id).to.equal(data[i].id);
                        expect(item.title).to.equal(data[i].title);
                        expect(item.content).to.equal(data[i].content);
                        expect(new Date(item.createdAt)).to.eql(data[i].createdAt);
                        expect(new Date(item.updatedAt)).to.eql(data[i].updatedAt);
                    });
                });
        });
    });

    // get notes by id tests
    describe('GET /api/notes/:id endpoint', function(){

        it('should return correct notes', function(){
            let data;
            return Note.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).get(`/api/notes/${data.id}`);
                })
                .then((res) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(data.title);
                    expect(res.body.content).to.equal(data.content);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
        });

        // it('should return a 400 status when the id is not valid', function(){

        // });
    });
    
    // create a new note tests
    describe('POST endpoint', function() {

        it('should add and return a new note', function(){

            const newNote = { title: 'new note here', content: 'this is a new note' };

            let res; 

            return chai.request(app).post('/api/notes')
                .send(newNote)
                .then(_res => {
                    res = _res;
                    
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.all.keys('id', 'title','content', 'createdAt', 'updatedAt');
                    return Note.findById(res.body.id);
                })
                .then(data => {
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(data.title);
                    expect(res.body.content).to.equal(data.content);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
                
        });

        it('should return an error if missing "title" field', function () {
            const newItem = {
                'content': 'this note has no title'
            };
            return chai.request(app)
                .post('/api/notes')
                .send(newItem)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `title` in request body');
                });
        });
    });

    describe('PUT /api/notes/:id endpoint', function(){

        it('should update a note when given update data', function(){

            const updateNote = {
                title: 'This note title is being updated!',
                content: 'updated content'
            };

            let data;

            return Note.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/notes/${data.id}`)
                        .send(updateNote);
                })
                .then(res => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.include.all.keys('id', 'title', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.title).to.equal(updateNote.title);
                    expect(res.body.content).to.equal(updateNote.content);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.be.greaterThan(data.updatedAt);
                });
        });

        it('should return an error if missing "title" field', function () {
            const updateItem = {
                'content': 'this title is being updated'
            };

            let data;
            return Note.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/notes/${data.id}`)
                        .send(updateItem);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `title` in request body');
                });
        });
    });
    
    describe('DELETE /api/notes/:id endpoint', function(){

        it('should delete a note a return a 204 status', function(){
            let data;

            return Note.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).delete(`/api/notes/${data.id}`);
                })
                .then(res => {
                    expect(res).to.have.status(204);
                    expect(res.body).to.be.empty;
                    return Note.count({ _id: data.id });
                })
                .then(count=> {
                    expect(count).to.equal(0);
                }); 
        });
    });
});