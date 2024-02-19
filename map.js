const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const query_user = require('./query-user');
const qlocation = require('./query-location');
const constants = require('./constants');
const fileUpload = require('express-fileupload');
router.use(fileUpload());

passport.use(new LocalStrategy(
	async (username, password, done) => 
	{
		const res = await query_user.check(username,password);
		if(res)
		{
			return done(null,{username:username});
		}
		else
		{
			return done(null,false);
		}
	}
));

router.use(passport.initialize());
router.use(passport.session());
passport.serializeUser(function(user, done) {
  console.log('serialize user');
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.log('deserialize user');
  done(null,user);
});

router.post('/login_post',
  passport.authenticate('local',
    {
      failureRedirect: constants.pages.login
    }
  ),
  (req, res) => {
    console.log(req.user);
    res.redirect(constants.pages.main);
  }
);

router.post('/new_account_post', async (req,res,next) =>
{
	if(req.body.username == null || req.body.password == null)
	{
		await res.redirect(constants.pages.new_account);
	}
	if( (await query_user.isExisted(req.body.username)) )
	{
		await res.redirect(constants.pages.new_account);
	}
	await query_user.add(req.body.username, req.body.password);
	next();
}, passport.authenticate('local'), (req, res) => { res.redirect(constants.pages.main);});

router.get('/logout' , (req, res) => {
	req.session.passport.user = undefined;
	res.redirect('/');
});

function checkAuth (req, res, next){
	if(!req.isAuthenticated()) res.redirect(constants.pages.login);
	else next();
};

router.use('/',checkAuth, express.static(path.join(__dirname,'./map')));

router.get('/' ,(req,res) => {
	res.redirect(constants.pages.main);
});

router.get('/location', checkAuth, async (req, res) => {
	if(!('ne_lat' in req.query && 'ne_lng' in req.query && 'sw_lat' in req.query && 'sw_lng' in req.query)) res.status(400).send([]);
	res.send(await qlocation.location(req.session.passport.user.username, req.query.ne_lat, req.query.ne_lng, req.query.sw_lat, req.query.sw_lng)) ;
	
});

router.post('/rate', checkAuth, async (req, res) =>
{
	if(!('id' in req.body && 'rate' in req.body)) res.status(400).end();
	else
	{
		if(req.body.id) await qlocation.rate(req.body.id, req.session.passport.user.username, req.body.rate, req.body.comment, req.files);
	}
	res.send("success");
});


router.post('/upload' , async function(req, res) {
	console.log(req.files);
	await qlocation.uploadImage(req.body.id, req.files.file.data);
  	res.send("success");
});

router.get('/image',async (req, res) =>
{
	const ret = await qlocation.image(req.query.id, req.query.ref);
	if(ret === null) return res.status(400).end();
	else return res.status(200).send(ret);
});

router.post('/like', checkAuth, async (req, res) =>
{
	if(!('id' in req.body )) res.status(400).end();
	else await qlocation.like(req.body.id, req.session.passport.user.username);
	res.send("success");
});

router.post('/register-location', checkAuth, async (req, res) =>
{
	if(!('lat' in req.body && 'lng' in req.body && 'name' in req.body))
	{
		res.status(400).end();
	}
	else 
	{
		const registered_id = await qlocation.setLocation(req.body.lat, req.body.lng, req.body.name, req.body.address);
		if(!('rate' in req.body)) res.status(400).end();
		else await qlocation.rate(registered_id, req.session.passport.user.username, req.body.rate, req.body.comment, req.files);
		res.send("success");
	}
});

router.post('/follow', checkAuth, async (req, res) =>
{
	console.log(req.body);
	if(!('follow' in req.body)) res.status(400).end();
	else await query_user.follow(req.session.passport.user.username, req.body.follow);
	res.send("success");
});

router.get('/username', checkAuth, (req, res) =>
{
	res.json(req.session.passport.user);
});




module.exports = router;
