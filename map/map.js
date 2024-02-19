var location_manager = [];
var username = "";

async function initMap() {

	const center = new google.maps.LatLng(33.832460,135.176587);
	const mapProp= {
	  center:center,
	  zoom:15,
	};
	
	const map = new google.maps.Map(document.getElementById("googleMap"),mapProp);
	const marker =  new google.maps.Marker({position: center, map: map , title: "register location"});
	
	await google.maps.event.addListener(map, 'idle', () => getLocation(map));
	await map.addListener('click', function(e)
	{
		marker.setOptions({position:e.latLng});
		map.panTo(e.latLng);
	});
	

	const contentString = 
		'<div id="register_location_div">'+
			'<h3> register location </h3>'+
			
			'<label class="reg_col_left" for="register_location_name">location name  </label>'+
			'<input class="reg_col_right" type="text" name="name" id="register_location_name" required> <br />'+
			
			'<label class="reg_col_left" for="register_location_address">address     </label>'+
			'<input class="reg_col_right" type="text" name="address" id="register_location_address"> <br />'+
			
			'<label class="reg_col_left" for="register_location_rate">rate           </label>'+
			'<input class="reg_col_right" type="number" name="rate" id="register_location_rate" required> <br />'+
			
			'<label class="reg_col_left" for="register_location_comment">comment     </label>'+
			'<textarea class="reg_col_right" name="comment" id="register_location_comment"></textarea> <br />'+
			
			'<label class="reg_col_left" for="register_location_img">upload photo    </label>'+
			'<input class="reg_col_right" type="file" name="images" id="register_location_img"> <br />'+
			
			'<input type="button" value="register" onclick="register_location()">'+
		'</div>';
	const infowindow = new google.maps.InfoWindow();
	var infowindow_open = false;
	marker.addListener('dblclick', e => {
		infowindow.setContent(
			contentString + 
			'<input type="hidden" id="register_location_lat" name="lat" value='+marker.getPosition().lat()+' />'+ 
			'<input type="hidden" id="register_location_lng" name="lng" value='+marker.getPosition().lng()+' />'
		);
		if(!infowindow_open) infowindow.open({ anchor: marker, map });
		else infowindow.close();
		infowindow_open = !infowindow_open;
	});
	map.addListener('click', e => infowindow.close());
	
	username = await fetch('/map/username').then(res => res.json()).then(obj => obj.username);
	console.log(username);
}

async function setLocationInfo(location)
{
	const rates_ul = document.getElementById("rates");
	const likes_ul = document.getElementById("likes");
	while (rates_ul.firstChild)
	{
		rates_ul.removeChild(rates_ul.firstChild);
	}
	while (likes_ul.firstChild)
	{
		likes_ul.removeChild(likes_ul.firstChild);
	}
	document.getElementById("location_id").value = location.id;
	document.getElementById("name").textContent = location.name;
	document.getElementById("address").textContent = "address : "+  location.address;
	document.getElementById("totalrate").textContent = "rate : " + location.totalrate.toPrecision(3) + " (" + location.rates.length + ")";
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
	for(const l of location.likes)
	{
		const likeinfo = document.createElement('li');
		const username = document.createElement('p');
		username.textContent = l.username;
		likeinfo.appendChild(username);
		likes_ul.appendChild(likeinfo);
	}
	
	document.getElementById('input_img').value = null;
	
	
	const rate_input = document.getElementById("input_rate");
	const comment_input = document.getElementById("input_comment");
	const user_rate = location.rates.find(r => r.username == username);
	if(user_rate !== undefined)
	{
		rate_input.value = user_rate.rate;
		comment_input.value = user_rate.comment;
	}
	else
	{
		rate_input.value = null;
		comment_input.value = null;
	}
}

function createMarker(map, location)
{
	const marker = new google.maps.Marker({position: new google.maps.LatLng(location.lat,location.lng), map: map});
	marker.addListener('click', () => setLocationInfo(location) );
	return marker;
}
function deleteMarker(location)
{
	location.marker.setMap(null);
	location.marker = null;
}

