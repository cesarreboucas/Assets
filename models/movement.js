const mongoose = require('mongoose');
const momentjs = require('moment');
const Schema = mongoose.Schema;

const MovementSchema = new Schema({
  /*mov_id: { type: mongoose.Schema.Types.ObjectId },*/
  date: {
    type: Date,
    required: [true, 'We need a date for each Movement'],
    default: new Date()
  }, 
  kind: {
    type: String,
    required: [true, 'The kind of movement must be specified'],
    default: 'div'
  },
  value: {
    type: Number,
    default: 0
  },
  comment: {
    type: String, max: [40, 'Sorry you reached the maximum number of characters'],
    default: null
  },
});

MovementSchema.virtual('interval').get(function() {
  
  let today = momentjs().startOf('d');
  today.add(momentjs().utcOffset(), 'm'); // utcOffset is negative to Vancouver, Removing 8 hours.
  today.utcOffset(0);// Bringing to UTC
  //console.log("TODAY", today.format());
  const movementDate = momentjs(this.date);
  movementDate.utcOffset(0); // Comes from Mongo in UTC, No need to add or remove;
  //console.log("Movement", movementDate.format());
  //console.log('DURATION', momentjs.duration(today.diff(movementDate)).asYears());

  return momentjs.duration(today.diff(movementDate)).asYears();
});

const Movement = mongoose.model('movement', MovementSchema);
module.exports = {
  MovementSchema,
  Movement
};
