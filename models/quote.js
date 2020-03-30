/**
 {
    "Global Quote": {
        "01. symbol": "MSFT",
        "02. open": "167.5100",
        "03. high": "167.5300",
        "04. low": "164.4500",
        "05. price": "165.0400",
        "06. volume": "24468140",
        "07. latest trading day": "2020-01-24",
        "08. previous close": "166.7200",
        "09. change": "-1.6800",
        "10. change percent": "-1.0077%"
    }
}
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuoteSchema = new Schema({
    symbol: {
        type: String,
        unique: true,
        },
    open: {
        type: Number,
        },
    high: {
        type: Number,
        },
    low: {
        type: Number,
        },
    price: {
        type: Number,
        },
    volume: {
        type: Number,
        },
    lastest_trading_day: {
        type: Date,
        },
    previous_close: {
        type: Number,
        },
    change: {
        type: Number,
        },
    change_percent: {
        type: Number,
        },
});


// Export model
module.exports = mongoose.model('quote', QuoteSchema);