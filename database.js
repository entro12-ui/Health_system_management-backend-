const {response} = require("express")
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    password: 'Hab123',
    database: 'pss',
    port: 5432,
});



module.exports = pool;