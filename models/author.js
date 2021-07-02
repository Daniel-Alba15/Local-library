const mongoose = require('mongoose');
const {DateTime} = require('luxon');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: { type: String, required: true, maxLength: 100 },
    family_name: { type: String, required: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date }

});

AuthorSchema.virtual('date_of_birth_formatted').get(function () {
    if (this.date_of_birth == undefined) {
        return 'No data'
    }
    
    return DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);    
});

AuthorSchema.virtual('date_of_death_formatted').get(function () {
    if (this.date_of_death == undefined) {
        return 'No data'
    }
    
    return DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);    
});

AuthorSchema.virtual('name').get(function () {
    return this.family_name + ', ' + this.first_name;
});

AuthorSchema.virtual('lifespan').get(function () {
    if (this.date_of_birth == undefined) {
        return 'No data';
    } else if (this.date_of_death == undefined) {
        const currentYear = new Date().getFullYear();

        return (currentYear - this.date_of_birth.getFullYear()).toString();
    }

    return (this.date_of_death.getFullYear() - this.date_of_birth.getFullYear()).toString();
});

AuthorSchema.virtual('url').get(function () {
    return '/catalog/author/' + this._id;
});

module.exports = mongoose.model('Author', AuthorSchema);