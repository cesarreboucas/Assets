const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const Asset = require('../models/asset');
const mongoose = require('mongoose');

const userController = require('../controllers/userController');
const assetController = require('../controllers/assetController');
const goalController = require('../controllers/goalController');

/*********** API User Routes *************/
router.post('/api/signup', bodyParser.urlencoded({ extended: false }), userController.signUp);
router.post('/api/login', bodyParser.urlencoded({ extended: false }), userController.logIn);
router.post('/api/forgot_password', userController.forgotPassword);
router.post('/api/reset_password', bodyParser.urlencoded({ extended: false }), userController.resetPassword);
router.get('/api/users/list', userController.authenticate, userController.list);
router.get('/api/users/read/:id', userController.authenticate, userController.read);
router.put('/api/users/update/:id', userController.authenticate, userController.update);
router.delete('/api/users/remove/:id', userController.authenticate, userController.remove);
/****************************************/

/******** API Assets Routes *************/
router.get('/api/assets/queryquote', userController.authenticate, assetController.getSearchQuotes);
router.get('/api/assets', userController.authenticate, assetController.getAllAssets);
router.get('/api/assets/:asset', userController.authenticate, assetController.getAssetById);
router.post('/api/assets', userController.authenticate, assetController.newAsset);
router.post('/api/assets/movement', userController.authenticate, assetController.newMovement);
router.put('/api/assets', userController.authenticate, assetController.editAsset);
router.delete('/api/assets', userController.authenticate, assetController.deleteAsset);
router.put('/api/assets/movement', userController.authenticate, assetController.editMovement);
/****************************************/

/******** API Goals Routes *************/
router.get('/api/goals', userController.authenticate, goalController.getAllGoals);
router.post('/api/goals', userController.authenticate, goalController.createGoal);
router.put('/api/goals', userController.authenticate, goalController.updateGoal);
router.get('/api/goals/:goal', userController.authenticate, goalController.getGoal);
router.delete('/api/goals', userController.authenticate, goalController.deleteGoal);
router.post('/api/goals/graph', /*userController.authenticate,*/ goalController.getGraph);
/****************************************/

/******** API Quotes Routes *************/
router.get('/refresh_quotes', assetController.refreshQuotes);
router.get('/quotes', assetController.getQuotes);

/****************************************/

module.exports = router;