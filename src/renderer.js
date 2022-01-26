
function data() {
	return {
		configs: [],
		allModFiles: [],
		allSaveFiles: [],
		cc: {}, // Current Config
		modSlimSelect: null,
		configSlimSelect: null,
		loadGameSlimSelect: null, 
		running: false,
		serializableCC() {
			return JSON.parse(JSON.stringify(this.cc));
		},
		command(){ // Refactor: duplicate code in main for security reasons, remove this and pull this function here on load from main
			const cc = this.cc;
			let command = `gzdoom`;

			if(cc.host_join === 'host'){
				command += ` -host ${cc.players} ${cc.private ? '-private' : ''} -netmode ${cc.netmode}`;
				if(cc.mode !== 'coop'){
					command += ` -${cc.mode}`;
				}
			}else if(cc.host_join === 'join'){
				command += ` -join ${cc.ip}`;
			}

			if(cc.host_join === 'host' || cc.host_join === 'single_player'){
				if(cc.skill > -1){
					command += ` -skill ${cc.skill}`
				}
				if(cc.map){
					command += ` -warp ${cc.map}`;
				}
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

			if(cc.save_file){
				command += ` -loadgame ${cc.save_file}`;
			}

			command += ` ${cc.additional_commands}`;

			return command;
		},
		configChanged(){
			const selectedId = this.configSlimSelect.selected();
			const selectedConfig = this.configs.find(config => config.id == selectedId);
			// If newConfig() selected config will not be found 
			if(selectedConfig){
				this.cc = selectedConfig;

				const missingMods = [];
				this.cc.mod_files.forEach(file => {
					if(!this.allModFiles.includes(file)){
						missingMods.push(file);
					}
				})
				if(missingMods.length){
					displayError(`Mods in config are missing from selected mod folder and will be removed on save: ${missingMods.join(', ')}`);
				}

				if(this.cc.save_file && !this.allSaveFiles.includes(this.cc.save_file)){
					displayError(`The selected save file ${this.cc.save_file} in this config is missing and will be removed from the config on save`);
				}
				this.modSlimSelect.set(this.cc.mod_files);
				this.loadGameSlimSelect.set(this.cc.save_file);
			}
			
		},
		changeToConfig(id){
			// selected is typically string since modeled from select controlled by slim select
			this.configSlimSelect.set(`${id}`);
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
			vex.dialog.confirm({
				message: `Create new config? If current is not saved work will be lost.`,
				callback: (confirm) => {
					if(confirm){
						this.resetCurrentConfig();
					}
				}
			})
		},
		resetCurrentConfig(){
			this.configSlimSelect.set('');
			this.modSlimSelect.set([]);
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
							this.resetCurrentConfig();
							displaySuccess('Deleted');
						}catch(error){
							displayError(error);
						}
					}
				}
			})
			
		},
		async syncMods(){
			const success = await this.fetchMods();
			if(success){
				displaySuccess('Mods Synced');
			}
			const saveSuccess = await this.fetchSaves();
			if(saveSuccess){
				displaySuccess('Saves Synced');
			}
		},
		async launch(){
			try{
				const gzdoomFolder = await app.getSetting('gzdoom_folder');
				if(!gzdoomFolder){
					displayError('GZDoom Folder not set. Set with button in top right');
					return false;
				}
				this.running = true;
				await app.launch(this.serializableCC());
				this.running = false;
				return true;
			}catch(error){
				this.running = false;
				displayError(error);
			}
			return false;
			
		},
		async setModFolder(){
			try{
				const folder = await app.setModFolder();
				this.fetchMods();
				displaySuccess(`Mod folder changed to ${folder}`);
			}catch(error){
				displayError(error);
			}
			
		},
		async setGZDoomFolder(){
			try{
				const folder = await app.setGZDoomFolder();
				displaySuccess(`GZDoom folder changed to ${folder}`);
			}catch(error){
				displayError(error);
			}
		},
		async fetchSaves(){
			try{
				const saveFiles = await app.getAllSaveFiles();
				// Sort by newest files first
				saveFiles.sort((fileA, fileB) => {
					if(fileA.modified.getTime() > fileB.modified.getTime()){
						return -1;
					}
					if(fileA.modified.getTime() < fileB.modified.getTime()){
						return 1;
					}

					return 0;
				})
				this.allSaveFiles = saveFiles.map(file => file.name);
				this.loadGameSlimSelect.setData(saveFiles.map(file => {
					return { 
						text: file.name,
						value: file.name,
						data: { created: file.created, modified: file.modified },
						innerHTML: `
							<div class="d-flex justify-content-between">
								<div class="">${file.name}</div>
								<div class="small">&nbsp${file.modified.toLocaleString()}&nbsp</div>
								
							</div>
							<div class="d-flex justify-content-between">
								<div class="font-weight-500 small">${file.saveName}</div>
								<div class="font-italic small">&nbsp${file.currentMap}&nbsp</div>
							</div>
						`
					}
				}));
				this.loadGameSlimSelect.set(this.cc.save_file);
				return true;
			}catch(error){
				displayError(error);
				return false;
			}
		},
		async fetchMods(){
			try{
				this.allModFiles = await app.getAllModFiles();
				this.modSlimSelect.setData(this.allModFiles.map(file => ({text: file}) ));
				this.modSlimSelect.set(this.cc.mod_files);
				return true;
			}catch(error){
				displayError(error);
				return false;
			}
		},
		async fetchConfigs() {
			try {
				this.configs = await app.getAllConfigs();
				const selects = this.configs.map(config => ({text: config.name, value: config.id}) );
				this.configSlimSelect.setData(selects);
				if(!this.cc.id){
					this.configSlimSelect.set('');
				}else{
					this.configSlimSelect.set(this.cc.id);
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
		async mounted() {
			tippy.setDefaultProps({
				arrow: false,
				animation: 'scale',
				theme: 'netgz',
			});

			tippy('[data-tippy-content]');

			tippy('#command_info_icon', {
                content: document.getElementById('command_info'),
                allowHTML: true,
                interactive: true,
                trigger: 'click',
                arrow: false,
                delay: [0,0],
            });

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
					data: [],
					onChange: (info) => {
						this.cc.mod_files = info.map(choice => choice.value);
					},
				});
				
				this.loadGameSlimSelect = new SlimSelect({
					select: '#load_game_selector',
					placeholder: 'Select Save to Load',
					data: [],
					allowDeselect: true,
					onChange: (info) => {
						this.cc.save_file = info.value || '';
					},
				})

				await this.fetchConfigs();
				await this.fetchMods();
				await this.fetchSaves();

				this.modSlimSelect.set(this.cc.mod_files);
				this.loadGameSlimSelect.set(this.cc.save_file);				
			}catch(error){
				// This library has an annoying bug on render currently
			}
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
				private: 1,
				players: 2,
				map: '',
				skill: -1,
				mode: 'coop',
				netmode: 0,
				save_file: '',
			}
			document.getElementById('cc_private').checked = true;
		},
	}
}
