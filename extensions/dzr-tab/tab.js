/**
 * Tab
 */

var Tab = function () {

	var self = this,
		tool = new Tool(),
		d = tool.document,
		logo = d.querySelector('#logo'),
		background = d.querySelector('#background'),
		infos = d.querySelector('#infos'),
		cover = d.querySelector('#cover a'),
		fs;

	this.params;

	this.init = function (params) {

		self.params = params || null;

		logo.href = self.__link(logo.href);

		browser.storage.sync.get(['api_call', 'last_call'], function (storage) {

			var storage_api_call = storage.api_call || 0,
				storage_last_call = storage.last_call || null,
				date = new Date(),
				timestamp = date.getTime(),
				refresh_data = !storage_last_call || !localStorage.dzData || (timestamp - storage_last_call) > self.params.store.time;

				_gaq.push(['_trackEvent', 'settings', 'api_call', self.params.calls[storage_api_call].title]);
				_gaq.push(['_trackEvent', 'refresh_data', refresh_data?'true':'false']);

			if (refresh_data) {

				tool.getJson(self.params.urls.api + self.params.calls[storage_api_call].url + '?limit=' + self.params.limit, function(response) {

					if (response.data && response.data.length) {

						var data_type = response.data[0].type;
						
						if (data_type == 'playlist' || data_type == 'album') {

							response.data = response.data.slice(0, 5);

							// console.log(response.data);

							tool.getJson(self.params.urls.api + 'playlist/' + tool.random(response.data).id + '/tracks?limit=' + self.params.limit, function(response) {
								if (response.data && response.data.length) {
									self.storeTracks(response.data, timestamp);
								}
								else {
									self.setTrack();
								}
							});

						}
						else if (data_type == 'track') {
							self.storeTracks(response.data, timestamp);
						}
						
					}
					else {
						self.setTrack();
					}

				});

			}
			else {
				self.setTrack();
			}

		});

	}

	this.storeTracks = function (data, timestamp) {

		browser.storage.sync.set({
			last_call: parseInt(timestamp)
		}, function() {
			
			localStorage.dzData = JSON.stringify(data);
			self.setTrack();
			
		});

	};

	this.setTrack = function () {

		var dzData = JSON.parse(localStorage.dzData),
			dzMedia = tool.random(dzData);

		_gaq.push(['_trackEvent', 'media', dzMedia.type, dzMedia.id+'']);

		//background url
		var backgroundUrl = dzMedia.album.cover_big || 'https://api.deezer.com/album/' + dzMedia.album.id + '/image?size=500'

		//set background
		background.style.backgroundImage = 'url(' + backgroundUrl + ')';

		//udate infos
		infos.innerHtml = '';
		var h2  = d.createElement('h2'),
			h2a = d.createElement('a'),
			h3  = d.createElement('h3'),
			h3a = d.createElement('a');
		//h2
		h2a.textContent = dzMedia.title;
		h2a.href = self.__link(dzMedia.link);
		h2.appendChild(h2a);
		infos.appendChild(h2);
		//h3
		h3a.textContent = dzMedia.artist.name;
		h3a.href = self.__link(dzMedia.artist.link);
		h3.appendChild(h3a);
		infos.appendChild(h3);

		//update link
		cover.href = self.__link(dzMedia.link);

		//insert cover
		cover.innerHtml = '';
		var img = d.createElement('img');
		img.src = backgroundUrl;
		cover.appendChild(img);

	};

	this.__link = function (link) {
		return link + (self.params && self.params.app_id!=null ? '?app_id=' + self.params.app_id : '');
	};

};

new Tab().init(params);