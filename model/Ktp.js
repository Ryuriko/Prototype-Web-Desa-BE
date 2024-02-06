const mongoose = require('mongoose')

const Ktp = mongoose.model('Ktp', {
    nama: {
        type: String,
        required: false,
    },
    nik: {
        type: String,
        required: false,    
    },
    kp: {
        type: String,
        required: false,    
    },
    kk: {
        type: String,
        required: false,    
    },
    perihal: {
        type: String,
        required: false,    
    },
})

module.exports = Ktp