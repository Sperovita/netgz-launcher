
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
			modFiles: ['test.pke'],
			additionalCommands: '',
			private: true,
			players: 2,
			map: '',
			skill: -1,
			mode: 'coop',
			netmode: '0',
		},
		modSlimSelect: null,
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
			this.modSlimSelect.set(this.cc.modFiles);
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

				// slim select multi doesn't work well with alpine, need to rely on a more classic approach
				this.modSlimSelect = new SlimSelect({
					select: '#mod_selector',
					placeholder: 'Select Mod Files',
					data: this.allModFiles.map(file => ({text: file}) ),
					onChange: (info) => {
						this.cc.modFiles = info.map(choice => choice.value);
					},
				});
				this.modSlimSelect.set(this.cc.modFiles);
			}catch(error){
				// This library has an annoying bug on render currently
			}
		}
	}
}
