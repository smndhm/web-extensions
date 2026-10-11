/**
 * Tab
 */

import { Vibrant } from 'node-vibrant/browser';
import { Conf } from './conf';
import { BLACK, Utils, WHITE, type Rgb } from './utils';

export const Tab = {
  $: {
    logo: document.querySelector<HTMLAnchorElement>('#logo a')!,
    track: document.querySelector<HTMLElement>('#track')!,
  },

  init: async function () {
    Tab.$.logo.href = Tab.__link(Tab.$.logo.href);

    const storage = await browser.storage.sync.get(['api_call', 'last_call', 'uuid']);

    const storage_api_call = (storage.api_call as number) || 0;
    const storage_last_call = (storage.last_call as number) || null;
    const storage_uuid = storage.uuid || null;
    const timestamp = Date.now();
    const refresh_data =
      !storage_last_call || !localStorage.dzData || timestamp - storage_last_call > Conf.store.time;

    if (!storage_uuid) {
      const UUID = (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();

      await browser.storage.sync.set({ uuid: UUID });
      localStorage.uuid = UUID;
    }

    if (refresh_data) {
      Utils.getJson(
        Conf.urls.api + Conf.calls[storage_api_call]!.url + '?limit=' + Conf.limit,
        function (response) {
          if (response.data && response.data.length) {
            const data_type = response.data[0].type;

            if (data_type == 'playlist' || data_type == 'album') {
              response.data = response.data.slice(0, 5);

              Utils.getJson(
                Conf.urls.api + 'playlist/' + Utils.random<any>(response.data).id + '/tracks?limit=' + Conf.limit,
                function (response) {
                  if (response.data && response.data.length) {
                    Tab.storeTracks(response.data, timestamp);
                  } else {
                    Tab.setTrack();
                  }
                },
              );
            } else if (data_type == 'track') {
              Tab.storeTracks(response.data, timestamp);
            }
          } else {
            Tab.setTrack();
          }
        },
      );
    } else {
      Tab.setTrack();
    }
  },

  storeTracks: async function (data: any[], timestamp: number) {
    await browser.storage.sync.set({ last_call: timestamp });
    localStorage.dzData = JSON.stringify(data);
    Tab.setTrack();
  },

  setTrack: function () {
    const dzData = JSON.parse(localStorage.dzData);
    const dzMedia = Utils.random<any>(dzData);

    //background url
    const backgroundUrl =
      dzMedia.album.cover_big || 'https://api.deezer.com/album/' + dzMedia.album.id + '/image?size=500';

    Vibrant.from(backgroundUrl)
      .getPalette()
      .then(function (palette) {
        if (!palette.Vibrant || !palette.Muted) return;
        // Text is drawn over the whole gradient: pick the text color that contrasts best with both ends,
        // then shade the ends until that contrast reaches WCAG AA (4.5:1)
        const ends = [palette.Vibrant.rgb, palette.Muted.rgb] as Rgb[];
        const white = Utils.minContrast(WHITE, ends) >= Utils.minContrast(BLACK, ends);
        const [from, to] = Utils.ensureContrast(ends, white ? WHITE : BLACK, 4.5);
        document.body.style.backgroundImage =
          'linear-gradient(to right top, ' + Utils.rgb(from!) + ', ' + Utils.rgb(to!) + ')';
        document.body.classList.toggle('white', white);
      });

    //cover
    const coverA = Tab.$.track.querySelector<HTMLAnchorElement>('.track-cover a')!;
    coverA.href = Tab.__link(dzMedia.link);
    coverA.querySelector('img')!.src = backgroundUrl;

    //h2
    const h2A = Tab.$.track.querySelector<HTMLAnchorElement>('.track-title a')!;
    h2A.href = Tab.__link(dzMedia.link);
    h2A.appendChild(document.createTextNode(dzMedia.title));

    //h3
    const h3A = Tab.$.track.querySelector<HTMLAnchorElement>('.track-artist a')!;
    h3A.href = Tab.__link(dzMedia.artist.link);
    h3A.appendChild(document.createTextNode(dzMedia.artist.name));
  },

  __link: function (link: string) {
    return link + (Conf && Conf.app_id != null ? '?app_id=' + Conf.app_id : '');
  },
};
