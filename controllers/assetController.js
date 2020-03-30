const Asset = require('../models/asset.js');
const { Movement } = require('../models/movement.js');
const alphaVatage = require('../services/alphaVantageWorker');
const momentjs = require('moment');
const Quotes = require('../models/quote');
const User = require('./../models/user.js');


/*************************************/
// Get a list of assets with or without IRR and a AssetsSumary
async function getAllAssets(request, response) {
    let Assets = await Asset.find({ user_id: request.user.id }).sort('code').collation({ locale: "en", strength: 1 });
    let AssetTotal = new Asset();
    if (request.query.irr !== undefined && request.query.irr === '1') {
        AssetTotal = new Asset();
        AssetTotal.unit = 0;
        AssetTotal.balance = 1;
        AssetTotal.sum_in = 0;
        AssetTotal.sum_out = 0;
        for (let x = 0; x < Assets.length; ++x) {
            //Assets[x].setInterval();
            Assets[x].sortMovements();
            Assets[x].setGuess();
            // Building AssetTotal
            Assets[x].movements.forEach(movement => {
                AssetTotal.movements.push(movement);
            });
            AssetTotal.movements.pop();
            AssetTotal.unit += Assets[x].total;
            AssetTotal.sum_in += Assets[x].sum_in;
            AssetTotal.sum_out += Assets[x].sum_out;
        }
        AssetTotal.setGuess();
        //Excluding movements before send.
        AssetTotal.movements = [];
    }
    const newStats = {asset_amt: AssetTotal.total, return:AssetTotal.irr};
    await User.findOneAndUpdate({ _id: request.user.id }, {stats : newStats});
    response.json({ assets: Assets, asset_total: AssetTotal });
}

/*************************************/
// Get One Asset by its ID
async function getAssetById(request, response) {
    let asset = await Asset.findOne({ user_id: request.user.id, _id: request.params.asset });
    response.json(asset);
}

/*************************************/
// Add a new Asset
async function newAsset(request, response) {

    let balance = (isNumeric(Number(request.body.balance))?Number(request.body.balance):0);
    let unit = (isNumeric(Number(request.body.unit))?Number(request.body.unit):0);
    let total = balance * unit;

    let today = momentjs().startOf('d');
    today.add(momentjs().utcOffset(), 'm'); // utcOffset is negative to Vancouver, Removing 8 hours.
    today.utcOffset(0);// Bringing to UTC

    //Default Movement
    let movement = new Movement({
        date: today.toDate(),
        kind: 'buy',
        value: -total,
        comment: '',
    });

    let asset = new Asset({
        user_id: request.user.id,
        name: request.body.name,   
        movements: [movement],
        balance: balance,
        unit: unit,
    });

    //No requided info
    if(request.body.autorefresh && request.body.code) {
        asset.autorefresh = true;
        asset.code = request.body.code; 
    } else {
        asset.autorefresh = false;
        asset.code = ''; 
    }    
    if(request.body.group_a) { asset.group_a = request.body.group_a; }
    if(request.body.group_b) { asset.group_b = request.body.group_b; }
    if(request.body.group_c) { asset.group_c = request.body.group_c; }

    try {
        //new var to force tha catch if that is the case
        const saved = await asset.save();
        response.json(saved);
    } catch (err) {
        console.log(err);
        response.status(500).send(err.message);
    }
}

/*************************************/
// Add a new Movement to a movement
async function newMovement(request, response) {
    let increment = 0;
    let value = Number(request.body.value);
    switch (request.body.kind) {
        case "sell": //Decrement
            increment = -(Number(request.body.quantity));
            break;
        case "buy": // Increment
            increment = (Number(request.body.quantity));
            value = -Math.abs(value);
            break;
        default:
            break;
    }

    let movement = new Movement({
        date: request.body.date,
        kind: request.body.kind,
        value: value,
        comment: request.body.comment,
    });

    try {
        let asset = await Asset.findOneAndUpdate({ _id: request.body.asset }, {
            $inc: { balance: increment },
            $push: { movements: movement }
        });
        response.json(movement);

    } catch (error) {
        response.status(500).send(error.message);
    }
}

async function deleteAsset(request, response) {
    try {
        await Asset.findByIdAndDelete({user_id: request.user.id, _id: request.body._id});    
        response.send({"deleted":true});
    } catch (error) {
        response.status(500).send({ message: error.message });
    }
}

/************************************************************/
//Edit Asset
async function editAsset(request, response) {
    let partialAsset = {
        name: request.body.name,
        balance: Number(request.body.balance),
        unit: Number(request.body.unit),
        autorefresh: request.body.autorefresh
    };

    //No requided info
    if(request.body.autorefresh && request.body.code) {
        partialAsset.autorefresh = true;
        partialAsset.code = request.body.code; 
    } else {
        partialAsset.autorefresh = false;
        partialAsset.code = ''; 
    }    
    if(request.body.group_a) { partialAsset.group_a = request.body.group_a; }
    if(request.body.group_b) { partialAsset.group_b = request.body.group_b; }
    if(request.body.group_c) { partialAsset.group_c = request.body.group_c; }
    
    try {
        await Asset.findOneAndUpdate({ user_id: request.user.id, _id: request.body._id }, {
            $set: partialAsset
        });        
        response.json(partialAsset);

    } catch (error) {
        response.status(500).send(error.message);
    }
}

/************************************************************/
// Edit Movement
async function editMovement(request, response) {

    if (request.body.delete !== undefined && request.body.delete) {
        const movement = await Asset.findOneAndUpdate({ user_id: request.user.id, _id: request.body.asset },
             { $pull: { movements: { _id: request.body.movement } } });
             response.json(movement);
    } else {
        //console.log(request.body.date);
        const partialMovement = {
            date: new Date(request.body.date),
            kind: request.body.kind,
            value: Number(request.body.value),
            comment: request.body.comment,
        };

        try {

            let asset = await Asset.findOne({ user_id: request.user.id, _id: request.body.asset });
            let movement = asset.movements.id(request.body.movement);
            movement.set(partialMovement);
            await asset.save();          
            response.json(movement);
            
        } catch (error) {
            response.status(500).send(error.message);
        }

    }
}

async function refreshQuotes(req, res) {
    await alphaVatage.updateQuotes();
    res.send({ message: 'QUOTES_REFRESHED' });
}


async function getSearchQuotes(req, res) {
    try {
        //console.log("QUERY: ",req.query.query);
        let queryResult = await alphaVatage.searchQuote(req.query.query);
        //console.log(queryResult);
        let results = queryResult.map((result) => {
            let obj = {};
            obj.code = result['1. symbol'];
            obj.name = result['2. name'];
            obj.currency = result['8. currency']
            return obj;
        });
        res.send(results);
    } catch (error) {
        res.send(error);
    }
}

async function getQuotes(req,res){
    try {
        let quotes = await Quotes.find();

        res.send(quotes);
        
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    getAllAssets,
    getAssetById,
    newAsset,
    newMovement,
    editAsset,
    deleteAsset,
    editMovement,
    refreshQuotes,
    getSearchQuotes,
    getQuotes
};

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }






