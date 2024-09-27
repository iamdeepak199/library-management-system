const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();

// Set up MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',                          //password
  database: 'liftdb'
});

// Check MySQL connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save the file with a unique name
  }
});

const upload = multer({ storage: storage });

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files for CSS
app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static('uploads'));


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Handle the form submission for adding a lift
app.post('/add', upload.single('photo'), (req, res) => {
  const {Name, phn_no, Roll_no, branch, Book_name, issue_date } = req.body;
  const photo = req.file.filename; // Name of the uploaded file

  // Insert data into MySQL
  const sql = `INSERT INTO lifts (Name, phn_no, Roll_no, branch, Book_name, photo, issue_date) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [Name, phn_no, Roll_no, branch, Book_name, photo, issue_date], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Database error');
    }
    res.send('Lift added successfully');
  });
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.execute(query, [username], (err, results) => {
      if (err) {
          res.status(500).send(`
              <script>
                  alert('Database query error!');                                                           
              </script>
          `);      
          return;
      }

      if (results.length > 0) {
          const user = results[0];
          bcrypt.compare(password, user.password, (err, isMatch) => {
              if (err) {
                  res.status(500).send(`
                      <script>
                          alert('Error comparing passwords');                             
                          window.location.href = '/login';                                
                      </script>
                  `);      
                  return;
              }

              if (isMatch) {
                  //console.log(user);
                  req.session.user = user;
                  res.redirect('/dashboard');
              } else {
                  res.status(401).send(`
                      <script>
                          alert('Invalid credentials!');                             
                          window.location.href = '/login';                                
                      </script>
                  `);      
                  
              }
          });
      } else {
          res.status(401).send(`
              <script>
                  alert('Invalid credentials!');                             
                  window.location.href = '/login';                               
              </script>
          `);      
      }
  });
});








// GET route for the index page
app.get('/', (req, res) => {
  res.render('index');
});
// GET route for the login page
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/returnbook', (req, res) => {
  res.render('returnbook');
});


app.get('/edit', (req, res) => {
  res.render('edit');
});


app.get('/delete', (req, res) => {
  res.render('delete');
});

app.get('/defaulters', (req, res) => {
  res.render('defaulters');
});




// GET route for displaying users' details
app.get('/lifts', (req, res) => {
  // Fetch data from MySQL `lifts` table
  const sql = 'SELECT * FROM lifts';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Database error');
    }
    // Render the `display.ejs` template and pass the fetched data
    res.render('display', { lifts: results });
  });
});


//update ----------------

app.post('/update', (req, res) => {
  const s_no = req.params.s_no;
  const { name, phn_no, roll_no, branch, book_name, issue_date } = req.body;
  
  // Update the user record in the database
  const query = `
      UPDATE lifts 
      SET name = ?, phn_no = ?, roll_no = ?, branch = ?, book_name = ?, issue_date = ? 
      WHERE s_no = ?
  `;
  db.query(query, [name, phn_no, roll_no, branch, book_name, issue_date, s_no], (err, result) => {
      if (err) throw err;
      
      // Redirect back to the list page after updating
      res.redirect('/list');
  });
});



// Delete route
app.post('/delete', (req, res) => {
  const {roll_no } = req.body; // Get values from the form

  // SQL query to delete the record
  const query = 'DELETE FROM lifts WHERE roll_no = ?';
  db.query(query, [roll_no], (err, result) => {
      if (err) {
          console.error('Error deleting data:', err);
          return res.status(500).send('Error deleting data');
      }

      if (result.affectedRows > 0) {
          res.send('Record deleted successfully');
      } else {
          res.send('No record found with the given details');
      }
  });
});


// GET route for displaying users' details
app.get('/lifts', (req, res) => {
  // Fetch data from MySQL `lifts` table
  const sql = 'SELECT * FROM lifts';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Database error');
    }
    // Render the `display.ejs` template and pass the fetched data
    res.render('display', { lifts: results });
  });
});


// Start the server
app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
