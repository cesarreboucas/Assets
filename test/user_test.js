const mongoose = require('mongoose');
const assert = require('assert');
const Faker = require('faker');
const User = require('../models/user');

var user_params = {
    username: Faker.internet.userName(),
    password: Faker.internet.password(10),
    first_name: Faker.name.firstName(),
    last_name: Faker.name.lastName(),
    date_of_birth: Faker.date.between('01-01-1900', '01-01-2000')
};

describe("Users test mocha", function(){
    before(function(){
        User.collection.drop().then(function(error, result){
            console.log(error);
        });
    });
    beforeEach(function(){
        user_params = {
            username: Faker.internet.email(),
            password: Faker.internet.password(10),
            first_name: Faker.name.firstName(),
            last_name: Faker.name.lastName(),
            date_of_birth: Faker.date.between('01-01-1900', '01-01-2000')
        };
    });
    it("Fails to add username, special characters [$%()]", function(done){
        user_params.username += '$';
        var user = new User(user_params);
        user.save(function(error){
            assert(error.errors.username.message, `${user_params.username} is in a wrong format!`);
            done();
        });
    });
    it("Fails to add password, special characters [$%()]", function(done){
        user_params.password += '$';
        var user = new User(user_params);
        user.save(function(error){
            assert(error.errors.password.message, `${user_params.password} is in a wrong format!`);
            done();
        });
    });
    it("Fails to add first name, special characters [$%()]", function(done){
        user_params.first_name += '$';
        var user = new User(user_params);
        user.save(function(error){
            assert(error.errors.first_name.message, `${user_params.first_name} is in a wrong format!`);
            done();
        });
    });
    it("Fails to add last name, special characters [$%()]", function(done){
        user_params.last_name += '$';
        var user = new User(user_params);
        user.save(function(error){
            assert(error.errors.last_name.message, `${user_params.last_name} is in a wrong format!`);
            done();
        });
    });
    it('Add a user', function(done){
        user_params = {
            username: Faker.internet.email(),
            password: Faker.internet.userName(),
            first_name: Faker.name.firstName(),
            last_name: Faker.name.lastName(),
            date_of_birth: Faker.date.between('01-01-1900', '01-01-2000')
        };
        var user = new User(user_params);
        try {
            user.save().then(function(){
                assert(user.isNew === false);
                done();
            });
        } catch (error) {
            console.log(error);
        }
    });
});
