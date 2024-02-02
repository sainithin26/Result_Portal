const express = require('express');
const bodyParser = require('body-parser');
const path = require('path')
const url = require('url');
const querystring = require('querystring');
const http = require('http');
const { createPool } = require('mysql');

const app = express();
const port = 3003;

const pool = createPool({
    host: "results-database.cbeomim42od1.us-east-1.rds.amazonaws.com",
    user: "admin",
    password: "jntuacek",
    database: "newschema",
    connectionLimit: 10
});

function getlink(){
    const server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url);
        const queryParams = querystring.parse(parsedUrl.query);
        const id = queryParams.id;
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`ID: ${id}`);
    });
}


// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, ''));
app.use(express.static('public'));
//
// Create a connection pool to the database

app.get('/', (_req, res) => {
    pool.query(`SELECT * FROM regulations`, (err, result, _fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving data from database');
        }
        res.render('template1', { regulations: result });
    });
});
//
// Route to render the form
app.get('/form', (req, res) => {
    getlink();
    const id = req.query.id;
    res.render('template3', {id:id});
});

    // app.get('/resForm', (req, res) => {
    //     getlink()
    //     const id = req.query.id;
    //     res.render('template2', { id: id,});
    // });

// Route to handle form submission
app.post('/submit', (req, res) => {
    getlink();
    const id = req.query.id;
    const rollno = req.body.rollno;
    
    if (!rollno || !id) {
        return res.status(400).send('Roll number or ID is missing');
    }

    pool.query('SELECT result_id, student_name, roll_no FROM students WHERE roll_no = ? AND regulation_id = ?', [rollno, id], (err, result, _fields) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error retrieving data from database');
        }
        
        if (result.length === 0) {
            return res.status(404).send('No data found for the given roll number and ID');
        }

        const result_id = result[0].result_id;
        pool.query('SELECT * FROM results WHERE result_id = ?', [result_id], (err, result1, _fields) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error retrieving data from database');
            }
            res.render('results', { results: result1, name: result[0].student_name, rollno: result[0].roll_no });
        });
    });
});

//


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
