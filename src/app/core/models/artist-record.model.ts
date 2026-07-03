import { Link } from "./link.model";

export interface ArtistRecord {
    id: string;
    name: string;
    releaseYear: string;
    type: 'Album' | 'EP' | 'Single';
    links: Link[];
    songs: string[];
    coverUrl: string;
}