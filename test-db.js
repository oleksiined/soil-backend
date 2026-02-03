const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '4893',
  database: 'soil',
});

client.connect()
  .then(() => {
    console.log('DB CONNECTED');
    return client.end();
  })
  .catch(err => {
    console.error('DB ERROR');
    console.error(err);
  });
