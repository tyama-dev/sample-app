CREATE DATABASE keycloak;
CREATE DATABASE app;

CREATE User keycloak_user WITH PASSWORD 'keycloak_pass';
CREATE USER app_user WITH PASSWORD 'app_pass';

GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak_user;
GRANT ALL PRIVILEGES ON DATABASE app TO app_user;

\c keycloak
GRANT ALL ON SCHEMA public TO keycloak_user;

\c app
GRANT ALL ON SCHEMA public TO app_user;
