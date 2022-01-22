
function data() {
	return {
		configs: [],
		allModFiles: [],
		cc: {}, // Current Config
		modSlimSelect: null,
		configSlimSelect: null,
		serializableCC() {
			return JSON.parse(JSON.stringify(this.cc));
		},
		command(){
			const cc = this.cc;
			let command = `gzdoom -${cc.host_join}`;

			if(cc.host_join === 'host'){
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
			}else if(cc.host_join === 'join'){
				command += ` ${cc.ip}`;
			}

			if(cc.port){
				command += ` -port ${cc.port}`;
			}

			if(cc.mod_files.length){
				command += ` -file`;
				cc.mod_files.forEach(file => {
					command += ` ${file}`;
				})
			}

			command += ` ${cc.additional_commands}`;

			return command;
		},
		configChanged(){
			const selectedId = this.configSlimSelect.selected();
			const selectedConfig = this.configs.find(config => config.id == selectedId);
			// If newConfig() selected config will not be found 
			console.log('selectedConfig', selectedConfig);
			if(selectedConfig){
				this.cc = selectedConfig;
				this.modSlimSelect.set(this.cc.mod_files);
			}
			
		},
		changeToConfig(id){
			// selected is typically string since modeled from select controlled by slim select
			this.configSlimSelect.set(`${id}`);
		},
		setDefaultConfig(){
			this.cc = {
				id: null,
				name: '',
				host_join: 'join',
				ip: '',
				port: '',
				mod_files: [],
				additional_commands: '',
				private: 0,
				players: 2,
				map: '',
				skill: -1,
				mode: 'coop',
				netmode: 0,
			}
		},
		async save(){
			if(!this.cc.id){
				this.saveNew();
				return;
			}

			try{
				await app.updateConfig(this.serializableCC());
				await this.fetchConfigs();
				displaySuccess('Saved');
				
			}catch(error){
				displayError(error);
			}

		},
		saveNew(){
			if(this.cc.id){
				this.cc.id = null;
			}

			vex.dialog.prompt({
				message: 'Config Name',
				placeholder: 'Name',
				callback: async (name) => {
					if(!name){
						return;
					}
					this.cc.name = name;
					try{
						const newId = await app.addConfig(this.serializableCC());
						const fetched = await this.fetchConfigs();
						if(fetched){
							this.changeToConfig(newId);
						}
						displaySuccess(`${name} Saved`);
					}catch(error){
						displayError(error.message);
					}

				}
			});

		},
		newConfig(){
			this.configSlimSelect.set('');
			this.setDefaultConfig();
		},
		deleteConfig(){
			vex.dialog.confirm({
				message: `Delete Config ${this.cc.name}?`,
				callback: async (confirm) => {
					if(confirm){

						if(!this.cc.id){
							displayError('Invalid config selected');
							return;
						}

						try{
							await app.deleteConfig(this.cc.id);
							await this.fetchConfigs();
							this.newConfig();
							displaySuccess('Deleted');
						}catch(error){
							displayError(error);
						}
					}
				}
			})
			
		},
		launch(){

		},
		async fetchConfigs() {
			try {
				this.configs = await app.getAllConfigs();
				const selects = this.configs.map(config => ({text: config.name, value: config.id}) );
				this.configSlimSelect.setData(selects);
				if(!this.cc.id){
					this.configSlimSelect.set('');
				}
				return true;
			}catch(error) {
				displayError(error.message);
				return false;
			}
		},
		init(){
			this.setDefaultConfig();

			this.$nextTick(() => {
				this.mounted()
			})
		},
		mounted() {
			tippy.setDefaultProps({
				arrow: false,
				animation: 'scale',
				theme: 'netgz',
			});

			tippy('[data-tippy-content]');

			try{
				this.configSlimSelect = new SlimSelect({
					select: '#config_selector',
					placeholder: 'Select Config or Save a New One',
					onChange: (info) => {
						this.configChanged();
					}
				});

				// slim select multi doesn't work well with alpine, need to rely on a more classic approach
				this.modSlimSelect = new SlimSelect({
					select: '#mod_selector',
					placeholder: 'Select Mod Files',
					data: this.allModFiles.map(file => ({text: file}) ),
					onChange: (info) => {
						this.cc.mod_files = info.map(choice => choice.value);
					},
				});
				this.modSlimSelect.set(this.cc.mod_files);
		
				this.fetchConfigs();
			}catch(error){
				// This library has an annoying bug on render currently
			}
		}
	}
}
