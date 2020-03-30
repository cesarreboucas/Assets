const mongoose = require('mongoose');
const { MovementSchema } = require('./movement.js');
const { Movement } = require('./movement.js');
const momentjs = require('moment');
const Schema = mongoose.Schema;

const AssetSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'A valid user is necessary'],
      ref: 'user',
    },
    name: {
      type: String,
      default: '',
    },
    code: {
      type: String
    },
    autorefresh: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    unit: { type: Number, default: 0 },
    irr: Number,
    group_a: { type: String, default: '' },
    group_b: { type: String, default: '' },
    group_c: { type: String, default: '' },

    movements: [{ type: MovementSchema, required: [true, 'A movement is needed'] }],
  }
);

AssetSchema.methods.sortMovements = function () {
  this.movements.sort(function (mA, mB) {
    return (mA.date - mB.date);
  });
};

AssetSchema.methods.setGuess = function () {
  //Preparation
  this.sum_in = 0;
  this.sum_out = 0;

  for (let x = 0; x < this.movements.length; ++x) {
    if (this.movements[x].value > 0) {
      this.sum_in += this.movements[x].value;
    } else {
      this.sum_out += this.movements[x].value;
    }
  }

  let today = momentjs().startOf('d');
  today.add(momentjs().utcOffset(), 'm'); // utcOffset is negative to Vancouver, Removing 8 hours.
  today.utcOffset(0);// Bringing to UTC

  let totalMovement = new Movement({
    date: today.toDate(),
    kind: 'holdings',
    value: this.total
  });
  this.movements.push(totalMovement);
  this.sum_in += this.total;
  //End of Preparation

  //Calculus just with a minimum of 29 days. (29/365) = ~ 0.08
  const min_interval = 0.08;
  let invReturn = (this.sum_in / -this.sum_out);

  if (this.movements[0].interval < min_interval || this.movements.length === 2) { //Small Interval or just 2 moviments
    if (isNaN(invReturn) || invReturn <= 0.01) { // No input neither output / big loss
      this.irr = -0.99;
    } else { // Simple Calculus
      console.log('Ret Simple Oper: ' + this.movements.length + ' Interest Rate:' + (Math.pow(invReturn, (1 / Math.max(min_interval, this.movements[0].interval))) - 1) + ' ' + this.name);
      this.irr = (Math.pow(invReturn, (1 / Math.max(min_interval, this.movements[0].interval))) - 1);
    }
  } else {
    if (isNaN(this.irr)) { this.irr = invReturn; }
    this.setIRR();
  }
};

AssetSchema.methods.setIRR = function () {
  let i = 0;
  let vp_all = 0;
  let vp_second = 0;
  let guess_second = 0;
  let vp_third = 0;
  let guess_third = 0;

  do {
    // Guess Security
    if ((this.irr > 2 && i === 0) || (this.irr < -0.5 && i === 0) || isNaN(this.irr)) { // Bigger than 200% or less than -50%
      this.irr = 0.1 * i;
    }
    ++i;
    vp_all = this.checkVP();

    if (isNaN(vp_all)) {
      this.irr = 0;
      vp_all = this.checkVP();
      if (isNaN(vp_all)) {
        i = 100;
        this.irr = 0;
        break;
      }
    }

    vp_third = vp_second;
    guess_third = guess_second;
    vp_second = vp_all;
    guess_second = this.irr;

    if (i >= 6) {
      if (Math.abs(vp_all) > Math.abs(vp_second) || Math.abs(vp_second) > Math.abs(vp_third)) {
        //Cannot get any NPV equal to 0, probably IRR is imposible.
        i = 100;
        this.irr = 0;
        break;
      }
    }

    console.log('Try: ' + i + ' VP: ' + vp_all.toFixed(4) + ' Guess: ' + this.irr.toFixed(8) + ' IN:' + this.sum_in + ' COD: ' + this.codigo);

    if (vp_third !== 0) {
      this.irr = guess_second - (((guess_third - guess_second) * vp_second) / (vp_third - vp_second));

      console.log('New Gues by Interpolation: ' + this.irr);
      console.log('Used -> Gues_Sec: ' + guess_second + ' Guess_Third: ' + guess_third);
      console.log('Used -> Vp_Sec: ' + vp_second + ' VP_Third: ' + vp_third);

    } else {
      this.irr += (vp_all / this.sum_in);
      console.log('New Gues by else ' + this.irr);
    }


    //console.log("VPS: "+vp_all+" "+vp_second+" "+vp_third);
    console.log('\n');

  } while (Math.abs(vp_all) > 0.01 && i < 100);
  console.log('IRR: ' + Number(this.irr * 100).toFixed(2) + '% Try:' + i);
};

AssetSchema.methods.checkVP = function () {
  let sum = 0;
  let guessPlusOne = (this.irr + 1);
  this.movements.forEach(element => {
    sum += element.value * Math.pow((guessPlusOne), element.interval);
    //console.log(element.value + ' <-> '+element.interval+' <-> '+element.kind);
  });
  //console.log(sum)
  return sum;
};

AssetSchema.virtual('total').get(function () {
  return Number(this.balance * this.unit);
})
  .set(function (v) {
    this.saldo = 1;
    this.unitario = v;
  });

AssetSchema.set('toJSON', { getters: true, virtuals: true });

module.exports = mongoose.model('asset', AssetSchema);

