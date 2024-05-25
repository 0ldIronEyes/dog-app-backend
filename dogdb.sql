\echo 'Delete and recreate dogbreed db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE dogbreedfinder2;
CREATE DATABASE dogbreedfinder2;
\connect dogbreedfinder2

\i dog-breed-schema.sql
\i seed.sql

\echo 'Delete and recreate dogbreed_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE  dogbreedfinder_test2;
CREATE DATABASE dogbreedfinder_test2;
\connect dogbreedfinder_test2

\i  dog-breed-schema.sql
