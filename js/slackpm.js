window.onload=function(){
	document.getElementById("addsecret").addEventListener("click", submitSecret);
	populateSecrets();
};

const submitSecret = () => {
	let secret = {"name": "Custom Secret", "value": document.getElementById("newSecret").value};
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {"message": "addSecret", "value": secret});
	});
	populateSecrets();
};

const removeSecret = (name) => {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {"message": "removeSecret", "value": name});
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
	container.innerHTML = "";
	for (let i = 0; i < secretList.length; i++) {
		buttonMarkup = '<div class="input-group my-1"><div class="input-group-prepend w-50"><span class="input-group-text w-100">' + secretList[i].name + '</span></div><input type="text" class="form-control" disabled value="' + secretList[i].value + '"><div class="input-group-append"><button id="remove_' + secretList[i].name + '" class="btn btn-danger">X</button></div></div>';
		container.insertAdjacentHTML("beforeend", buttonMarkup);
		document.getElementById("remove_" + secretList[i].name).addEventListener("click", () => {removeSecret(secretList[i].name)})
	};
};
