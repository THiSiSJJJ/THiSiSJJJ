const crypto = require('crypto');
const query = require('./query');
const secret = '0LaBneJbqYCm0slqN_bpem3pncrp2Rf1cSw_blvQWUh8_nw7bHW1JJeRiD8yrvWJn7S5w5h3k50uWi-yqZ_9HOP8m4oM39FeGQuv';

// in userbook , does the mail exist ? : bool
async function check(username,password)
{
	const command = "select count(*) from userbook where username=$1 and password=$2;";
	const hashed_password = ''+crypto.createHash('sha256').update(password+secret).digest('hex');
	const result = await query(command,[username,hashed_password]);
	const count = result.rows[0]['count'];
	return (count == 1);
}

async function isExisted(username)
{
	const command = "select count(*) from userbook where username=$1;";
	const result = await query(command,[username]);
	const count = result.rows[0]['count'];
	return (count == 1);
}

async function follow(username, follow)
{
	const follow_existence = await isExisted(follow);
	console.log(follow_existence);
	if(!follow_existence) return;
	const check = "select count(*) from followbook where username=$1 and follow=$2;";
	const count = (await query(check, [username, follow])).rows[0]['count'];
	console.log(count);
	if(count == 1) return;
	const command = "insert into followbook values ($1, $2);";
	await query(command, [username, follow]);
}

async function add(username,password)
{
	const ret = await isExisted(username);
	if(ret) return false;
	const command = "insert into userbook values ($1, $2);";
	const hashed_password = ''+crypto.createHash('sha256').update(password+secret).digest('hex');
	const result = await query(command,[username,hashed_password]);
	
	await follow(username, username);
	
	return true;
}



const query_user = 
{
	check:check,
	add:add,
	isExisted:isExisted,
	follow: follow
};


module.exports = query_user;