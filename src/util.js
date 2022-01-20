vex.defaultOptions.className = 'vex-theme-default'

Noty.overrideDefaults({
    theme: 'bootstrap-v4',
});

window.displaySuccess = (text) => {
	new Noty({
		text,
		timeout: 2000,
		type: 'success',
	}).show();
}

window.displayError = (text) => {
	console.error(text);
	if(typeof text !== 'string'){
		text = JSON.stringify(text);
	}
	new Noty({
		text,
		timeout: 4000,
		type: 'error',
	}).show();
}