function initLocation(map,location)
{
	location.marker = createMarker(map, location);
	location.totalrate = 0;
	if(location.rates.length > 0)
	{
		for(const rate of location.rates)
		{
			location.totalrate += rate.rate;
		}
		location.totalrate /= location.rates.length;
	}
}
async function getLocation(map)
{
	const bounds =  await map.getBounds();
	const ne = await bounds.getNorthEast();
	const sw = await bounds.getSouthWest();
	const ne_lat = ne.lat();
	const ne_lng = ne.lng();
	const sw_lat = sw.lat();
	const sw_lng = sw.lng();
	const url = '/map/location?ne_lat='+ne_lat+'&ne_lng='+ne_lng+'&sw_lat='+sw_lat+'&sw_lng='+sw_lng;
	const locations = await fetch(url)
		.then(res =>res.json() );
	
	const remained_locations = location_manager.filter(location =>
	{
		const condition = sw_lat <= location.lat && location.lat <= ne_lat && sw_lng <= location.lng && location.lng <= ne_lng && !location.updated;
		if(!condition) deleteMarker(location);
		return  condition;
	});
	
	const additional_locations = locations.filter( location =>
	{
		const condition =!(remained_locations.some(remained => remained.id == location.id));
		if(condition) initLocation(map,location);
		return condition;
	});
	
	location_manager = remained_locations.concat(additional_locations);
	console.log(location_manager);
	
}

async function submit_rate()
{
	const location_id = document.getElementById("location_id");
	const rate = document.getElementById("input_rate");
	const comment = document.getElementById("input_comment");
	const img_list = document.getElementById("input_img");
	const formData = new FormData();
	if(!location_id.value) return;
	formData.append("id", location_id.value);
	formData.append("rate", rate.value);
	formData.append("comment", comment.value);
	
	for(const [i, img] of Array.from(img_list.files).entries()) 
	{
		formData.append('img'+i, img);
	}
	
	await fetch('/map/rate/',{
		method: "POST",
		body: formData,
	})
	window.location.reload();

}

async function submit_like()
{
	const location_id = document.getElementById("location_id");
	const formData = new FormData();
	formData.append("id", location_id.value);
	
	
	await fetch('/map/like/',{
		method: "POST",
		body: formData,
	});
	window.location.reload();

}

async function register_location()
{
	const formData = new FormData();
	const name = document.getElementById("register_location_name").value;
	const address = document.getElementById("register_location_address").value;
	const lat = document.getElementById("register_location_lat").value;
	const lng = document.getElementById("register_location_lng").value;
	const rate = document.getElementById("register_location_rate").value;
	const comment = document.getElementById("register_location_comment").value;
	const img_list = document.getElementById("register_location_img");
	formData.append("name",name);
	formData.append("address",address);
	formData.append("lat",lat);
	formData.append("lng",lng);
	formData.append("rate",rate);
	formData.append("comment",comment);
	
	for(const [i, img] of Array.from(img_list.files).entries()) 
	{
		formData.append('img'+i, img);
	}
	
	await fetch('/map/register-location',{
		method: "POST",
		body: formData,
	});
	window.location.reload();

}

async function submit_follow()
{
	const formData = new FormData();
	const follow_name = document.getElementById("input_follow").value;
	formData.append("follow", follow_name);
	
	await fetch('/map/follow',{
		method: "POST",
		body: formData,
	});
	window.location.reload();
}


async function image(id, ref)
{
	return await fetch('/image?id='+id+'&ref='+ref)
		.then(res => res.json())
		.then(obj => obj.image.data)
		.then(data => new Uint8Array(data) )
		.then(buff => new Blob([buff], {type: 'image/jpeg'}) )
		.then(blob => URL.createObjectURL(blob) )
		.then(url => {
			var imgElement = document.createElement('img');
			imgElement.src = url;
			return imgElement;
		});
}
