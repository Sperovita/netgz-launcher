vex.defaultOptions.className = 'vex-theme-default'

Noty.overrideDefaults({
    theme: 'bootstrap-v4',
});

window.displaySuccess = (text) => {
	new Noty({
		text,
		timeout: 3000,
		type: 'success',
	}).show();
}

window.displayError = (text) => {
	console.error(text);
	if(typeof text !== 'string'){
		if(typeof text === 'object' && 'message' in text){
			text = text.message;
		}else{
			text = JSON.stringify(text);
		}
		
	}
	new Noty({
		text,
		timeout: 12000,
		type: 'error',
	}).show();
}
