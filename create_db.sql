use myforum;

CREATE USER IF NOT EXISTS 'myforumappuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myforum.* TO 'appuser'@'localhost';

-- View for fetching user details
CREATE VIEW user_details AS
SELECT user_id, username, email, first_name, last_name, credits
FROM user;

-- View for fetching topic details with membership information
CREATE VIEW topic_details AS
SELECT topic.*, membership.user_id AS isMember
FROM topic
LEFT JOIN membership ON topic.topic_id = membership.topic_id;

-- View for fetching post details with user and topic information
CREATE VIEW post_details AS
SELECT post.*, user.username AS user_username, topic.topic_name AS topic_name
FROM post
JOIN user ON post.user_id = user.user_id
JOIN topic ON post.topic_id = topic.topic_id;