use myforum;

CREATE USER IF NOT EXISTS 'myforumappuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myforum.* TO 'appuser'@'localhost';