// Third party
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const { query, check, validationResult } = require('express-validator')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')

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
    saveUnitialized: true,
}))
app.use(flash())

// Data
const datas = require('./data/berita.js');

app.get('/', (req, res) =>{
    res.render('index', {
        layout: 'layouts/main',
        page: 'beranda',
        datas,
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
        page: 'pelayanan',
        subPage: 'ktp',
        layout: 'layouts/main',
    })
})

app.post('/pelayanan/ktp',
    (req, res) =>{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            console.log(errors);
            res.render('pelayanan/create', {
                page: 'pelayanan',
                errors: errors.array(),
                layout: 'layouts/main',
            })
        } else {
            Ktp.insertMany(req.body)
            .then((result) => {
                // console.log(result)
                // req.flash('success', 'Data berhasil ditambahkan')
                res.redirect('/')  
            })
            .catch((errors) => {
                console.log(errors);
                res.render('pelayanan/create', {
                    page: 'pelayanan',
                    errors,
                    layout: 'layouts/main',
                })
            })
        }
    }
)

// Run server
app.listen(port, (req, res) =>{
    console.log(`Prototype Web Desa | listening at http://localhost:${port}`);
})