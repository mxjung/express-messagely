\c messagely_test

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text NOT NULL,
    join_at timestamp without time zone NOT NULL,
    last_login_at timestamp with time zone
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_username text NOT NULL REFERENCES users,
    to_username text NOT NULL REFERENCES users,
    body text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone
);


INSERT INTO users (
              username,
              password,
              first_name,
              last_name,
              phone,
              join_at,
              last_login_at
            )       
    VALUES ('eric','password', 'eric','jho','510', current_timestamp, current_timestamp), ('max','password', 'max','jung','510', current_timestamp, current_timestamp);

INSERT INTO messages (
            from_username,
            to_username,
            body,
            sent_at,
            read_at
)
    VALUES ('eric','max','hello', current_timestamp,current_timestamp),('eric','max','hello', current_timestamp,current_timestamp),('eric','max','hello', current_timestamp,current_timestamp);
