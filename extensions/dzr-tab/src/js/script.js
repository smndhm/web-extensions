var Conf = {
	app_id: 216424,
	urls: {
		api: "https://api.deezer.com/"
	},
	calls: [{
			title: "Top playlists",
			url: "chart/0/playlists"
		},
		{
			title: "Moments tracks",
			url: "playlist/53362031/tracks"
		},
		{
			title: "Charts",
			url: "chart/0/tracks"
		}
	],
	limit: 50,
	store: {
		time: 60 * 60 * 1000,
	},
	ga: "UA-18714908-8"
};

window.onload = function () {

	Tab.init();

};