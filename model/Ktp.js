const mongoose = require('mongoose')

const Ktp = mongoose.model('Ktp', {
    nama: {
        type: String,
        required: true,
    },
    nik: {
        type: String,
        required: true,    
    },
    kp: {
        type: String,
        required: true,    
    },
    kk: {
        type: String,
        required: true,    
    },
    perihal: {
        type: String,
        required: true,    
    },
})

module.exports = Ktp