async function image()
{
	return await fetch('/image?id=6&ref=3')
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


(async () =>{
	document.body.appendChild(await image());
})();