const crypto = require('crypto');
const query = require('./query');
const date_utils = require('date-utils');
const secret = '0LaBneJbqYCm0slqN_bpem3pncrp2Rf1cSw_blvQWUh8_nw7bHW1JJeRiD8yrvWJn7S5w5h3k50uWi-yqZ_9HOP8m4oM39FeGQuv';

async function getLocation(ne_lat, ne_lng, sw_lat, sw_lng)
{
	const command = "select * from idbook where (lat between $1 and $2) and (lng between $3 and $4);";
	const result = await query(command,[sw_lat, ne_lat, sw_lng, ne_lng]);
	return result.rows;
}

async function getLocationInfo(username, ne_lat, ne_lng, sw_lat, sw_lng)
{
	let locations = await getLocation(ne_lat, ne_lng, sw_lat, sw_lng);
	const command_like = "select L.username from (select * from likebook where id=$1) as L "+
		"inner join (select * from followbook where username=$2) as F on L.username=F.follow;";
	
	const command_rate = "select R.username, R.time_stamp, R.rate, R.comment, R.imgref from (select * from ratebook where id=$1) as R "+
		"inner join (select * from followbook where username=$2) as F on R.username=F.follow;";
	
	const command_image = "select ref from imagebook where id = $1;";
	for(let location of locations)
	{
		location.likes = (await query(command_like, [location.id,username])).rows;
		location.rates = (await query(command_rate, [location.id, username])).rows;
		location.images = (await query(command_image, [location.id])).rows;
	};
	
	return locations.filter(location => location.rates.length !== 0 || location.likes.length !== 0);
}

async function setLocation(lat, lng, name, address)
{
	const command = "insert into idbook (lat, lng, name, address) values ($1, $2, $3, $4)  returning id;";

	return (await query(command,[lat,lng,name,address])).rows[0].id;
}

function getNow()
{
	return (new Date()).toFormat('YYYY-MM-DD HH24:MI:SS');
}

async function rate(id, username, rate, comment, imgfiles)
{
	const refarr = [];
	for(const img in imgfiles)
	{
		const res = await uploadImage(id, img.data);
		console.log(res);
		refarr.push(res);
	}
	const check = "select count(*) from ratebook where id=$1 and username=$2;";
	const count = (await query(check,[id,username])).rows[0]['count'];
	if(count == 1)
	{
		const command1 = "select imgref from ratebook where id=$1 and username=$2";
		
		const before_imgref = (await query(command1,[id,username])).rows[0].imgref;
		console.log(before_imgref);
		const new_imgref = before_imgref.concat(','+refarr.toString());
		
		const command2 = "update ratebook set rate=$1, time_stamp=$2, comment=$3, imgref=$4 where id=$5 and username=$6";
		await query(command2, [rate, getNow(), comment, refarr, id, username]);
	}
	else
	{
		const command = "insert into ratebook values ($1, $2, $3, $4, $5, $6);";
		await query(command,[id, username, rate, getNow(), comment, refarr.toString()]);
	}
}

async function like(id, username)
{
	const check = "select count(*) from likebook where id=$1 and username=$2;";
	const count = (await query(check,[id,username])).rows[0]['count'];
	if(count == 1) return;
	const command = "insert into likebook values ($1, $2);";
	await query(command,[id, username]);
}

async function checkImage(id, ref)
{
	const command = "select count(id) from imagebook where id=$1 and ref=$2;";
	const count = (await query(command, [id, ref])).rows[0]['count'];
	return (count == 1);
}

async function image(id, ref)
{
	const check = await checkImage(id, ref);
	if(!check) return null;
	const command = "select image from imagebook where id=$1 and ref=$2;";
	return (await query(command, [id, ref])).rows[0];
}

async function uploadImage(id, imgBuff)
{
	const command = "insert into imagebook (id,image) values ($1, $2::bytea) returning ref;";
	return (await query(command, [id, imgBuff])).rows[0].ref;
}


const query_location = {
	location : getLocationInfo,
	setLocation: setLocation,
	like: like,
	rate: rate,
	image: image,
	uploadImage: uploadImage
};



module.exports = query_location;
