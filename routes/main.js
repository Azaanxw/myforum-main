module.exports = function(app) {
    // Handle our routes

    // Authentication check to see if user is logged in or not

    var isAuthenticated = (req, res, next) => {
        if (req.session && req.session.userId) { // checks to see if user is authenticated
            console.log("Successfully logged in!"); 
            next();
        } else { // if user isn't logged in, then redirect to home page
            console.log("Error! Please login to see all pages!"); 
            res.redirect('/login');
        }
    };

    // Checks to see if login details are valid 

    app.post('/login', (req, res) => {
        const { username, password } = req.body; // grabs the data from the body
    
        // Checks database to see if username and password match
        const sql = 'SELECT * FROM user WHERE username = ? AND password = ?';
        db.query(sql, [username, password], (error, results) => {
            if (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
                return;
            }
    
            if (results.length > 0) { // checks to see if username and password combination exists

                console.log('Login successful!');
                req.session.userId = results[0].user_id; // assigns the session.userId from the user that was just logged in
                res.redirect('/'); // redirects to home page after login

            } else { // if sername and password combination doesn't exist, it redirects to login page
                
                console.log('Invalid username or password');
                res.redirect('/login'); // Redirect back to the login page or handle the error accordingly

            }
        });
    });
    
    // Homepage Route
    app.get('/', isAuthenticated, (req, res) => {
       // Sends session data to index.ejs
        let newData = { sessionData: req.session };
        res.render('index.ejs', newData);
    });

    // About route
    app.get('/about',isAuthenticated,(req,res) =>{
        // Sends session data to index.ejs
        let newData = { sessionData: req.session };
        res.render('about.ejs',newData)
    });
    
    // Lists posts route
    app.get('/listposts',isAuthenticated,(req,res) => {
        let sqlquery = "SELECT * FROM post"; // query database to get all the posts
        // execute sql query
        db.query(sqlquery, (err,result) => {
            if (err) {
                res.redirect('./');
            }
            res.render('listposts.ejs', {posts:result})
        })
    });

    // Logout route for when the user presses Log out
    app.get('/logout', (req, res) => {

        req.session.destroy(err => { // destroys current session and returns user back to login page
            if (err) {
                console.error(err);
            } else {
               console.log("Logged out!");
                res.redirect('/login');
            }
        });
        
    });

    // Login Page
    app.get('/login',function(req,res){
        res.render('login.ejs')
    });

    // Register Page
    app.get('/register',function(req,res){
        res.render('register.ejs')
    });

// Adds new user details to database from register forum
app.post('/register', (req, res) => {

    const { username, firstName, lastName, email, confirmEmail, password, confirmPassword } = req.body; // grabs the data from the req.body 

        // Adds the new user to the database
        const newUser = {
            username: username,
            first_name: firstName,
            last_name: lastName,
            email: email,
            password: password
        };

        // Insert the user into the database
        db.query('INSERT INTO user SET ?', newUser, (error, results) => {
            if (error) {
                console.error(error);
                res.redirect('/register'); // redirects to register page if theres any erros
            } else {
                console.log("Registration successful!")
                res.redirect('/login'); // redirects to login page for the user to login if registration is successful
            }
        });
    
});

};