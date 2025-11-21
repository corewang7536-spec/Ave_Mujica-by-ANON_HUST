(function(){
	var DEFAULT_STORAGE_KEY='aveMujicaBgMusicState';

	function clampIndex(idx,length){
		if(!length){return 0;}
		var mod=idx%length;
		return mod<0?mod+length:mod;
	}

	function safeParse(json){
		if(!json){return null;}
		try{return JSON.parse(json);}catch(e){return null;}
	}

	window.initBackgroundMusic=function(options){
		options=options||{};
		var playlist=Array.isArray(options.playlist)?options.playlist.slice():[];
		if(!playlist.length){return null;}
		var button=document.querySelector(options.buttonSelector||'#bgMusicControl');
		var basePath=typeof options.basePath==='string'?options.basePath:'';
		var storageKey=options.storageKey||DEFAULT_STORAGE_KEY;
		var autoplay=options.autoplay!==false;

		var audio=new Audio();
		audio.preload='auto';
		var enabled=true;
		var index=0;
		var pendingSeek=null;

		var storedState=safeParse(sessionStorage.getItem(storageKey))||safeParse(localStorage.getItem(storageKey));
		if(storedState){
			if(typeof storedState.index==='number'){
				index=clampIndex(storedState.index,playlist.length);
			}
			if(storedState.enabled===false){
				enabled=false;
			}
		}

		function pathFor(name){
			return basePath+encodeURIComponent(name).replace(/%20/g,' ');
		}

		function updateButton(){
			if(!button){return;}
			if(!enabled){
				button.textContent='背景音乐：已关闭';
			}else{
				button.textContent='背景音乐：'+(audio.paused?'已暂停':'播放中');
			}
		}

		function applySavedPosition(name){
			if(!storedState||storedState.name!==name){return;}
			var time=storedState.time;
			if(typeof time!=='number'||!isFinite(time)||time<0){return;}
			if(audio.readyState>=1){
				try{audio.currentTime=time;}catch(e){pendingSeek=time;}
			}else{
				pendingSeek=time;
			}
		}

		audio.addEventListener('loadedmetadata',function(){
			if(pendingSeek!==null){
				try{audio.currentTime=pendingSeek;}catch(e){}
				pendingSeek=null;
			}
		});

		var lastSaveTs=0;
		function saveState(){
			var state={
				index:index,
				name:playlist[index%playlist.length],
				enabled:enabled,
				time:audio.currentTime||0,
				playing:!audio.paused&&enabled
			};
			try{
				sessionStorage.setItem(storageKey,JSON.stringify(state));
				localStorage.setItem(storageKey,JSON.stringify(state));
			}catch(e){}
			storedState=state;
		}
		function throttleSave(){
			var now=Date.now();
			if(now-lastSaveTs>1200){
				lastSaveTs=now;
				saveState();
			}
		}

		function loadCurrent(){
			var name=playlist[index%playlist.length];
			if(!name){return;}
			audio.src=pathFor(name);
			applySavedPosition(name);
		}

		audio.addEventListener('timeupdate',throttleSave);
		audio.addEventListener('pause',function(){updateButton();saveState();});
		audio.addEventListener('playing',function(){updateButton();saveState();});
		audio.addEventListener('ended',function(){
			index=(index+1)%playlist.length;
			loadCurrent();
			saveState();
			if(enabled){
				audio.play().catch(function(err){
					console.warn('背景音乐播放失败',err);
					updateButton();
				});
			}else{
				updateButton();
			}
		});

		document.addEventListener('visibilitychange',function(){
			if(document.hidden){saveState();}
		});
		window.addEventListener('pagehide',saveState);
		window.addEventListener('beforeunload',saveState);

		if(button){
			button.addEventListener('click',function(){
				if(!enabled){
					enabled=true;
					loadCurrent();
					audio.play().catch(function(err){
						console.warn('背景音乐播放失败',err);
					});
				}else{
					enabled=false;
					audio.pause();
				}
				updateButton();
				saveState();
			});
		}

		loadCurrent();
		var shouldPlay=enabled&&(!storedState||storedState.playing!==false)&&autoplay;
		if(shouldPlay){
			audio.play().catch(function(err){
				console.warn('背景音乐播放失败',err);
				updateButton();
			});
		}else{
			audio.pause();
		}

		updateButton();
		saveState();

		var control={
			pause:function(){
				audio.pause();
				updateButton();
				saveState();
			},
			resume:function(){
				if(!enabled){return;}
				audio.play().then(function(){
					updateButton();
					saveState();
				}).catch(function(err){
					console.warn('背景音乐恢复失败',err);
				});
			},
			isPlaying:function(){
				return !audio.paused&&enabled;
			},
			disable:function(){
				enabled=false;
				audio.pause();
				updateButton();
				saveState();
			},
			enable:function(){
				if(enabled){return;}
				enabled=true;
				loadCurrent();
				audio.play().catch(function(err){
					console.warn('背景音乐播放失败',err);
				}).finally(function(){
					updateButton();
					saveState();
				});
			}
		};

		window.__bgMusicControl=control;
		return control;
	};
})();
