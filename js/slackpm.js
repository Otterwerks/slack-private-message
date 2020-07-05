window.onload=function(){
	document.getElementById("addsecret").addEventListener("click", submitSecret);
	populateSecrets();
};

const submitSecret = () => {
	let secret = {"name": "Current Secret", "value": document.getElementById("newSecret").value};
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {"message": "addSecret", "value": secret});
	});
	populateSecrets();
};

const populateSecrets = () => {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {"message": "requestSecretList"}, function(response) {
			const secretList = response.secretList;
			if (secretList == null){
				return;
			};
			renderSecretList(secretList);
		});
	});
};

const renderSecretList = (secretList) => {
	var container = document.getElementById("secretListContainer");
	var secretListMarkup = "";
	for (let i = 0; i < secretList.length; i++) {
		secretListMarkup = secretListMarkup + '<div class="input-group"><div class="input-group-prepend"><span class="input-group-text">' + secretList[i].name + '</span></div><input type="text" class="form-control" disabled value="' + secretList[i].value + '"></div>';
	};
	container.innerHTML = secretListMarkup;
};
