'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const app = require('../server');
const { TEST_MONGODB_URI } = require('../config');

const Tag = require('../models/tag');
const seedTags = require('../db/seed/tags');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - tags', function() {
    before(function () {
        return mongoose.connect(TEST_MONGODB_URI)
            .then(() => mongoose.connection.db.dropDatabase());
    });

    beforeEach(function() {
        return Promise.all([
            Tag.insertMany(seedTags),
            Tag.createIndexes()
        ]);
    });

    afterEach(function () {
        return mongoose.connection.db.dropDatabase();
    });

    after(function () {
        return mongoose.disconnect();
    });

    describe('GET /api/tags endpoint', function() {
        it('should return all tags sorted by name', function(){
            return Promise.all([
                Tag.find().sort('name'),
                chai.request(app).get('/api/tags')
            ])
                .then(([data, res]) => {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('array');
                    expect(res.body).to.have.length(data.length);
                });
        });

        it('should return a list of tags with correct fields', function(){
            return Promise.all([
                Tag.find().sort('name'),
                chai.request(app).get('/api/tags')
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
        
        it('should return correct tag', function(){
            let data;
            return Tag.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).get(`/api/tags/${data.id}`);
                })
                .then(res => {
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
                .get('/api/tags/NOT-A-VALID-ID')
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.eql('The `id` is not valid');
                });
        });

        it('should respond with a 404 for an ID that does not exist', function () {
            // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
            return chai.request(app)
                .get('/api/tags/DOESNOTEXIST')
                .then(res => {
                    expect(res).to.have.status(404);
                });
        });

    });

    describe('POST /api/tags endpoint', function(){
        it('should create a new folder when provided correct data', function(){
            const newTag = { name: 'new tag' };

            let res;
            return chai.request(app)
                .post('/api/tags')
                .send(newTag)
                .then(function(_res){
                    res = _res;

                    expect(res).to.have.status(201);
                    expect(res).to.have.header('location');
                    expect(res).to.be.json;
                    expect(res.body).to.a('object');
                    expect(res.body).to.include.all.keys('id', 'name', 'createdAt', 'updatedAt');
                    return Tag.findById(res.body.id);
                })
                .then(data => {
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.name).to.equal(data.name);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    expect(new Date(res.body.updatedAt)).to.eql(data.updatedAt);
                });
                
        });

        it('should return an error if missing "name" field', function () {
            const newTag = {
                notName: 'this tag has no `title`'
            };
            return chai.request(app)
                .post('/api/tags')
                .send(newTag)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `name` in request body');
                });
        });

        it('should return an error when given a duplicate name', function () {
            return Tag.findOne()
                .then(data => {
                    const newTag = { 'name': data.name };
                    return chai.request(app).post('/api/tags').send(newTag);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Tag name already exists');
                });
        });

    });

    describe('PUT /api/tags/:id endpoint', function(){
        it('should update the tag when given update data', function () {
            const updateTag = { name: 'Updated Name' };

            let data;

            return Tag.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/tags/${data.id}`)
                        .send(updateTag);
                })
                .then(function (res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body).to.have.all.keys('id', 'name', 'createdAt', 'updatedAt');
                    expect(res.body.id).to.equal(data.id);
                    expect(res.body.name).to.equal(updateTag.name);
                    expect(new Date(res.body.createdAt)).to.eql(data.createdAt);
                    // expect item to have been updated
                    expect(new Date(res.body.updatedAt)).to.greaterThan(data.updatedAt);
                });

        });

        it('should respond with a 400 for an invalid id', function () {
            const updateTag = { 'name': 'Blah' };
            return chai.request(app)
                .put('/api/tags/NOT-A-VALID-ID')
                .send(updateTag)
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res.body.message).to.eq('The `id` is not valid');
                });
        });

        it('should respond with a 404 for an id that does not exist', function () {
            const updateTag = { 'name': 'Blah' };
            // The string "DOESNOTEXIST" is 12 bytes which is a valid Mongo ObjectId
            return chai.request(app)
                .put('/api/tags/DOESNOTEXIST')
                .send(updateTag)
                .then(res => {
                    expect(res).to.have.status(404);
                });
        });

        it('should return an error if missing "name" field', function () {
            const updateTag = {};

            let data;
            return Tag.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app)
                        .put(`/api/tags/${data.id}`)
                        .send(updateTag);
                })
                .then(res => {
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Missing `name` in request body');
                });
        });

        it('should return an error when given a duplicate tag name', function(){
            return Tag.find().limit(2)
                .then(results => {
                    const [item1, item2] = results;
                    item1.name = item2.name;
                    return chai.request(app)
                        .put(`/api/tags/${item1.id}`)
                        .send(item1);
                })
                .then(res => {
                    // const body = res.body;
                    expect(res).to.have.status(400);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a('object');
                    expect(res.body.message).to.equal('Tag name already exists');
                });
        });

    });

    describe('DELETE /api/folders/:id', function(){

        it('should delete an existing tag and respond with 204 status', function(){
            let data;
            return Tag.findOne()
                .then(_data => {
                    data = _data;
                    return chai.request(app).delete(`/api/tags/${data.id}`);
                })
                .then(function(res){
                    expect(res).to.have.status(204);
                    expect(res.body).to.be.empty;
                    return Tag.count({_id: data.id });
                })
                .then(count => {
                    expect(count).to.equal(0);
                });
        });
    });
});