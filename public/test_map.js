( () =>
{
	const location = {
		id: -1,
		name: "test location",
		address: "test in test",
		rates: [
			{
				username : "test1",
				rate: 3,
				comment : "hahaha"
			},
			{
				username : "test2",
				rate: 2,
				comment : "mmm"
			}
		],
		totalrate: 2.5,
		lat: 33,
		lng: 135,
		like: [
			{
				username: "test1"
			}
		]
	};

	document.getElementById("name").textContent = location.name;
	document.getElementById("address").textContent = "address : "+  location.address;
	document.getElementById("totalrate").textContent = "rate : " + location.totalrate;
	const rates_ul = document.getElementById("rates");
	for(const r of location.rates)
	{
		const rateinfo = document.createElement('li');
		const user = document.createElement('p');
		user.textContent = r.username + " : "+r.rate
		const comment = document.createElement('p');
		comment.textContent = r.comment;
		rateinfo.appendChild(user);
		rateinfo.appendChild(comment);
		rates_ul.appendChild(rateinfo);
	}
	const like_ul = document.getElementById("like");
	for(const l of location.like)
	{
		const likeinfo = document.createElement('li');
		const username = document.createElement('p');
		username.textContent = l.username;
		likeinfo.appendChild(username);
		like_ul.appendChild(likeinfo);
	}
})();
