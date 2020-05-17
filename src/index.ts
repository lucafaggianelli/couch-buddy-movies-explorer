import axios from 'axios'
import { CouchBuddyExtension, Movie, DownloadOption } from 'couch-buddy-extensions'

interface YtsTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

interface YtsMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  state: string;
  torrents: YtsTorrent[];
  date_uploaded: string;
  date_uploaded_unix: number;
}

interface YtsMoviesSearchResult {
  movie_count: number;
  limit: number;
  page_number: number;
  movies: YtsMovie[];
}

const TRACKERS = [
  'udp://glotorrents.pw:6969/announce',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://torrent.gresille.org:80/announce',
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.coppersurfer.tk:6969',
  'udp://tracker.leechers-paradise.org:6969',
  'udp://p4p.arenabg.ch:1337',
  'udp://tracker.internetwarriors.net:1337'
].map(t => `&tr=${t}`).join('')

function getDownloadOptions (movie: YtsMovie): DownloadOption[] {
  const title = encodeURIComponent(movie.title)

  if (Array.isArray(movie.torrents)) {
    return movie.torrents.map(torrent => ({
      quality: parseInt(torrent.quality),
      type: 'torrent',
      url: `magnet:?xt=urn:btih:${torrent.hash}&dn=${title}${TRACKERS}`
    }))
  }

  return []
}

function toCbMovie (movie: YtsMovie): Movie {
  return {
    backdrop: movie.background_image_original,
    downloadOptions: getDownloadOptions(movie),
    genre: movie.genres.join(','),
    imdbId: movie.imdb_code,
    language: movie.language,
    plot: movie.description_full,
    poster: movie.large_cover_image,
    rated: movie.mpa_rating,
    runtime: movie.runtime,
    title: movie.title_english,
    year: movie.year
  }
}

export default class TorrentExplorer extends CouchBuddyExtension {
  name = 'Torrent Explorer';

  async explore (query: string): Promise<Movie[]> {
    const response = await axios.get('https://yts.mx/api/v2/list_movies.json', {
      // eslint-disable-next-line @typescript-eslint/camelcase
      params: { query_term: query }
    })

    if (response.data.status === 'ok') {
      const result = response.data.data as YtsMoviesSearchResult
      return result.movies.map(toCbMovie)
    }

    return []
  }
}
