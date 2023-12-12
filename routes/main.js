module.exports = function(app) {
    // Handle our routes

    // Default route
    app.get('/',function(req,res){
        res.render('index.ejs')
    });
    
    // Lists posts route
    app.get('/listposts',function(req,res){
        let sqlquery = "SELECT * FROM post"; // query database to get all the posts
        // execute sql query
        db.query(sqlquery, (err,result) => {
            if (err) {
                res.redirect('./');
            }
            res.render('listposts.ejs', {posts:result})
        })
    });
}