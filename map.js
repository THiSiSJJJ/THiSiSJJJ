const express = require('express');
const router = express.Router();
const path = require('path');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const query_user = require('./query-user');

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
      failureRedirect: "/login/Log_in.html"
    }
  ),
  (req, res) => {
    console.log(req.user);
    res.redirect('/map/');
  }
);

router.post('/new_account_post', async (req,res,next) =>
{
	if(req.body.username == null || req.body.password == null)
	{
		await res.redirect('/newaccount/New_Account.html');
	}
	if( (await query_user.isExisted(req.body.username)) )
	{
		await res.redirect('/newaccount/New_Account.html');
	}
	await query_user.add(req.body.username, req.body.password);
	next();
}, passport.authenticate('local'), (req, res) => { res.redirect('/map/');});

router.get('/logout' , (req, res) => {
	req.session.passport.user = undefined;
	res.redirect('/');
});

function checkAuth (req, res, next){
	if(!req.isAuthenticated()) res.redirect('/login/Log_in.html');
	else next();
};

router.use('/',checkAuth, express.static(path.join(__dirname,'./map')));

router.get('/' ,(req,res) => {
	res.redirect('./J_s_map.html');
});

module.exports = router;