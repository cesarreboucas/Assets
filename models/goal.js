const mongoose = require('mongoose');
//const user = mongoose.model('user', UserSchema);

const Schema = mongoose.Schema;
const GoalSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Um User e necessario'],
      ref: 'user'
    },
    name: {
      type: String,
      default: ''
    },
    insertAssets: {
      type: Boolean,
      default: true
    },
    returnWithIrr: {
      type: Boolean,
      default: true
    },
    useAssetIrrOnResult: {
      type: Boolean,
      default: true
    },
    irrOnResult: {
      type: Number,
      default: 0
    },
    boxes: [{
      description: { type: String, default: '' },
      periodicity: { type: String, default: '' },
      value: { type: Number, default: 0 },
      dateStart: { type: String, default: (new Date()).toISOString() },
      dateEnd: { type: String, default: (new Date()).toISOString() },
      interestRate: { type: Number, default: 1 },
      useIRR: { type: Boolean, default: false },
    }]
  }
);

module.exports = mongoose.model('goal', GoalSchema);
