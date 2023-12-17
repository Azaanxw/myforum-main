module.exports = function (app) {
  // Authentication check to see if the user is logged in or not
  var isAuthenticated = (req, res, next) => {

    if (req.session && req.session.userId) {
      // checks to see if the user is authenticated
      next();
    } else {
      // if the user isn't logged in, then redirect to the home page
      console.log("Error! Please login to see all pages!");
      res.redirect("/login");
    }

  };

  // Checks to see if login details are valid
  app.post("/login", (req, res) => {
    const { username, password } = req.body; // grabs the data from the body

    // Checks the database to see if username and password match
    const sql = "SELECT * FROM user WHERE username = ? AND password = ?";

    db.query(sql, [username, password], (error, results) => {
      if (error) {
        console.error(error);
        req.flash("error", "Internal Server Error");
        res.redirect("/login");
        return;
      }

      if (results.length > 0) {

        // checks to see if the username and password combination exists
        console.log("Login successful!");
        req.session.userId = results[0].user_id; // assigns the session.userId from the user that was just logged in
        req.flash("success", "Logged in successfully!");
        res.redirect("/"); // redirects to the home page after login

      } else {

        // if the username and password combination doesn't exist, it redirects to the login page
        req.flash("error", "Incorrect username/password!");
        res.redirect("/login"); // Redirect back to the login page 

      }
    });
  });

  // Homepage Route
  app.get("/", isAuthenticated, (req, res) => {

    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    res.render("index.ejs", { successMessage, errorMessage });
  });

  // About route
  app.get("/about", isAuthenticated, (req, res) => {
    res.render("about.ejs");
  });

  // Create posts route
  app.get("/create-post", isAuthenticated, (req, res) => {

    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    // Fetch the list of topics from the database
    const userId = req.session.userId;
    const sqlquery = `
        SELECT topic.topic_id, topic.topic_name
        FROM topic
        JOIN membership ON topic.topic_id = membership.topic_id
        WHERE membership.user_id = ?;
    `;

    db.query(sqlquery, [userId], (err, result) => {
      if (err) {
        console.error(err);
        res.redirect("/");
        return;
      }

      const userTopics = result;

      // Render the create post form with the list of topics
      res.render("create-post.ejs", {
        userTopics,
        errorMessage,
        successMessage,
      });
    });
  });

  // Handles  joining topics
  app.post("/join-topic", (req, res) => {
    const { topic_id } = req.body;
    const user_id = req.session.userId; 

    // Checks if the user is already a member of the topic
    const checkMembershipQuery =
      "SELECT * FROM membership WHERE user_id = ? AND topic_id = ?";
    const getTopicNameQuery = "SELECT topic_name FROM topic WHERE topic_id = ?";

    db.query(getTopicNameQuery, [topic_id], (err, topicResults) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
        return;
      }

      const topicName =
        topicResults.length > 0 ? topicResults[0].topic_name : "Unknown Topic";

      db.query(checkMembershipQuery, [user_id, topic_id], (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).send("Internal Server Error");
          req.flash("error", "Unable to join topic, please try again!");
          res.redirect("/list-topics"); // Redirects back to the list topics page
        }
        // Checks to see if user is already a member 
        if (results.length > 0) {

          req.flash("error", "You are already a member of this topic!");
          res.redirect("/list-topics"); // Redirects back to list topics page

        } else {

          // Checks to see if user is not a member and adds them to the membership table
          const addMembershipQuery =
            "INSERT INTO membership (user_id, topic_id) VALUES (?, ?)";
        
          db.query(addMembershipQuery, [user_id, topic_id], (err) => {
            if (err) {
              console.error(err);
              res.status(500).send("Internal Server Error");
              return;
            }

            req.flash("success", `Successfully joined the topic: ${topicName}`);
            res.redirect("/list-topics"); // Redirects back to list topic after successfully joining the topic
          });
        }
      });
    });
  });

  app.post("/create-post", isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const topic_id = req.body.topic;
    const text = req.body.text;

    // Fetches the topic_id based on the selected topic and inserts the post data into the posts table

    const insertPostQuery =
      "INSERT INTO post (text, user_id, topic_id, date) VALUES (?, ?, ?, NOW())";

    db.query(insertPostQuery, [text, userId, topic_id], (err, result) => {
      if (err) {
        console.error(err); 
        req.flash("error", "Unable to create post, please try again!");
        return res.redirect("/create-post"); // Redirects back to the create post page
      }

      // Updates user credits
      const updateCreditsQuery =
        "UPDATE user SET credits = credits + ? WHERE user_id = ?";
      const creditsToAdd = 20;

      db.query(updateCreditsQuery, [creditsToAdd, userId], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          req.flash("error", "Error updating user credits");
          return res.redirect("/create-post"); // Redirects back to the create post page
        }

        req.flash("success", "Post created successfully!");
        res.redirect("/list-posts"); // Redirects to the list-posts page
      });
    });
  });

  // Lists posts route
  app.get("/list-posts", isAuthenticated, (req, res) => {
    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    let sqlquery =
      "SELECT post.*, user.username, topic.topic_name FROM post " +
      "JOIN user ON post.user_id = user.user_id " +
      "JOIN topic ON post.topic_id = topic.topic_id";

    // executes sql query to send all the posts to 'list-posts.ejs'
    db.query(sqlquery, (err, result) => {

      if (err) {
        res.redirect("./");
      }
      res.render("list-posts.ejs", {
        posts: result,
        successMessage,
        errorMessage,
      });

    });

  });

  // List topics route
  app.get("/list-topics", isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const sqlquery = `
        SELECT topic.*, 
               CASE WHEN membership.user_id IS NOT NULL THEN 1 ELSE 0 END AS isMember
        FROM topic
        LEFT JOIN membership ON topic.topic_id = membership.topic_id AND membership.user_id = ?`;

    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    db.query(sqlquery, [userId], (err, result) => {
      if (err) {
        req.flash("error", "Unable to view topics, please try again!");
        res.redirect("/"); // Redirects back to the home page
      }

      res.render("list-topics.ejs", {
        topics: result,
        successMessage,
        errorMessage,
      });
    });
  });

  // User profile route
  app.get("/user/:userId", isAuthenticated, (req, res) => {
    const userId = req.params.userId;

    // Fetches user details, post count, and credits

    const userQuery = "SELECT * FROM user WHERE user_id = ?";
    const postCountQuery =
      "SELECT COUNT(*) AS postCount FROM post WHERE user_id = ?";
    const creditsQuery = "SELECT credits FROM user WHERE user_id = ?";

    db.query(userQuery, [userId], (err, userResults) => {
      if (err) {
        console.error(err);
        req.flash("error", "Error fetching user details");
        res.redirect("/");
        return;
      }

      const user = userResults[0];

      db.query(postCountQuery, [userId], (err, postCountResults) => {
        if (err) {
          console.error(err);
          req.flash("error", "Error fetching post count");
          res.redirect("/");
          return;
        }
        let credits = "";
        const postCount = postCountResults[0].postCount;

        db.query(creditsQuery, [userId], (err, creditsResults) => {
          if (err) {
            console.error(err);
            req.flash("error", "Error fetching credits");
            res.redirect("/");
            return;
          }
          credits = creditsResults[0].credits;

          // Renders the user profile page with the fetched data
          res.render("user-profile.ejs", { user, postCount, credits });
        });
      });
    });
  });

  // User lists route
  app.get("/list-users", isAuthenticated, (req, res) => {

    const getUserQuery =
      "SELECT user_id, username, email, first_name, last_name, credits FROM user";
    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    // Grabs all the users and sends it to 'list-users.ejs'
    db.query(getUserQuery, (err, result) => {
      if (err) {
        console.error(err);
        req.flash("error", "Unable to view users, please try again!");
        return res.redirect("/");
      }

      const users = result;

      res.render("list-users.ejs", { users, successMessage, errorMessage });
    });
  });

  // Logout route for when the user presses Log out
  app.get("/logout", isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        res.redirect("/");
      } else {
        console.log("Logged out successfully!");
        res.redirect("/login");
      }
    });
  });

  // Login Page
  app.get("/login", function (req, res) {

    // Grabs values from registration and automatically puts them in the input box if the user just registered

    const usernameFromRegistration = req.query.username || ""; 
    const passwordFromRegistration = req.query.password || "";
    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    res.render("login.ejs", {
      successMessage,
      errorMessage,
      username: usernameFromRegistration,
      password: passwordFromRegistration,
    });
  });

  // Register Page
  app.get("/register", function (req, res) {
    const successMessage = req.flash("success");
    const errorMessage = req.flash("error");

    res.render("register.ejs", { successMessage, errorMessage });
  });

  // Adds new users to database from register forum
  app.post("/register", (req, res) => {
    const {
      username,
      firstName,
      lastName,
      email,
      confirmEmail,
      password,
      confirmPassword,
    } = req.body; // grabs the data from the req.body

    // Adds the new user to the database
    const newUser = {
      username: username,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password: password,
    };

    // Inserts the user into the database
    db.query("INSERT INTO user SET ?", newUser, (error, results) => {

      if (error) {

        if (error.code === "ER_DUP_ENTRY") {
          req.flash(
            "error",
            "The provided username or email is already in use. Please choose a different one."
          );
          res.redirect("/register"); // Redirects to register page due to duplicate entry
        } 
        else {
    
          console.error(error);
          req.flash(
            "error",
            "Error while adding user to the database. Please try again!"
          );
          res.redirect("/register"); // Redirects to register page for other errors
        }
      } else {

        console.log("Registration successful!");
        req.flash("success", "Account created successfully! Please log in.");

        res.redirect(  // redirects to login page and sends the username and password to the login page 
          "/login?username=" +
            encodeURIComponent(username) +
            "&password=" +
            encodeURIComponent(password)

        ); 
      }
    });
  });
};
