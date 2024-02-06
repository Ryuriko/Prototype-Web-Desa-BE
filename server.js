// Third party
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const { query, check, validationResult, body} = require('express-validator')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')
const ObjectID = require('mongodb').ObjectId
const methodOverride = require('method-override')
const multer = require('multer')

// Local
require('./utils/db.js')
const Ktp = require('./model/Ktp.js')

require('dotenv').config()
const app = express()
const port = 3000

// Set up
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser('secret'))
app.use(session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}))
app.use(flash())
app.use(methodOverride('_method'))
const storage = multer.diskStorage({
    destination: 'public/img/',
    filename: (req, file, cb) =>{
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Hanya gambar yang diterima'))
        }
        cb(null, true)
    }
})

// Data
const datas = require('./data/berita.js');

app.get('/', (req, res) =>{
    res.render('index', {
        layout: 'layouts/main',
        page: 'beranda',
        success: req.flash('success'),
        failed: req.flash('failed'),
        datas,
    })
})

app.get('/admin', async (req, res) =>{
    const ktps = await Ktp.find()

    res.render('admin/index', {
        ktps,
        page: 'admin',
        success: req.flash('success'),
        failed: req.flash('failed'),
        layout: 'layouts/main',
    })
})

app.get('/berita', (req, res) =>{
    res.render('berita/index', {
        layout: 'layouts/main',
        page: 'berita',
        datas
    })
})

app.get('/berita/:title', (req, res) =>{
    const data =  datas.find((item) => item.title === req.params.title)
    if (!data) {
        res.status(404)
        res.send('<h1>404</h1>')
    }

    res.render('berita/show', {
        data,
        datas,
        page: 'berita',
        layout: 'layouts/main',
    })
})

app.get('/pelayanan/ktp', (req, res) =>{
    res.render('pelayanan/create', {
        data: {
            nama: '',
            nik: '',
        },
        page: 'pelayanan',
        subPage: 'ktp',
        layout: 'layouts/main',
    })
})

app.post('/pelayanan/ktp',
    upload.single('kk'),
    [
        check('nama', 'Nama tidak boleh kosong').notEmpty(),
        body('nik').custom(async (value, { req }) =>{
            if(value.length === 0) {
                throw new Error('NIK tidak boleh kosong')
            }

            const duplikat = await Ktp.findOne({ nik: req.body.nik})
            if(duplikat) {
                throw new Error('Data dengan NIK tersebut telah melakukan permintaan layanan KTP')
            }

            return true;
        }),
        body('kk').custom((value, { req }) => {
            if (!req.file) {
                throw new Error('Kartu Keluarga is required');
            }
            return true;
        }),
        body('kp', 'Kampung tidak boleh kosong').notEmpty(),
        check('perihal', 'Perihal harus di isi').notEmpty(),
    ],
    (req, res) =>{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            res.render('pelayanan/create', {
                page: 'pelayanan',
                errors: errors.array(),
                layout: 'layouts/main',
                data: req.body,
            })
        } else {
            newArray = {
                ...req.body,
                kk: req.file.originalname
            }

            Ktp.insertMany(newArray)
            .then((result) => {
                req.flash('success', 'Data berhasil ditambahkan')
                res.redirect('/')  
            })
        }
    }
)

app.get('/pelayanan/ktp/:_id', async (req, res) =>{
    const data = await Ktp.findOne({ _id: req.params._id })
    res.render('pelayanan/edit', {
        data,
        page: 'pelayanan',
        layout: 'layouts/main',
    })
})

app.delete('/pelayanan/ktp/:id', (req, res) =>{
    Ktp.deleteOne({ _id: req.params.id})
        .then((result) => {
            req.flash('success', 'Data berhasil dihapus')
            res.redirect('/admin')
        })
        .catch((error) => {
            if(error.message == `Cast to ObjectId failed for value "${req.params.id}" (type string) at path "_id" for model "Ktp"`) {
                req.flash('failed', 'Data tidak ditemukan')
                res.redirect('/admin')
            } else {
                req.flash('failed', error.message)
                res.redirect('/admin')
            }
        })
})

app.put('/pelayanan/ktp/',
    [
        check('nama', 'Nama tidak boleh kosong').notEmpty(),
        body('nik').custom( async (value, { req }) =>{
            if(value.length == 0) {
                throw new Error('NIK tidak boleh kosong')
            }

            if(value !== req.body.oldNik) {
                const duplikat = await Ktp.findOne({ nik: value })
                if(duplikat) {
                    throw new Error('Data dengan NIK tersebut telah melakukan permintaan layanan KTP')
                }
            }

            return true;
        }),
        check('kp', 'Kampung tidak boleh kosong').notEmpty(),
        check('perihal', 'Perihal tidak boleh kosong').notEmpty(),
    ],
    async (req, res) =>{
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            res.render('pelayanan/edit', {
                data : req.body,
                errors: errors.array(),
                page: 'pelayanan',
                layout: 'layouts/main',
            })
            res.end()
        } else {
            Ktp.updateOne({ _id: req.body._id }, 
                {
                    $set: {
                         nama: req.body.nama,
                         nik: req.body.nik,   
                         kp: req.body.kp,   
                         kk: req.body.kk,   
                         perihal: req.body.perihal,   
                    }
                }
                )
                .catch((error) => {
                    req.flash('failed', error.msg)
                    res.redirect('/admin')    
                })
                .then((result) =>{
                    req.flash('success', 'Berhasil mengubah data')
                    res.redirect('/admin')
                    res.end()
                })
        }            
    }
)



// Run server
app.listen(port, (req, res) =>{
    console.log(`Prototype Web Desa | listening at http://localhost:${port}`);
})