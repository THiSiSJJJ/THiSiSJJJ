const {Pool} = require('pg');

const connectionString = 'postgres://root:KeER6YX7Ljy5DieIAO57A5d0maiTTbJ9@dpg-cmrr28g21fec739ta900-a.singapore-postgres.render.com/test_database_1tpc'
const pool = new Pool(
{
	connectionString:connectionString,
	max:5,
	idleTimeoutMillis:1000*10,
	ssl:true
});

// log pool counts 
function poolCountLog()
{
	console.log('pool count log');
	console.log('  total count : ' ,pool.totalCount);
	console.log('  idle count : ' ,pool.idleCount);
	console.log('  waiting count : ' ,pool.waitingCount);
}
async function query(q,values)
{
	// connection 
	//console.log('db pool connecting...');
	const connect = await pool.connect();
    	//poolCountLog();
    
   	 // query 
    	//await console.log('query : ' , q);
	const result = await connect.query(q,values);
	
	// release
	//console.log('db pool releasing...');
	connect.release();
   	//poolCountLog();

	return result;
}

module.exports = query;