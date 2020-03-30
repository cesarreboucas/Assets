const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
      username: {
        type: String,
        required: [true, 'An username is required'],
        unique: true,
        validate: {
          validator: (v) =>
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(v),
          message: (props) => `${props.value} is in a wrong format!`,
        },
        max: [50, 'Sorry you reached the maximum number of characters'],
      },
      password: {
        type: String,
        required: [true, 'A password is required'],
        validate: {
          validator: (v) => /^[\w*@#]+$/.test(v),
          message: (props) => `${props.value} is in a wrong format!
          Available characters: [a-z][A-Z]*@#`,
        },
        max: [30, 'Sorry you reached the maximum number of characters'],
      },
      first_name: {
        type: String,
        required: [true, 'Please insert your first name'],
        validate: {
          validator: (v) => /^[\w' ]+$/.test(v),
          message: (props) => `${props.value} is in a wrong format!`,
        },
        max: [30, 'Sorry you reached the maximum number of characters'],
      },
      last_name: {
        type: String,
        required: [true, 'Please insert your last name'],
        validate: {
          validator: (v) => /^[\w' ]+$/.test(v),
          message: (props) => `${props.value} is in a wrong format!`,
        },
        max: [30, 'Sorry you reached the maximum number of characters'],
      },
      forgot_password_token: {
        type: String,
      },
      stats: {
          type: Object,
          asset_amt: { type: Number },
          return: { type: Number }
      }
    }
);

// This happens after validation
UserSchema.post('validate', async function(doc){
    // Criptography the password with MD5 using HEX pattern
    doc.password = crypto.createHash('md5').update(doc.password).digest('hex');
});

// This happens after the save
UserSchema.post('save', function(error, doc, next){
    // Unique error code is 11000
    if(error.name === 'MongoError' && error.code === 11000){
        // Doing this to conform with the errors array pattern in the js.
        let errorKeyValue = /\$([\w\W]+)_[\w\W]+{ : "([\w\W]+)" }/g.exec(error.message);
        let errorObject = {};
        errorObject[errorKeyValue[1]] = 
            { message: `O ${errorKeyValue[1]}: ${errorKeyValue[2]} já existe!` };
        // Pattern error.errors["key"].message = "message"
        next({ errors: errorObject });
    } else {
        next(error);
    }
});

// Virtual for author's full name
// UserSchema
//     .virtual('name')
//     .get(function() {
//       return this.first_name + ', ' + this.last_name;
//     });

// Export model
module.exports = mongoose.model('user', UserSchema);
