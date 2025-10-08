-- Create test database schema for DBviz
-- This will be automatically executed when the container starts

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT false
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#666666'
);

-- Post-Tags junction table (many-to-many relationship)
CREATE TABLE post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Insert sample data
INSERT INTO users (username, email, full_name) VALUES
    ('john_doe', 'john@example.com', 'John Doe'),
    ('jane_smith', 'jane@example.com', 'Jane Smith'),
    ('bob_wilson', 'bob@example.com', 'Bob Wilson'),
    ('alice_brown', 'alice@example.com', 'Alice Brown');

INSERT INTO categories (name, description) VALUES
    ('Technology', 'Posts about technology and programming'),
    ('Lifestyle', 'Posts about lifestyle and personal experiences'),
    ('Business', 'Posts about business and entrepreneurship'),
    ('Education', 'Educational content and tutorials');

INSERT INTO tags (name, color) VALUES
    ('javascript', '#f7df1e'),
    ('react', '#61dafb'),
    ('database', '#336791'),
    ('tutorial', '#28a745'),
    ('tips', '#ffc107'),
    ('beginner', '#6f42c1');

INSERT INTO posts (title, content, user_id, category_id, status, published_at) VALUES
    ('Getting Started with React', 'A comprehensive guide to React basics...', 1, 1, 'published', NOW() - INTERVAL '5 days'),
    ('Database Design Best Practices', 'Learn how to design efficient databases...', 2, 1, 'published', NOW() - INTERVAL '3 days'),
    ('My Journey as a Developer', 'Personal story about becoming a developer...', 1, 2, 'published', NOW() - INTERVAL '1 day'),
    ('Building a Startup', 'Lessons learned from building a tech startup...', 3, 3, 'draft', NULL),
    ('SQL for Beginners', 'Introduction to SQL and relational databases...', 2, 4, 'published', NOW() - INTERVAL '7 days');

INSERT INTO post_tags (post_id, tag_id) VALUES
    (1, 2), (1, 4), (1, 6),  -- React post: react, tutorial, beginner
    (2, 3), (2, 4), (2, 5),  -- Database post: database, tutorial, tips
    (3, 5),                  -- Journey post: tips
    (4, 5),                  -- Startup post: tips
    (5, 3), (5, 4), (5, 6);  -- SQL post: database, tutorial, beginner

INSERT INTO comments (content, post_id, user_id, is_approved) VALUES
    ('Great tutorial! Very helpful for beginners.', 1, 2, true),
    ('Thanks for sharing your experience!', 3, 4, true),
    ('Could you add more examples?', 2, 1, true),
    ('This helped me understand React hooks better.', 1, 3, true),
    ('Looking forward to more content like this.', 2, 4, true),
    ('Reply to the first comment - glad it helped!', 1, 1, true);

-- Update the last comment to be a reply to the first comment
UPDATE comments SET parent_comment_id = 1 WHERE id = 6;