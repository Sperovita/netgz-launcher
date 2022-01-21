
function data() {
	return {
		selectedConfig: '',
		configs: [{id: 1, name: 'test1'}, {id: 2, name: 'test2'}],
		allModFiles: [
			'test.pke',
			'test.wad'
		],
		cc: { // Current Config
			hostJoin: 'join',
			ip: '',
			port: '',
			modFiles: [],
			additionalCommands: '',
			private: true,
			players: 2,
			map: '',
			skill: -1,
			mode: 'coop',
			netmode: '0',
		},
		command(){
			const cc = this.cc;
			let command = `gzdoom -${cc.hostJoin}`;
			if(cc.hostJoin === 'host'){
				command += ` ${cc.players} ${cc.private ? '-private' : ''} -netmode ${cc.netmode}`;
				if(cc.skill > -1){
					command += ` -skill ${cc.skill}`
				}
				if(cc.map){
					command += ` -warp ${cc.map}`;
				}
				if(cc.mode !== 'coop'){
					command += ` -${cc.mode}`;
				}
			}else if(cc.hostJoin === 'join'){
				command += ` ${cc.ip}`;
			}
			if(cc.port){
				command += ` -port ${cc.port}`;
			}
			if(cc.modFiles.length){
				command += ` -file`;
				cc.modFiles.forEach(file => {
					command += ` ${file}`;
				})
			}

			command += ` ${cc.additionalCommands}`;

			return command;
		},
		configChanged(){
			console.log('config changed')
		},
		save(){

		},
		saveNew(){

		},
		newConfig() {

		},
		init() {

			// Get into the next event loop, make sure alpine is all setup
			setTimeout(() => {
				this.delayedInit()
			}, 100)
		},
		delayedInit() {

			try{
				const cs = new SlimSelect({
					select: '#config_selector'
				});
				const ms = new SlimSelect({
					select: '#mod_selector',
					placeholder: 'Select Mod Files'
				});
			}catch(error){
				// This library has an annoying bug currently
			}
		}
	}
}
