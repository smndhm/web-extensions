/**
 * Tab
 */

var Tab = {

	$: {
		logo: document.querySelector('#logo'),
		track: document.querySelector('#track')
	},

	browser: Utils.browser(),

	init: function () {

		Tab.$.logo.href = Tab.__link(Tab.$.logo.href);

		Tab.browser.storage.sync.get(['api_call', 'last_call', 'uuid'], function (storage) {

			var storage_api_call = storage.api_call || 0;
			var storage_last_call = storage.last_call || null;
			var storage_uuid = storage.uuid || null;
			var date = new Date();
			var timestamp = date.getTime();
			var refresh_data = !storage_last_call || !localStorage.dzData || (timestamp - storage_last_call) > Conf.store.time;

			if (!storage_uuid) {

				var UUID = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();

				Tab.browser.storage.sync.set({
					uuid: UUID
				}, function () {
					localStorage.uuid = UUID;
				});

			}

			if (refresh_data) {

				Utils.getJson(Conf.urls.api + Conf.calls[storage_api_call].url + '?limit=' + Conf.limit, function (response) {

					if (response.data && response.data.length) {

						var data_type = response.data[0].type;

						if (data_type == 'playlist' || data_type == 'album') {

							response.data = response.data.slice(0, 5);

							Utils.getJson(Conf.urls.api + 'playlist/' + Utils.random(response.data).id + '/tracks?limit=' + Conf.limit, function (response) {
								if (response.data && response.data.length) {
									Tab.storeTracks(response.data, timestamp);
								} else {
									Tab.setTrack();
								}
							});

						} else if (data_type == 'track') {
							Tab.storeTracks(response.data, timestamp);
						}

					} else {
						Tab.setTrack();
					}

				});

			} else {
				Tab.setTrack();
			}

		});

	},

	storeTracks: function (data, timestamp) {

		Tab.browser.storage.sync.set({
			last_call: parseInt(timestamp)
		}, function () {
			localStorage.dzData = JSON.stringify(data);
			Tab.setTrack();

		});

	},

	setTrack: function () {

		var dzData = JSON.parse(localStorage.dzData);
		var dzMedia = Utils.random(dzData);

		//background url
		var backgroundUrl = dzMedia.album.cover_big || 'https://api.deezer.com/album/' + dzMedia.album.id + '/image?size=500';

		Vibrant.from(backgroundUrl).getPalette(function (err, palette) {
			var rgbaFrom = 'rgba(' + palette.Vibrant._rgb[0] + ', ' + palette.Vibrant._rgb[1] + ', '  + palette.Vibrant._rgb[2] + ', 1)';
			var rgbaTo = 'rgba(' + palette.Muted._rgb[0] + ', ' + palette.Muted._rgb[1] + ', ' + palette.Muted._rgb[2] + ', 1)';
			document.body.style.backgroundImage = 'linear-gradient(to right top, ' + rgbaFrom + ', ' + rgbaTo + ')';
			var o = Math.round(((parseInt(palette.Vibrant._rgb[0]) * 299) + (parseInt(palette.Vibrant._rgb[1]) * 587) + (parseInt(palette.Vibrant._rgb[2]) * 114)) / 1000);
			if (o <= 125) {
				document.body.classList.add('white');
			}
		});

		//cover
		var coverA = Tab.$.track.querySelector('.track-cover a');
		coverA.href = Tab.__link(dzMedia.link);
		coverA.querySelector('img').src = backgroundUrl;

		//h2
		var h2A = Tab.$.track.querySelector('.track-title a');
		h2A.href = Tab.__link(dzMedia.link);
		h2A.appendChild(document.createTextNode(dzMedia.title));

		//h3
		var h3A = Tab.$.track.querySelector('.track-artist a');
		h3A.href = Tab.__link(dzMedia.artist.link);
		h3A.appendChild(document.createTextNode(dzMedia.artist.name));

	},

	__link: function (link) {
		return link + (Conf && Conf.app_id != null ? '?app_id=' + Conf.app_id : '');
	}

};