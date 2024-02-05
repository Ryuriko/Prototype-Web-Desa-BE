const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/prototype-web-desa')
    .then(() => console.log('Connected!'))